const chatModel = require('../models/chatModel')
const messageModel = require('../models/messageModel')

async function createChat(req, res) {
  try {
    const { title } = req.body
    const user = req.user

    const chat = await chatModel.create({
      title: title || 'New Chat',
      user: user._id,
      lastActivity: Date.now()
    })

    return res.status(201).json({ message: 'chat created', chat })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function getChats(req, res) {
  try {
    const user = req.user
    const chats = await chatModel
      .find({ user: user._id })
      .sort({ isPinned: -1, lastActivity: -1, updatedAt: -1, createdAt: -1 })
      .lean()

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
      title: c.title || 'Untitled Chat',
      isPinned: !!c.isPinned,
      lastActivity: c.lastActivity,
      createdAt: c.createdAt,
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
    const normalized = messages.map((m) => ({
      role: m.role === 'model' ? 'ai' : m.role === 'user' ? 'user' : m.role,
      text: m.content,
      createdAt: m.createdAt
    }))

    return res.json({ messages: normalized, chat: { id: chat._id, title: chat.title, isPinned: !!chat.isPinned } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function renameChat(req, res) {
  try {
    const user = req.user
    const { chatId } = req.params
    const { title } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' })
    }

    const chat = await chatModel.findOneAndUpdate(
      { _id: chatId, user: user._id },
      { title: title.trim() },
      { new: true }
    )

    if (!chat) return res.status(404).json({ message: 'Chat not found' })

    return res.json({ message: 'Chat renamed', chat })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function togglePinChat(req, res) {
  try {
    const user = req.user
    const { chatId } = req.params
    const { isPinned } = req.body

    const chat = await chatModel.findOne({ _id: chatId, user: user._id })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })

    chat.isPinned = typeof isPinned === 'boolean' ? isPinned : !chat.isPinned
    await chat.save()

    return res.json({ message: 'Chat pin status updated', chat })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function deleteChat(req, res) {
  try {
    const user = req.user
    const { chatId } = req.params

    const chat = await chatModel.findOneAndDelete({ _id: chatId, user: user._id })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })

    // delete all messages for this chat
    await messageModel.deleteMany({ chat: chatId })

    return res.json({ message: 'Chat deleted successfully', chatId })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  createChat,
  getChats,
  getMessagesForChat,
  renameChat,
  togglePinChat,
  deleteChat
}
