const chatModel = require("../models/chatModel.js")

async function chatController(req,res) {
  const {title } =req.body
  const user  = req.user 

  const chat = await chatModel.create({
    title,
    user:user._id
  })

  return res.status(201).json({
    messgae:"chat created ",
    chat
  })

}

module.exports =  chatController