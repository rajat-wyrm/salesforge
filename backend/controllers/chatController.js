const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const { GoogleGenAI } = require('@google/genai');

const handleChat = asyncHandler(async (req, res) => {
  const { message, context, userId } = req.body;

  if (!message) {
    throw new AppError("Message is required.", 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("[DEBUG] [ChatController] GEMINI_API_KEY exists?", !!apiKey);
  
  if (!apiKey) {
    throw new AppError("Gemini API Key is not configured.", 503);
  }

  try {
    console.log("[DEBUG] [ChatController] Initializing GoogleGenAI client...");
    const ai = new GoogleGenAI({ apiKey });
    
    let systemPrompt = "You are a helpful AI assistant for SalesForge, a fintech application. Keep your answers short, concise, and easy-to-understand. Do not write long paragraphs.";
    if (context === "landing") {
      systemPrompt += " The user is on the landing page. Guide them on finding new leads or managing existing ones.";
    } else if (context === "user") {
      systemPrompt += " The user is on their dashboard. Help them with personal logins, activities, and managing their sales pipeline.";
    } else if (context === "global") {
      systemPrompt += " The user is navigating the global system. Provide insights on system stats and general fintech features.";
    }

    console.log("[DEBUG] [ChatController] Calling Gemini generateContent...");
    const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
            systemInstruction: systemPrompt
        }
    });
    
    console.log("[DEBUG] [ChatController] Received successful response from Gemini");

    const reply = aiResponse.text;

    return res.status(200).json({ success: true, data: { reply } });
  } catch (error) {
    console.error("[DEBUG] [ChatController] Full Chat API error:", error);
    // Log nested details if they exist in Google SDK errors
    if (error.response) console.error("Error Response:", error.response);
    if (error.details) console.error("Error Details:", error.details);
    
    // Return actual error message so the frontend (and I) can see it
    return res.status(500).json({ 
        success: false, 
        message: "Failed to generate AI response: " + (error.message || error.toString()),
        details: error.details || null 
    });
  }
});

module.exports = {
  handleChat
};
