const { Server } = require("socket.io")
const cookie = require('cookie')
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const aiService = require("../services/ai.services")
const messageModel = require("../models/messageModel")
const { queryMemory, createMemory } = require("../services/vector.service")

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
    // console.log("user connected ", socket.id);

    socket.on("ai-message", async (messagePayload) => {

  
      const [ message,vectors ] = await Promise.all([
        messageModel.create({
        user: socket.user._id,
        chat: messagePayload.chat,
        content: messagePayload.content,
        role: "user"
      }),
       aiService.genrateVectors(messagePayload.content)
      ])

      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: messagePayload.content
        }
      })

     /*  const memory = await queryMemory({
        queryVector: vectors,
        limit: 5,
        metadata: {
          user: socket.user._id
        }
      })

      console.log(memory);

      const chatHistory = await messageModel.find({
        chat: messagePayload.chat
      }).sort({ createdAt: -1 }).limit(20).lean()
 
      chatHistory.reverse();    */

      const  [memory,chatHistory] = await Promise.all([
         queryMemory({
        queryVector: vectors,
        limit: 5,
        metadata: {
          user: socket.user._id
        }
      }),
      messageModel.find({
        chat: messagePayload.chat
      }).sort({ createdAt: -1 }).limit(20).lean().then(messages=>messages.reverse())
 
      
      ])

      const stm = chatHistory.map(item => {
        return {
          // FIX: convert any invalid role to "user"
          role: item.role === "model" ? "model" : "user",
          parts: [{ text: item.content }]
        }
      })

      const ltm = [
        {
          // FIX: "system" → "user"
          role: "user",
          parts: [{
            text: `
            these are some previous messages  from the chat ,use them to genrate a response 

            ${memory.map(item => item.metadata.text).join("\n")}
            `
          }]
        }
      ]

      // console.log(ltm[0]);
      // console.log(stm);

      const response = await aiService.generateResponse([...ltm, ...stm])

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
