const { Server } = require("socket.io")
const cookie = require('cookie')
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const aiService = require("../services/ai.services")
const messageModel = require("../models/messageModel")

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
    socket.on("ai-message", async (messagePayload) => {
      await messageModel.create({
        user: socket.user._id,
        chat: messagePayload.chat,
        content: messagePayload.content,
        role: "user"
      })


      const chatHistory = await messageModel.find({
        chat: messagePayload.chat
      }).sort({createdAt:-1}).limit(20).lean() 
      chatHistory.reverse();


  
      const response = await aiService.generateResponse(chatHistory.map(item =>{
        return {
          role:item.role,
          parts:[{text:item.content}]
        }
      }))

      await messageModel.create({
        user: socket.user._id,
        chat: messagePayload.chat,
        content: response,
        role: "model"
      })

      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat



      })

    })

  })

}

module.exports = { initSocketServer }