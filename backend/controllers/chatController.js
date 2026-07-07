const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../middleware/errorHandler");
const { GoogleGenAI } = require('@google/genai');

const handleChat = asyncHandler(async (req, res) => {
  const { message, history, context } = req.body;

  if (!message) {
    throw new AppError("Message is required.", 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AppError("Gemini API Key is not configured.", 503);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let systemPrompt = "You are a helpful AI assistant for SalesForge, a fintech application. Keep your answers short, concise, and easy-to-understand. Do not write long paragraphs.";
    if (context === "landing") {
      systemPrompt += " The user is on the landing page. Guide them on finding new leads or managing existing ones.";
    } else if (context === "user") {
      systemPrompt += " The user is on their dashboard. Help them with personal logins, activities, and managing their sales pipeline.";
    } else if (context === "global") {
      systemPrompt += " The user is navigating the global system. Provide insights on system stats and general fintech features.";
    }

    const contents = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.sender === "user" || msg.sender === "bot") {
          contents.push({ role: msg.sender === "user" ? "user" : "model", parts: [{ text: msg.text }] });
        }
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const aiResponse = await ai.models.generateContent({
        model,
        contents,
        config: {
            systemInstruction: systemPrompt
        }
    });

    const reply = aiResponse.text;

    return res.status(200).json({ success: true, data: { reply } });
  } catch (error) {
    return res.status(500).json({
        success: false,
        message: "Failed to generate AI response. Please try again later."
    });
  }
});

module.exports = {
  handleChat
};
