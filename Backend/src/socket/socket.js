const { Server } = require("socket.io")
const cookie = require('cookie')
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const chatModel = require("../models/chatModel")
const aiService = require("../services/ai.services")
const messageModel = require("../models/messageModel")
const { queryMemory, createMemory } = require("../services/vector.service")

function generateChatTitle(prompt) {
  if (!prompt) return 'New Chat'
  let clean = prompt.replace(/^[\s\n\r\t]+/, '').replace(/^(\/|#|\*|>)/, '').trim()
  clean = clean.replace(/^(hey|hi|hello|please|can you|could you|help me with|tell me about|what is|how to)\s+/i, '')
  if (!clean) clean = prompt.trim()
  clean = clean.charAt(0).toUpperCase() + clean.slice(1)
  if (clean.length > 35) {
    clean = clean.slice(0, 32).trim() + '...'
  }
  return clean || 'Conversation'
}

function initSocketServer(httpServer) {

  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "")

    if (!cookies.token) {
      return next(new Error("unauthorized access - no token provided "))
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SEC_KEY)
      const user = await userModel.findById(decoded.id)

      if (!user) {
        return next(new Error("authentication error - user not found"))
      }

      socket.user = user
      next()

    } catch (error) {
      next(new Error("authentication error - invalid token "))
    }

  })

  io.on("connection", async (socket) => {
    socket.on("ai-message", async (messagePayload) => {
      try {
        if (!messagePayload || !messagePayload.chat || !messagePayload.content) {
          return
        }

        // Auto-update chat title and last activity
        try {
          const chatDoc = await chatModel.findById(messagePayload.chat)
          if (chatDoc) {
            const isGenericTitle = !chatDoc.title || chatDoc.title === 'New Chat' || chatDoc.title === 'Untitled Chat' || /^Chat\s*\d*$/i.test(chatDoc.title)
            const updates = { lastActivity: Date.now() }
            if (isGenericTitle && messagePayload.content) {
              const newTitle = generateChatTitle(messagePayload.content)
              updates.title = newTitle
              chatDoc.title = newTitle
              socket.emit("chat-updated", { chatId: chatDoc._id, title: newTitle })
            }
            await chatModel.findByIdAndUpdate(messagePayload.chat, updates)
          }
        } catch (err) {
          console.error("error auto-titling chat:", err.message)
        }

        // 1. Create User Message in MongoDB
        const message = await messageModel.create({
          user: socket.user._id,
          chat: messagePayload.chat,
          content: messagePayload.content,
          role: "user"
        })

        // 2. Generate and store vectors with safe fallback
        let vectors = null
        try {
          vectors = await aiService.genrateVectors(messagePayload.content)
          if (vectors) {
            await createMemory({
              vectors,
              messageId: message._id,
              metadata: {
                chat: messagePayload.chat,
                user: socket.user._id,
                text: messagePayload.content
              }
            })
          }
        } catch (vErr) {
          console.warn("Vector memory creation skipped:", vErr.message)
        }

        // 3. Query Memory & Chat History
        let memory = []
        try {
          if (vectors) {
            memory = await queryMemory({
              queryVector: vectors,
              limit: 5,
              metadata: { user: socket.user._id }
            })
          }
        } catch (qErr) {
          console.warn("Vector query memory skipped:", qErr.message)
        }

        const chatHistory = await messageModel
          .find({ chat: messagePayload.chat })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .then((messages) => messages.reverse())

        const stm = chatHistory.map((item) => ({
          role: item.role === "model" ? "model" : "user",
          parts: [{ text: item.content }]
        }))

        const memoryTexts = (memory || []).map((item) => item.metadata?.text).filter(Boolean)
        const ltm = memoryTexts.length > 0 ? [
          {
            role: "user",
            parts: [{
              text: `These are relevant memories from past conversations:\n${memoryTexts.join("\n")}`
            }]
          }
        ] : []

        // 4. Generate AI Response from Gemini
        const response = await aiService.generateResponse([...ltm, ...stm])

        // 5. Save AI message in MongoDB
        const responseMessages = await messageModel.create({
          user: socket.user._id,
          chat: messagePayload.chat,
          content: response,
          role: "model"
        })

        // 6. Vectorize AI response with safe fallback
        try {
          const responseVectors = await aiService.genrateVectors(response)
          if (responseVectors) {
            await createMemory({
              vectors: responseVectors,
              messageId: responseMessages._id,
              metadata: {
                chat: messagePayload.chat,
                user: socket.user._id,
                text: response
              }
            })
          }
        } catch (rvErr) {
          console.warn("AI vector save skipped:", rvErr.message)
        }

        // 7. Emit Response back to client
        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat
        })

      } catch (err) {
        console.error("ai-message error:", err)
        socket.emit("ai-response", {
          content: "I encountered an error processing your request. Please try again.",
          chat: messagePayload?.chat
        })
      }
    })
  })

}

module.exports = { initSocketServer }
