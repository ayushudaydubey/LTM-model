require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function generateResponse(content) {
  try {
    // Ensure content is valid array with non-empty parts
    const validContent = (Array.isArray(content) ? content : [{ role: "user", parts: [{ text: String(content) }] }])
      .filter(item => item && item.parts && item.parts.length > 0 && item.parts[0].text?.trim());

    if (validContent.length === 0) {
      validContent.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: validContent,
      config: {
        temperature: 0.6,
        systemInstruction: `
Your name is Lilly AI. You are a friendly, highly capable, and intelligent AI assistant.

RULES:
- Provide clear, well-structured, helpful, and concise responses.
- Be supportive, knowledgeable, and polite.

GOAL:
Be a helpful coding partner, thinker, and daily assistant.
`
      }
    });

    const cleanText = response.text || "I am ready to help! What would you like to explore?";
    return cleanText;
  } catch (err) {
    console.error("Gemini generateContent error:", err.message);
    return "I am here to help! Could you please repeat or rephrase your question?";
  }
}

async function genrateVectors(content) {
  if (!content || !content.trim()) return null;
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: content,
      config: {
        outputDimensionality: 768
      }
    });
    return response?.embeddings?.[0]?.values || null;
  } catch (err) {
    // Fail quietly without interrupting chat
    return null;
  }
}

module.exports = { generateResponse, genrateVectors };
