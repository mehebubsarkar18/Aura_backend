const OpenAI = require("openai");

// OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://aurafit.com", // Optional, for OpenRouter rankings
    "X-Title": "AuraFit", // Optional, for OpenRouter rankings
  }
});

exports.chatWithAI = async (req, res) => {
  try {
    const { message, userContext } = req.body;

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "OpenRouter API key is not configured in Render environment." });
    }

    // Debug log (safe): print first 6 chars of key to verify format
    console.log(`Using OpenRouter key starting with: ${key.substring(0, 6)}...`);

    const contextPrompt = `User Context: ${JSON.stringify(userContext)}\n\nUser Message: ${message}`;

    const response = await openai.chat.completions.create({
      model: "openrouter/free", 
      messages: [
        { 
          role: "system", 
          content: "You are 'Aura AI', a highly motivational and knowledgeable personal fitness and wellness coach for the AuraFit app. Your tone is professional, encouraging, and slightly futuristic. Use the user's provided context (goals, metrics) to give specific, actionable advice. Keep responses concise and focused on health, nutrition, and exercise. If asked something unrelated to fitness or wellness, politely steer the conversation back to their goals." 
        },
        { 
          role: "user", 
          content: contextPrompt 
        }
      ],
    });

    const reply = response.choices[0].message.content;

    res.json({ success: true, reply: reply });
  } catch (error) {
    console.error("OpenRouter AI Error Details:", error);
    const status = error.status || 500;
    const message = error.message || "Failed to get AI response";
    res.status(status).json({ error: `AI Error: ${message}` });
  }
};
