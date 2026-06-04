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
          content: "You are 'Aura AI', a friendly fitness coach. Keep your answers EXTREMELY SHORT, SIMPLE, and EASY to understand. Use 1-2 short sentences only. No long lists or complex words. If the user asks for a plan, give only 3 simple steps." 
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
