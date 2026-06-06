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

exports.analyzeFoodImage = async (req, res) => {
  try {
    const { image } = req.body; // Expecting base64 string

    if (!image) {
      return res.status(400).json({ success: false, error: "No image data provided" });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ success: false, error: "Gemini API key is not configured in the environment." });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze this food image and provide the following details in a strict JSON format:
      {
        "foodItem": "Name of the food",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
      If multiple items are present, estimate the total for the entire plate. 
      Only return the JSON object, nothing else.
    `;

    // Remove the data:image/jpeg;base64, prefix if it exists
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting in response
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const foodData = JSON.parse(text);
      res.json({ success: true, ...foodData });
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      res.status(500).json({ success: false, error: "Failed to analyze image correctly" });
    }
  } catch (error) {
    console.error("Gemini AI Image Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
