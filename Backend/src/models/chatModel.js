const mongoose = require("mongoose")

const chatSchema = mongoose.Schema({
  title: {
    type: String,
    default: 'New Chat'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

const chatModel = mongoose.model("chat", chatSchema)

module.exports = chatModel