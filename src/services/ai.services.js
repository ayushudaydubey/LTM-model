require("dotenv").config()
const { GoogleGenAI } =  require("@google/genai")


const ai = new GoogleGenAI({});

async function generateResponse(content) {

const response  = await ai.models.generateContent({
  model:"gemini-2.5-flash",
  contents:content
})
return response.candidates[0].content.parts[0].text 
}


module.exports = {generateResponse}