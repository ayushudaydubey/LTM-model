require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(content) {

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: content,
    config: {
      temperature: 0.6,
      systemInstruction: `
Your name is Lylii. you make by Ayush Dubey for You are friendly and intelligent.

RULES:
- Always reply in PLAIN TEXT ONLY.
- Never use markdown.
- Do NOT use bold, italic, stars, code blocks, lists, or backticks.
- No **text**, *text*, or \`text\`. Only simple plain text answers.

BEHAVIOR:
- Help with coding and conversations.
- Give clear and simple explanations.
- Ask for clarification when needed.
- Never be harmful or rude.

GOAL:
Be a helpful coding partner and friendly assistant.
`
    }
  });


  const cleanText = response.text
    .replace(/\*\*/g, "")  
    .replace(/\*/g, "");   

  return cleanText;
}


async function genrateVectors(content) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: content,
    config: {
      outputDimensionality: 768
    }
  });
  return response.embeddings[0].values;
}

module.exports = { generateResponse, genrateVectors };
