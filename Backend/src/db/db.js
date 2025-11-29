const mongoose = require ("mongoose")


async function connectDB() {
  
  try {
    mongoose.connect(process.env.MONGODB_URI)
    console.log("connected to Database");
    
  } catch (err) {
    console.log("error -",err);
    
  }

}
module.exports = connectDB