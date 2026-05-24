const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aurafit';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    
    const conn = await mongoose.connect(connUri);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Ensure MongoDB is installed and running locally, or verify your MONGO_URI.');
    process.exit(1);
  }
};

module.exports = connectDB;
