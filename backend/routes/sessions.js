import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"
import { nanoid } from "nanoid"
import { generateShortCode } from "./shortCode.js"

const router = express.Router()

/* ---------------- PATHS ---------------- */

const DATA_DIR = path.join("data")
const SESSIONS_PATH = path.join(DATA_DIR, "sessions.json")
const SHORTLINKS_PATH = path.join(DATA_DIR, "shortlinks.json")
const UPLOAD_DIR = path.join("uploads")

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR)
if (!fs.existsSync(SESSIONS_PATH)) fs.writeFileSync(SESSIONS_PATH, "{}")
if (!fs.existsSync(SHORTLINKS_PATH)) fs.writeFileSync(SHORTLINKS_PATH, "{}")

/* ---------------- HELPERS ---------------- */

const readSessions = () =>
  JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf-8"))

const writeSessions = (data) =>
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify(data, null, 2))

const readShortLinks = () =>
  JSON.parse(fs.readFileSync(SHORTLINKS_PATH, "utf-8"))

const writeShortLinks = (data) =>
  fs.writeFileSync(SHORTLINKS_PATH, JSON.stringify(data, null, 2))

/* ---------------- FILE UPLOAD ---------------- */

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const upload = multer({ storage })

/* =========================================================
   1️⃣ CREATE SESSION
   ========================================================= */

router.post("/", (req, res) => {
  const sessions = readSessions()
  const sessionId = nanoid(6).toUpperCase()

  sessions[sessionId] = { content: "", files: [] }
  writeSessions(sessions)

  res.json({ sessionId })
})

/* =========================================================
   2️⃣ GENERATE SHORT LINK
   ========================================================= */

router.post("/shortlink", (req, res) => {
  const { sessionId } = req.body
  if (!sessionId) return res.status(400).json({ error: "sessionId required" })

  const shortLinks = readShortLinks()

  const existing = Object.entries(shortLinks).find(
    ([, value]) => value === sessionId
  )
  if (existing) {
    return res.json({ shortCode: existing[0], sessionId })
  }

  let shortCode
  do {
    shortCode = generateShortCode()
  } while (shortLinks[shortCode])

  shortLinks[shortCode] = sessionId
  writeShortLinks(shortLinks)

  res.json({ shortCode, sessionId })
})

/* =========================================================
   3️⃣ LOAD SESSION
   ========================================================= */

router.get("/:sessionId", (req, res) => {
  const sessions = readSessions()
  res.json(sessions[req.params.sessionId] || { content: "", files: [] })
})

/* =========================================================
   4️⃣ SAVE CONTENT
   ========================================================= */

router.post("/:sessionId/content", (req, res) => {
  const { content } = req.body
  const sessions = readSessions()

  sessions[req.params.sessionId] ??= { content: "", files: [] }
  sessions[req.params.sessionId].content = content

  writeSessions(sessions)
  res.json({ success: true })
})

/* =========================================================
   5️⃣ FILE UPLOAD
   ========================================================= */

router.post("/:sessionId/files", upload.single("file"), (req, res) => {
  const sessions = readSessions()
  const { sessionId } = req.params

  sessions[sessionId] ??= { content: "", files: [] }

  const fileData = {
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    type: req.file.mimetype,
  }

  sessions[sessionId].files.push(fileData)
  writeSessions(sessions)

  res.json(fileData)
})

/* =========================================================
   6️⃣ DELETE FILE
   ========================================================= */

router.delete("/:sessionId/files/:index", (req, res) => {
  const sessions = readSessions()
  sessions[req.params.sessionId]?.files.splice(req.params.index, 1)
  writeSessions(sessions)
  res.json({ success: true })
})

export default router
