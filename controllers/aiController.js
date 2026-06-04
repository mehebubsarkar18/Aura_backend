const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
  try {
    const { message, userContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are 'Aura AI', a highly motivational and knowledgeable personal fitness and wellness coach for the AuraFit app. Your tone is professional, encouraging, and slightly futuristic. Use the user's provided context (goals, metrics) to give specific, actionable advice. Keep responses concise and focused on health, nutrition, and exercise. If asked something unrelated to fitness or wellness, politely steer the conversation back to their goals."
    });

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // Construct prompt with context
    const contextPrompt = `User Context: ${JSON.stringify(userContext)}\n\nUser Message: ${message}`;

    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
};
