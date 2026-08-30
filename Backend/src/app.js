const express = require("express")
const app  = express()
const cookieParser  = require("cookie-parser")
const userRoutes = require("./routes/userRoute")
const chatRoutes  = require("./routes/chatRoutes")
const chatApiRoutes = require("./routes/chatApi")
const cors  = require('cors')
const path = require("path")


// middelwares
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname,"../public")))
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
  : (origin, callback) => callback(null, true);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}))

//routes 

app.use("/api/auth",userRoutes)
app.use("/api/chat",chatRoutes)
// additional API routes (newer version)
app.use("/api/chatv2", chatApiRoutes)

app.get("*name",(req,res)=>{
  res.sendFile(path.join(__dirname,"../public/index.html"))
})



module.exports = app