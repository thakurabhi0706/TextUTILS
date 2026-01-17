import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"
import { fileURLToPath } from "url"
import { createUniqueSession } from "./shortCode.js"

const router = express.Router()

/* ---------- PATH SETUP ---------- */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, "..", "data")
const UPLOAD_DIR = path.join(__dirname, "..", "uploads")
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json")

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, "{}")

const readSessions = () =>
  JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"))

const writeSessions = (data) =>
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2))

/* ---------- MULTER SETUP ---------- */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

/* ---------- GET SESSION (AUTO-CREATE) ---------- */
router.get("/:id", (req, res) => {
  const { id } = req.params
  const sessions = readSessions()

  if (!sessions[id]) {
    sessions[id] = {
      content: "",
      files: [],
      createdAt: Date.now(),
    }
    writeSessions(sessions)
  }

  res.json(sessions[id])
})

/* ---------- CREATE NEW SESSION ---------- */
router.post("/new", (req, res) => {
  const id = createUniqueSession()
  res.json({ id })
})

/* ---------- SAVE CONTENT ---------- */
router.post("/:id/content", (req, res) => {
  const { id } = req.params
  const { content } = req.body

  const sessions = readSessions()
  if (!sessions[id]) {
    sessions[id] = { content: "", files: [], createdAt: Date.now() }
  }

  sessions[id].content = content
  writeSessions(sessions)

  res.json({ success: true })
})

/* ---------- FILE UPLOAD (FIXED) ---------- */
router.post("/:id/files", upload.single("file"), (req, res) => {
  const { id } = req.params
  const sessions = readSessions()

  if (!sessions[id]) {
    sessions[id] = { content: "", files: [], createdAt: Date.now() }
  }

  const fileData = {
    name: req.file.originalname,
    type: req.file.mimetype,
    url: `/uploads/${req.file.filename}`,
  }

  sessions[id].files.push(fileData)
  writeSessions(sessions)

  res.json(fileData)
})

/* ---------- DELETE FILE ---------- */
router.delete("/:id/files/:index", (req, res) => {
  const { id, index } = req.params
  const sessions = readSessions()

  if (!sessions[id]) {
    return res.status(404).json({ error: "Session not found" })
  }

  const file = sessions[id].files[index]
  if (file) {
    const filePath = path.join(__dirname, "..", file.url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  sessions[id].files.splice(index, 1)
  writeSessions(sessions)

  res.json({ success: true })
})

export default router
