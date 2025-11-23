const { Server } = require("socket.io")
const cookie = require('cookie')
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const aiService = require("../services/ai.services")
const messageModel = require("../models/messageModel")
const { queryMemory, createMemory } = require("../services/vector.service")
const { chat } = require("@pinecone-database/pinecone/dist/assistant/data/chat")


function initSocketServer(httpServer) {

  const io = new Server(httpServer, {})

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "")

    if (!cookies.token) {
      next(new Error("unauthorized access - no token provided "))
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SEC_KEY)
      const user = await userModel.findById(decoded.id)

      socket.user = user
      next()

    } catch (error) {
      next(new Error("authentication errro - invalid token "))
    }

  })

  io.on("connection", async (socket) => {
    console.log("user connected ", socket.id);

    socket.on("ai-message", async (messagePayload) => {

      const message = await messageModel.create({
        user: socket.user._id,
        chat: messagePayload.chat,
        content: messagePayload.content,
        role: "user"
      })


      const vectors = await aiService.genrateVectors(messagePayload.content)

      console.log("vectors ==> ", vectors);

      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: messagePayload.content
        }
      })

      const memory = await queryMemory({
        queryVector: vectors,
        limit: 2,
        metadata: {

        }
      })

      console.log(memory);


      const chatHistory = await messageModel.find({
        chat: messagePayload.chat
      }).sort({ createdAt: -1 }).limit(20).lean()
      chatHistory.reverse();
      // console.log(chatHistory);




      const response = await aiService.generateResponse(chatHistory.map(item => {

        return {
          role: item.role,
          parts: [{ text: item.content }]
        }


      }))

      const responseMessages = await messageModel.create({
        user: socket.user._id,
        chat: messagePayload.chat,
        content: response,
        role: "model"
      })

      const responseVectors = await aiService.genrateVectors(response)

      await createMemory({
        vectors: responseVectors,
        messageId: responseMessages._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response
        }
      })


      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat



      })

    })
  })

}

module.exports = { initSocketServer }