const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI with the token
// Note: Vertex AI usually requires a Project ID and Location. 
// We will try to use them from ENV or default to common ones.
const project = process.env.GOOGLE_PROJECT_ID || 'aurafit-app';
const location = process.env.GOOGLE_LOCATION || 'us-central1';

exports.chatWithAI = async (req, res) => {
  try {
    const { message, userContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "API key/token is not configured in Render environment." });
    }

    // Initialize Vertex with the AQ.A token provided as GEMINI_API_KEY
    const vertex_ai = new VertexAI({ project: project, location: location });

    // Instantiate the model
    const generativeModel = vertex_ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 500,
      },
      systemInstruction: {
        parts: [{ text: "You are 'Aura AI', a highly motivational and knowledgeable personal fitness and wellness coach for the AuraFit app. Your tone is professional, encouraging, and slightly futuristic. Use the user's provided context (goals, metrics) to give specific, actionable advice. Keep responses concise and focused on health, nutrition, and exercise. If asked something unrelated to fitness or wellness, politely steer the conversation back to their goals." }]
      }
    });

    const contextPrompt = `User Context: ${JSON.stringify(userContext)}\n\nUser Message: ${message}`;

    const chat = generativeModel.startChat();
    const result = await chat.sendMessage(contextPrompt);
    const response = result.response;
    const text = response.candidates[0].content.parts[0].text;

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error("Vertex AI Chat Error Details:", error);
    const status = error.status || 500;
    const message = error.message || "Failed to get AI response";
    res.status(status).json({ error: `AI Error: ${message}` });
  }
};
