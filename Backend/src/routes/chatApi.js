const express = require('express')
const authMiddelware = require('../middelware/authMiddelware')
const chatApiController = require('../controllers/chatApiController')

const router = express.Router()

// create chat
router.post('/create', authMiddelware, chatApiController.createChat)

// list chats for logged-in user
router.get('/', authMiddelware, chatApiController.getChats)

// get messages for a specific chat
router.get('/:chatId/messages', authMiddelware, chatApiController.getMessagesForChat)

module.exports = router
