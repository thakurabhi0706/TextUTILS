import express from "express"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import Session from "../models/Session.js"

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads")

/* ---------- MULTER SETUP ---------- */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

/* ---------- ERROR HANDLING MIDDLEWARE ---------- */
const handleMongoErrors = (err, req, res, next) => {
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
  
  if (err.message && err.message.includes('chunk too big')) {
    return res.status(413).json({ 
      error: 'Content too large. Please reduce the size of your text or clear some chat messages.' 
    })
  }
  
  next(err)
}

/* ---------- CREATE SESSION ---------- */
router.post("/new", async (req, res) => {
  try {
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const newSession = await Session.create({
      sessionId: shortCode,
      shortCode,
      content: "",
      files: [],
    })

    res.json({ id: newSession.sessionId })
  } catch (err) {
    res.status(500).json({ error: "Failed to create session" })
  }
})

/* ---------- GET SESSION ---------- */
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    res.json(session)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch session" })
  }
})

/* ---------- SAVE CONTENT ---------- */
router.post("/:id/content", async (req, res) => {
  try {
    const { content } = req.body

    // Check content size before saving
    if (content && content.length > 10000000) {
      return res.status(413).json({ 
        error: 'Content too large. Maximum size is 10MB.' 
      })
    }

    const updated = await Session.findOneAndUpdate(
      { sessionId: req.params.id },
      { content },
      { new: true }
    )

    res.json(updated)
  } catch (err) {
    if (err.name === 'MongoServerError' && err.code === 167) {
      return res.status(413).json({ 
        error: 'Content too large. Please reduce the size of your text or clear some chat messages.' 
      })
    }
    
    if (err.message && err.message.includes('chunk too big')) {
      return res.status(413).json({ 
        error: 'Content too large. Please reduce the size of your text or clear some chat messages.' 
      })
    }
    
    res.status(500).json({ error: "Failed to save session" })
  }
})

/* ---------- FILE UPLOAD ---------- */
router.post("/:id/files", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const fileData = {
      filename: req.file.filename, // Generated unique filename
      originalname: req.file.originalname, // Original filename
      mimetype: req.file.mimetype, // MIME type
      size: req.file.size, // File size in bytes
      url: `/uploads/${req.file.filename}`, // Relative URL
    }

    const session = await Session.findOne({ sessionId: req.params.id })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    session.files.push(fileData)
    await session.save()

    res.json(fileData)
  } catch (err) {
    console.error('File upload error:', err)
    res.status(500).json({ error: "Upload failed" })
  }
})

/* ---------- DELETE FILE ---------- */
router.delete("/:id/files/:index", async (req, res) => {
  try {
    const { index } = req.params
    const session = await Session.findOne({ sessionId: req.params.id })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    // Remove file from array
    session.files.splice(parseInt(index), 1)
    await session.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" })
  }
})

/* ---------- SAVE CHAT MESSAGES ---------- */
router.post("/:id/chat-messages", async (req, res) => {
  try {
    const { messages } = req.body

    // Check message count limit
    if (messages && messages.length > 100) {
      return res.status(413).json({ 
        error: 'Too many chat messages. Maximum is 100 messages. Please clear the chat to continue.' 
      })
    }

    const session = await Session.findOne({ sessionId: req.params.id })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    session.chatMessages = messages
    await session.save()

    res.json({ success: true })
  } catch (err) {
    if (err.name === 'MongoServerError' && err.code === 167) {
      return res.status(413).json({ 
        error: 'Chat history too large. Please clear some messages to continue.' 
      })
    }
    
    if (err.message && err.message.includes('chunk too big')) {
      return res.status(413).json({ 
        error: 'Chat history too large. Please clear some messages to continue.' 
      })
    }
    
    res.status(500).json({ error: "Failed to save chat messages" })
  }
})

export default router