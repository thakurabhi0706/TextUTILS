import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import sessionRoutes from "./routes/sessions.js"
import connectDB from "./config/db.js"
import { askAI } from "./lib/api.js"
import "dotenv/config"

const app = express()
const PORT = process.env.PORT || 4000
const NODE_ENV = process.env.NODE_ENV || "development"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

connectDB()

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.FRONTEND_URL
    ]

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // allow all for now (safe for your project)
    }
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() })
})

// Simple test endpoint
app.get("/api/test", (req, res) => {
  res.status(200).json({ 
    message: "Backend is working!", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
})

app.use("/api/sessions", sessionRoutes)

app.post("/api/ai/ask", async (req, res) => {
  try {
    const { prompt, content } = req.body
    const reply = await askAI(prompt, content)
    res.json({ reply })
  } catch (err) {
    console.error('Error caught:', err.name, err.message)
    res.status(500).json({ error: err.message })
  }
})

// Global error handler - MUST be after all routes
app.use((err, req, res, next) => {
  console.error('Error caught:', err.name, err.message)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: Object.values(err.errors).map(e => e.message)
    })
  }
  
  if (err.name === 'MongoServerError' && err.code === 167) {
    return res.status(413).json({ 
      error: 'Content too large. Please reduce the size of your text or clear some chat messages.' 
    })
  }
  
  if (err.message && (err.message.includes('chunk too big') || err.message.includes('BSON object too large'))) {
    return res.status(413).json({ 
      error: 'Content too large. Please reduce the size of your text or clear some chat messages.' 
    })
  }
  
  // Handle any other MongoDB-related errors
  if (err.name && err.name.includes('Mongo')) {
    return res.status(413).json({ 
      error: 'Data too large. Please reduce content size or clear chat history.' 
    })
  }
  
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})