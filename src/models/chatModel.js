const mongooes  = require ("mongoose")

const chatSchema  = mongooes.Schema({
  title:{
    type:String,
  },
  user:{
    type:mongooes.Schema.Types.ObjectId,
    ref:"user",
    required:true
  }
  ,lastActivity:{
    type:Date,
    default:Date.now
  }

},{
  timestamps:true
})

const chatModel  =  mongooes.model("chat",chatSchema)

module.exports  = chatModel