require("dotenv").config()
const app = require("./src/app");
const connectDB = require("./src/db/db");
const { initSocketServer } = require("./src/socket/socket");
const httpServer = require('http').createServer(app)


const io = initSocketServer(httpServer)


httpServer.listen(3000,()=>{
  connectDB()
  console.log("server is running ");
  
})