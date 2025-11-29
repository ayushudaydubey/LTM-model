require("dotenv").config()
const { GoogleGenAI } =  require("@google/genai")


const ai = new GoogleGenAI({});

async function generateResponse(content) {

const response  = await ai.models.generateContent({
  model:"gemini-2.5-flash",
  contents:content,
  config:{
    temperature:0.6,
    systemInstruction:""
  }

})
return response.text
}

async function genrateVectors(content) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
        contents: content,
        config:{
          outputDimensionality:768
        }
  })
  return response.embeddings[0].values;

}


module.exports = {generateResponse,genrateVectors}