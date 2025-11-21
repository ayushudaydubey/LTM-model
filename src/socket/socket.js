const { Server } = require("socket.io")
const cookie = require('cookie')
const jwt = require("jsonwebtoken")
const userModel = require("../models/userModel")
const aiService = require("../services/ai.services")

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
      console.log(messagePayload);

      const response = await aiService.generateResponse(messagePayload.content)

      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat
      })

    })

  })

}

module.exports = { initSocketServer }