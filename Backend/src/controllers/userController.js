const userModel = require("../models/userModel");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

async function registerUserController(req, res) {
  try {
    const { email, fullName: { firstName, lastName }, password } = req.body

    const isUserExist = await userModel.findOne({ email })
    if (isUserExist) {
      return res.status(400).json({
        message: "user already exist"
      })
    }

    const hashPassword = await bcrypt.hash(password, 10)

    const user = await userModel.create({
      fullName: { firstName, lastName },
      email,
      password: hashPassword
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SEC_KEY)
    res.cookie("token", token)

    return res.status(201).json({
      message: "user register successfully",
      token,
      user
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Registration failed" })
  }
}

async function loginUserController(req, res) {
  try {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(404).json({
        message: "invalid email or password"
      })
    }

    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return res.status(404).json({
        message: "invalid email or password"
      })
    }

    const token = await jwt.sign({ id: user._id }, process.env.JWT_SEC_KEY)
    res.cookie("token", token)

    return res.status(200).json({
      message: "login successful",
      token,
      user
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Login failed" })
  }
}

async function getMeController(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    return res.json({ user: req.user })
  } catch (err) {
    return res.status(500).json({ message: "Server error" })
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  getMeController
}