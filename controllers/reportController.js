const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Water = require('../models/Water');
const Wellness = require('../models/Wellness');
const Weight = require('../models/Weight');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const aggregatePeriodData = async (userId, start, end) => {
  const [workouts, nutrition, water, wellness, weights] = await Promise.all([
    Workout.find({ user: userId, loggedAt: { $gte: start, $lte: end } }),
    Nutrition.find({ user: userId, loggedAt: { $gte: start, $lte: end } }),
    Water.find({ user: userId, loggedAt: { $gte: start, $lte: end } }),
    Wellness.find({ user: userId, loggedAt: { $gte: start, $lte: end } }),
    Weight.find({ user: userId, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: 1 })
  ]);

  const caloriesBurned = workouts.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
  const activeMinutes = workouts.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const workoutCount = workouts.length;

  const caloriesConsumed = nutrition.reduce((acc, curr) => acc + curr.calories, 0);
  const protein = nutrition.reduce((acc, curr) => acc + (curr.protein || 0), 0);
  const carbs = nutrition.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const fat = nutrition.reduce((acc, curr) => acc + (curr.fat || 0), 0);

  const waterMl = water.reduce((acc, curr) => acc + curr.amountMl, 0);

  const sleepMinutes = wellness.reduce((acc, curr) => acc + curr.sleepDurationMin, 0);
  const mindfulnessMinutes = wellness.reduce((acc, curr) => acc + curr.mindfulnessDurationMin, 0);
  
  const avgSleep = wellness.length > 0 ? sleepMinutes / wellness.length : 0;
  
  const startWeight = weights.length > 0 ? weights[0].weight : null;
  const endWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const weightChange = (startWeight !== null && endWeight !== null) ? endWeight - startWeight : 0;

  return {
    period: { start, end },
    metrics: {
      caloriesBurned,
      activeMinutes,
      workoutCount,
      caloriesConsumed,
      protein,
      carbs,
      fat,
      waterMl,
      avgSleep,
      mindfulnessMinutes,
      weightChange,
      startWeight,
      endWeight
    }
  };
};

// @desc    Get fitness report data
// @route   GET /api/reports/summary
// @access  Private
const getReportData = async (req, res) => {
  const { type } = req.query; // 'weekly' or 'monthly'
  const now = new Date();
  let currentStart, currentEnd, prevStart, prevEnd;

  if (type === 'monthly') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // Weekly (past 7 days vs previous 7 days)
    currentStart = new Date();
    currentStart.setDate(now.getDate() - 7);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date();
    currentEnd.setHours(23, 59, 59, 999);

    prevStart = new Date();
    prevStart.setDate(now.getDate() - 14);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd = new Date();
    prevEnd.setDate(now.getDate() - 7);
    prevEnd.setHours(23, 59, 59, 999);
  }

  try {
    const [currentData, prevData] = await Promise.all([
      aggregatePeriodData(req.user.id, currentStart, currentEnd),
      aggregatePeriodData(req.user.id, prevStart, prevEnd)
    ]);

    res.status(200).json({
      success: true,
      type,
      current: currentData,
      previous: prevData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error generating report data' });
  }
};

// @desc    Share report via email
// @route   POST /api/reports/share
// @access  Private
const shareReport = async (req, res) => {
  const { type, email, reportData } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Recipient email is required' });
  }

  try {
    // Create PDF
    const doc = new PDFDocument();
    let buffers = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
// Setup email transporter
// Flexible SMTP configuration (works with Gmail, Brevo, Mailgun, etc.)
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fallback to Ethereal only if no USER is provided
if (!process.env.EMAIL_USER) {
  let testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

        const mailOptions = {
          from: `"AuraFit Reports" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`,
          to: email,
          subject: `Your AuraFit ${type.charAt(0).toUpperCase() + type.slice(1)} Fitness Report`,
          text: `Attached is your ${type} fitness report from AuraFit. Keep up the great work!`,
          attachments: [
            {
              filename: `AuraFit_${type}_Report.pdf`,
              content: pdfBuffer,
            },
          ],
        };

        console.log(`Attempting to send email via ${process.env.EMAIL_HOST}...`);
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).json({ success: true, message: 'Report shared successfully via email' });
      } catch (err) {
        console.error('Detailed Email Error:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            error: 'Failed to send email',
            details: err.message // Send actual error message to help debug
          });
        }
      }
    });

    // Draw PDF content
    doc.fontSize(25).text('AuraFit Fitness Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Report Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(18).text('Performance Metrics', { underline: true });
    doc.fontSize(12).text(`Total Calories Burned: ${reportData.current.metrics.caloriesBurned} kcal`);
    doc.text(`Active Minutes: ${reportData.current.metrics.activeMinutes} min`);
    doc.text(`Workouts Completed: ${reportData.current.metrics.workoutCount}`);
    doc.text(`Calories Consumed: ${reportData.current.metrics.caloriesConsumed} kcal`);
    doc.text(`Water Intake: ${reportData.current.metrics.waterMl} mL`);
    doc.text(`Average Sleep: ${(reportData.current.metrics.avgSleep / 60).toFixed(1)} hrs`);
    doc.text(`Weight Change: ${reportData.current.metrics.weightChange > 0 ? '+' : ''}${reportData.current.metrics.weightChange} kg`);
    
    doc.moveDown();
    doc.fontSize(18).text('Progress Comparison', { underline: true });
    const compare = (curr, prev) => {
        if (!prev) return curr > 0 ? '+100%' : '0%';
        const diff = ((curr - prev) / prev) * 100;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };
    doc.fontSize(12).text(`Calories Burned vs Prev Period: ${compare(reportData.current.metrics.caloriesBurned, reportData.previous.metrics.caloriesBurned)}`);
    doc.text(`Active Minutes vs Prev Period: ${compare(reportData.current.metrics.activeMinutes, reportData.previous.metrics.activeMinutes)}`);

    doc.end();

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Server Error sharing report' });
    }
  }
};

module.exports = {
  getReportData,
  shareReport
};
