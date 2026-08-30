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
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
    : (origin, callback) => callback(null, true);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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

        const chatId = messagePayload.chat
        const userContent = messagePayload.content
        const userId = socket.user._id

        // 1. Asynchronously auto-title chat & update lastActivity (non-blocking)
        chatModel.findById(chatId).then((chatDoc) => {
          if (chatDoc) {
            const isGenericTitle = !chatDoc.title || chatDoc.title === 'New Chat' || chatDoc.title === 'Untitled Chat' || /^Chat\s*\d*$/i.test(chatDoc.title)
            const updates = { lastActivity: Date.now() }
            if (isGenericTitle && userContent) {
              const newTitle = generateChatTitle(userContent)
              updates.title = newTitle
              chatDoc.title = newTitle
              socket.emit("chat-updated", { chatId: chatDoc._id, title: newTitle })
            }
            chatModel.findByIdAndUpdate(chatId, updates).catch((e) => console.error("Error updating title:", e.message))
          }
        }).catch((e) => console.error("Error checking chat:", e.message))

        // 2. Parallel: Save user message in DB + Fetch recent chat history
        const userMsgPromise = messageModel.create({
          user: userId,
          chat: chatId,
          content: userContent,
          role: "user"
        })

        const chatHistoryPromise = messageModel
          .find({ chat: chatId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
          .then((messages) => messages.reverse())

        // 3. Fast Vector Memory Query with tight timeout (max 400ms so it never delays response)
        const memoryPromise = (async () => {
          try {
            const vectorPromise = aiService.genrateVectors(userContent)
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 400))
            const vectors = await Promise.race([vectorPromise, timeoutPromise])

            if (vectors) {
              // Queue Pinecone upsert for user message in background (fire-and-forget)
              userMsgPromise.then((userMsg) => {
                createMemory({
                  vectors,
                  messageId: userMsg._id,
                  metadata: {
                    chat: chatId,
                    user: userId,
                    text: userContent
                  }
                }).catch(() => {})
              }).catch(() => {})

              // Fast memory query with tight timeout
              const queryTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 300))
              const matches = await Promise.race([
                queryMemory({
                  queryVector: vectors,
                  limit: 3,
                  metadata: { user: userId }
                }),
                queryTimeout
              ])
              return matches || []
            }
          } catch (mErr) {
            // Pinecone timeout or disabled -> smoothly proceed with short-term history
          }
          return []
        })()

        // Wait in parallel for history and memory
        const [userMsgDoc, chatHistory, memory] = await Promise.all([
          userMsgPromise,
          chatHistoryPromise,
          memoryPromise
        ])

        // Build Gemini conversation context
        const stm = (chatHistory || []).map((item) => ({
          role: item.role === "model" ? "model" : "user",
          parts: [{ text: item.content }]
        }))

        // Ensure current user message is in conversation context
        const lastStm = stm[stm.length - 1]
        if (!lastStm || lastStm.role !== "user" || lastStm.parts[0]?.text !== userContent) {
          stm.push({
            role: "user",
            parts: [{ text: userContent }]
          })
        }

        const memoryTexts = (memory || []).map((item) => item.metadata?.text).filter(Boolean)
        const ltm = memoryTexts.length > 0 ? [
          {
            role: "user",
            parts: [{
              text: `These are relevant memories from past conversations:\n${memoryTexts.join("\n")}`
            }]
          }
        ] : []

        // 4. Stream AI Response from Gemini (instant time-to-first-token in < 500ms)
        const fullResponse = await aiService.generateResponseStream(
          [...ltm, ...stm],
          (chunk) => {
            socket.emit("ai-chunk", {
              content: chunk,
              chat: chatId
            })
          }
        )

        // 5. Emit complete response
        socket.emit("ai-response", {
          content: fullResponse,
          chat: chatId
        })

        // 6. Post-Response Background Work: Save AI message to DB & Pinecone (NON-BLOCKING)
        setImmediate(async () => {
          try {
            const aiMsg = await messageModel.create({
              user: userId,
              chat: chatId,
              content: fullResponse,
              role: "model"
            })

            const responseVectors = await aiService.genrateVectors(fullResponse)
            if (responseVectors) {
              await createMemory({
                vectors: responseVectors,
                messageId: aiMsg._id,
                metadata: {
                  chat: chatId,
                  user: userId,
                  text: fullResponse
                }
              })
            }
          } catch (bgErr) {
            console.warn("Background AI vector/save warning:", bgErr.message)
          }
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
