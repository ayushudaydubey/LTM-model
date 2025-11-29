const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel.js");

async function authMiddelware(req, res, next) {
  const token = req.cookies.token;  // FIX: extract token correctly

  if (!token) {
    return res.status(401).json({
      message: "unAuthorized"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC_KEY);

    const user = await userModel.findById(decoded.id);

    req.user = user;   
    next();           

  } catch (err) {
    console.log("UnAuthorized");
    return res.status(401).json({
      message: "Invalid token"
    });
  }
}

module.exports = authMiddelware;
