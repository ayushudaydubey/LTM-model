

const express  = require("express")
const authMiddelware = require("../middelware/authMiddelware")
const chatController = require("../controllers/chatController")

const routes  = express.Router()

routes.post("/",authMiddelware,chatController)






module.exports  =routes