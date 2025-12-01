const express = require("express")
const app  = express()
const cookieParser  = require("cookie-parser")
const userRoutes = require("./routes/userRoute")
const chatRoutes  = require("./routes/chatRoutes")
const chatApiRoutes = require("./routes/chatApi")
const cors  = require('cors')


// middelwares
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))

//routes 

app.use("/api/auth",userRoutes)
app.use("/api/chat",chatRoutes)
// additional API routes (newer version)
app.use("/api/chatv2", chatApiRoutes)
app.use("/api/chatv2", chatApiRoutes)



module.exports = app