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

    const updated = await Session.findOneAndUpdate(
      { sessionId: req.params.id },
      { content },
      { new: true }
    )

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: "Failed to save session" })
  }
})

/* ---------- FILE UPLOAD ---------- */
router.post("/:id/files", upload.single("file"), async (req, res) => {
  try {
    const fileData = {
      name: req.file.originalname,
      type: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
    }

    const session = await Session.findOne({ sessionId: req.params.id })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    session.files.push(fileData)
    await session.save()

    res.json(fileData)
  } catch (err) {
    res.status(500).json({ error: "Upload failed" })
  }
})

export default router