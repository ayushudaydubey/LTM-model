require("dotenv").config()
const { Pinecone } = require("@pinecone-database/pinecone")

let pcClient = null
let indexInstance = null
let authErrorLogged = false

function getIndex() {
  if (indexInstance) return indexInstance
  if (authErrorLogged) return null // Avoid repeated failed calls if key was rejected
  
  const apiKey = (process.env.PINECONE_API_KEY || "").trim()
  if (!apiKey) return null

  try {
    pcClient = new Pinecone({ apiKey })
    indexInstance = pcClient.index('helo-gpt')
    return indexInstance
  } catch (err) {
    return null
  }
}

async function createMemory({ vectors, metadata, messageId }) {
  if (authErrorLogged) return
  const index = getIndex()
  if (!index || !vectors) return

  try {
    await index.upsert([{
      id: messageId?.toString() || `${Date.now()}`,
      values: vectors,
      metadata
    }])
  } catch (err) {
    if (err.name === 'PineconeAuthorizationError' || err.message?.includes('API key')) {
      if (!authErrorLogged) {
        authErrorLogged = true
        console.warn("ℹ️ [Pinecone]: Vector memory is paused because the current Pinecone API key in .env needs updating. Chat continues smoothly with MongoDB memory.")
      }
    }
  }
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  if (authErrorLogged) return []
  const index = getIndex()
  if (!index || !queryVector) return []

  try {
    const data = await index.query({
      vector: queryVector,
      topK: limit,
      filter: metadata ? metadata : undefined,
      includeMetadata: true
    })
    return data?.matches || []
  } catch (err) {
    if (err.name === 'PineconeAuthorizationError' || err.message?.includes('API key')) {
      if (!authErrorLogged) {
        authErrorLogged = true
        console.warn("ℹ️ [Pinecone]: Vector memory is paused because the current Pinecone API key in .env needs updating. Chat continues smoothly with MongoDB memory.")
      }
    }
    return []
  }
}

module.exports = { createMemory, queryMemory }