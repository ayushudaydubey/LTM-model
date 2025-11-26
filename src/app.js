const express = require("express")
const app  = express()
const cookieParser  = require("cookie-parser")
const userRoutes = require("./routes/userRoute")
const chatRoutes  = require("./routes/chatRoutes")


// middelwares
app.use(express.json())
app.use(cookieParser())

//routes 

app.use("/api/auth",userRoutes)
app.use("/api/chat",chatRoutes)



module.exports = app