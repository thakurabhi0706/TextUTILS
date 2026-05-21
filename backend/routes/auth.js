import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me"

if (!JWT_SECRET || JWT_SECRET.length === 0) {
  throw new Error("JWT_SECRET must have a value")
}

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  )
}

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

const createAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production"

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
    })

    const token = createToken(user)
    createAuthCookie(res, token)

    res.json({ user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    console.error("Register error:", err)
    res.status(500).json({ error: "Failed to create user" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = createToken(user)
    createAuthCookie(res, token)

    res.json({ user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ error: "Failed to login" })
  }
})

router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production"

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  })

  res.json({ success: true })
})

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token
    if (!token) {
      return res.status(200).json({ user: null })
    }

    const payload = verifyToken(token)
    const user = await User.findById(payload.id)
    if (!user) {
      return res.status(200).json({ user: null })
    }

    res.json({ user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    res.status(200).json({ user: null })
  }
})

export default router
