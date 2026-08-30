const express = require("express")
const { 
  registerUserController, 
  loginUserController, 
  getMeController 
} = require("../controllers/userController")
const authMiddleware = require("../middelware/authMiddelware")

const routes = express.Router()

routes.post("/register", registerUserController)
routes.post("/login", loginUserController)
routes.get("/me", authMiddleware, getMeController)
routes.post("/logout", (req, res) => {
  res.clearCookie("token")
  return res.json({ message: "Logged out" })
})

module.exports = routes