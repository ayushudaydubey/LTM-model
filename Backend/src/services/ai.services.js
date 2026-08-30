require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `Your name is Lilly AI. You are a friendly, highly capable, and intelligent AI assistant.

RULES:
- Provide clear, well-structured, helpful, and concise responses.
- Be supportive, knowledgeable, and polite.
- Keep responses snappy, accurate, and direct.

GOAL:
Be a helpful coding partner, thinker, and daily assistant.`;

// Ultra-fast streaming response from Gemini (time-to-first-token < 500ms)
async function generateResponseStream(content, onChunk) {
  try {
    const validContent = (Array.isArray(content) ? content : [{ role: "user", parts: [{ text: String(content) }] }])
      .filter(item => item && item.parts && item.parts.length > 0 && item.parts[0].text?.trim());

    if (validContent.length === 0) {
      validContent.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    const modelsToTry = [
      { name: "gemini-2.0-flash", config: { temperature: 0.6, systemInstruction: SYSTEM_INSTRUCTION } },
      { name: "gemini-2.5-flash", config: { temperature: 0.6, systemInstruction: SYSTEM_INSTRUCTION, thinkingConfig: { thinkingBudget: 0 } } },
      { name: "gemini-1.5-flash", config: { temperature: 0.6, systemInstruction: SYSTEM_INSTRUCTION } }
    ];

    let fullText = "";

    for (const { name, config } of modelsToTry) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: name,
          contents: validContent,
          config
        });

        for await (const chunk of responseStream) {
          const chunkText = chunk.text;
          if (chunkText) {
            fullText += chunkText;
            if (typeof onChunk === "function") {
              onChunk(chunkText);
            }
          }
        }

        if (fullText.trim()) {
          return fullText;
        }
      } catch (streamErr) {
        console.warn(`[AI Service] Stream attempt with ${name} notice:`, streamErr.message);
      }
    }

    // If stream didn't yield, fallback to non-streaming
    if (!fullText.trim()) {
      fullText = await generateResponse(validContent);
      if (typeof onChunk === "function" && fullText) {
        onChunk(fullText);
      }
    }

    return fullText || "I am ready to help! What would you like to explore?";
  } catch (err) {
    console.error("Gemini generateResponseStream error:", err.message);
    const fallbackMsg = "I am here to help! Could you please repeat or rephrase your question?";
    if (typeof onChunk === "function") {
      onChunk(fallbackMsg);
    }
    return fallbackMsg;
  }
}

// Fast synchronous generation (fallback)
async function generateResponse(content) {
  try {
    const validContent = (Array.isArray(content) ? content : [{ role: "user", parts: [{ text: String(content) }] }])
      .filter(item => item && item.parts && item.parts.length > 0 && item.parts[0].text?.trim());

    if (validContent.length === 0) {
      validContent.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    const modelsToTry = [
      { name: "gemini-2.0-flash", config: { temperature: 0.6, systemInstruction: SYSTEM_INSTRUCTION } },
      { name: "gemini-2.5-flash", config: { temperature: 0.6, systemInstruction: SYSTEM_INSTRUCTION, thinkingConfig: { thinkingBudget: 0 } } },
      { name: "gemini-1.5-flash", config: { temperature: 0.6, systemInstruction: SYSTEM_INSTRUCTION } }
    ];

    for (const { name, config } of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: name,
          contents: validContent,
          config
        });

        const cleanText = response.text;
        if (cleanText && cleanText.trim()) {
          return cleanText;
        }
      } catch (genErr) {
        console.warn(`[AI Service] generateContent attempt with ${name} notice:`, genErr.message);
      }
    }

    return "I am ready to help! What would you like to explore?";
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
    return null;
  }
}

module.exports = { generateResponse, generateResponseStream, genrateVectors };
