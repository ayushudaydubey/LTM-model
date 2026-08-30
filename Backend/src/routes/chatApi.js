const express = require('express')
const authMiddelware = require('../middelware/authMiddelware')
const chatApiController = require('../controllers/chatApiController')

const router = express.Router()

// create chat
router.post('/create', authMiddelware, chatApiController.createChat)
router.post('/', authMiddelware, chatApiController.createChat)

// list chats for logged-in user
router.get('/', authMiddelware, chatApiController.getChats)

// get messages for a specific chat
router.get('/:chatId/messages', authMiddelware, chatApiController.getMessagesForChat)

// rename chat
router.put('/:chatId/rename', authMiddelware, chatApiController.renameChat)
router.patch('/:chatId/rename', authMiddelware, chatApiController.renameChat)

// pin/unpin chat
router.put('/:chatId/pin', authMiddelware, chatApiController.togglePinChat)
router.patch('/:chatId/pin', authMiddelware, chatApiController.togglePinChat)

// delete chat
router.delete('/:chatId', authMiddelware, chatApiController.deleteChat)

module.exports = router
