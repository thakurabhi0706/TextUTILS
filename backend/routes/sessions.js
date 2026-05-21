import express from "express"
import jwt from "jsonwebtoken"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import Session from "../models/Session.js"
import requireAuth from "../middleware/auth.js"

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me"

const getUserIdFromToken = (req) => {
  try {
    const token = req.cookies?.token
    if (!token) return null
    const payload = jwt.verify(token, JWT_SECRET)
    return payload.id
  } catch {
    return null
  }
}

const isSessionEmpty = (session) => {
  const contentEmpty = !session.content || !session.content.trim()
  const hasMessages = Array.isArray(session.chatMessages) && session.chatMessages.length > 0
  const hasFiles = Array.isArray(session.files) && session.files.length > 0
  return contentEmpty && !hasMessages && !hasFiles
}

const cleanupEmptySession = async (session) => {
  if (!session) return

  if (isSessionEmpty(session) && session.owner) {
    session.owner = undefined
    session.preview = undefined
    session.expiresAt = undefined
    await session.save()
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads")

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

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

/* ---------- GET MY SESSIONS ---------- */
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const sessions = await Session.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .select("sessionId shortCode createdAt preview expiresAt content chatMessages files")

    const filteredSessions = []

    for (const session of sessions) {
      if (isSessionEmpty(session)) {
        await cleanupEmptySession(session)
        continue
      }
      filteredSessions.push(session)
    }

    // Remove internal fields before returning
    const responseSessions = filteredSessions.map(({ sessionId, shortCode, createdAt, preview, expiresAt }) => ({
      sessionId,
      shortCode,
      createdAt,
      preview,
      expiresAt,
    }))

    res.json({ sessions: responseSessions })
  } catch (err) {
    res.status(500).json({ error: "Failed to load saved sessions" })
  }
})


/* ---------- SAVE SESSION (make permanent + set expiry) ---------- */
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const { days } = req.body

    const session = await Session.findOne({ sessionId: req.params.id })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    // Do not allow saving empty sessions
    const hasChat = Array.isArray(session.chatMessages) && session.chatMessages.length > 0
    const hasContent = typeof session.content === 'string' && session.content.trim().length > 0
    if (!hasChat && !hasContent) {
      return res.status(400).json({ error: 'No chat or content to save. Add some messages before saving.' })
    }

    if (session.owner && session.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Session already claimed' })
    }

    session.owner = req.user.id

    // set preview from first chat message or content excerpt
    let preview = ''
    if (hasChat) {
      const first = session.chatMessages[0]
      preview = typeof first?.text === 'string' ? first.text : JSON.stringify(first || '')
    } else if (hasContent) {
      preview = session.content.substring(0, 200)
    }

    session.preview = preview

    if (typeof days === 'number' && days > 0) {
      session.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    } else {
      session.expiresAt = undefined
    }

    await session.save()

    res.json({ success: true, session: { sessionId: session.sessionId, shortCode: session.shortCode, preview: session.preview, createdAt: session.createdAt, expiresAt: session.expiresAt } })
  } catch (err) {
    console.error('Save session error:', err)
    res.status(500).json({ error: 'Failed to save session' })
  }
})


/* ---------- UPDATE RETENTION ---------- */
router.post('/:id/retain', requireAuth, async (req, res) => {
  try {
    const { days } = req.body

    const session = await Session.findOne({ sessionId: req.params.id })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    if (!session.owner || session.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (typeof days === 'number' && days > 0) {
      session.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    } else {
      session.expiresAt = undefined
    }

    await session.save()
    res.json({ success: true, expiresAt: session.expiresAt })
  } catch (err) {
    console.error('Retain session error:', err)
    res.status(500).json({ error: 'Failed to update retention' })
  }
})


/* ---------- DELETE SESSION ---------- */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    if (!session.owner || session.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await session.deleteOne()
    res.json({ success: true })
  } catch (err) {
    console.error('Delete session error:', err)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

/* ---------- CLAIM SESSION ---------- */
router.post("/:id/claim", requireAuth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    if (session.owner && session.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Session already claimed" })
    }

    session.owner = req.user.id
    await session.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Failed to claim session" })
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

    const session = await Session.findOneAndUpdate(
      { sessionId: req.params.id },
      { content },
      { new: true }
    )

    await cleanupEmptySession(session)

    res.json(session)
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
    await cleanupEmptySession(session)

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
    await cleanupEmptySession(session)

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