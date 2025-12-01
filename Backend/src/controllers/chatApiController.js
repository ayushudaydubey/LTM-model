const chatModel = require('../models/chatModel')
const messageModel = require('../models/messageModel')

async function createChat(req, res) {
  try {
    const { title } = req.body
    const user = req.user

    const chat = await chatModel.create({ title, user: user._id })

    return res.status(201).json({ message: 'chat created', chat })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function getChats(req, res) {
  try {
    const user = req.user
    const chats = await chatModel.find({ user: user._id }).sort({ lastActivity: -1, createdAt: -1 }).lean()

    // attach a preview (last message) for each chat
    const chatIds = chats.map((c) => c._id)
    const lastMessages = await messageModel.aggregate([
      { $match: { chat: { $in: chatIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$chat',
          content: { $first: '$content' },
          role: { $first: '$role' },
          createdAt: { $first: '$createdAt' }
        }
      }
    ])

    const previewMap = {}
    lastMessages.forEach((m) => {
      previewMap[m._id.toString()] = m
    })

    const out = chats.map((c) => ({
      id: c._id,
      title: c.title,
      lastActivity: c.lastActivity,
      preview: previewMap[c._id.toString()] || null
    }))

    return res.json({ chats: out })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function getMessagesForChat(req, res) {
  try {
    const user = req.user
    const { chatId } = req.params

    const chat = await chatModel.findById(chatId)
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    if (chat.user.toString() !== user._id.toString()) return res.status(403).json({ message: 'Forbidden' })

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 }).lean()

    // normalize role names if needed
    const normalized = messages.map((m) => ({ role: m.role === 'model' ? 'ai' : m.role === 'user' ? 'user' : m.role, text: m.content, createdAt: m.createdAt }))

    return res.json({ messages: normalized })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { createChat, getChats, getMessagesForChat }
