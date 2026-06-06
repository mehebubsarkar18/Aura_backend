const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.chatWithAI = async (req, res) => {
  try {
    const { message, userContext } = req.body;

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "OpenRouter API key is not configured in the environment." });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
      defaultHeaders: {
        "HTTP-Referer": "https://aurafit.com",
        "X-Title": "AuraFit",
      }
    });

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
