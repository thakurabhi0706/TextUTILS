import express from "express"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { createUniqueSession } from "./shortCode.js"

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* backend/data */
const DATA_DIR = path.join(__dirname, "..", "data")
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json")

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, "{}")
}

const readSessions = () =>
  JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"))

const writeSessions = (data) =>
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2))

/* GET session (auto-create if missing) */
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

/* CREATE new short session */
router.post("/new", (req, res) => {
  const id = createUniqueSession()
  res.json({ id })
})

/* SAVE content */
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

export default router
