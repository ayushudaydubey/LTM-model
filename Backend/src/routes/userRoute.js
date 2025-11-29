const express  =  require("express")
const { registerUserController, loginUserController } = require("../controllers/userController")
const routes  = express.Router()


routes.post("/register", registerUserController)
routes.post("/login", loginUserController)



module.exports  = routes