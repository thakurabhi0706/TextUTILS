import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

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

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // readable

export function generateShortId(length = 6) {
  let id = ""
  for (let i = 0; i < length; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return id
}

export function createUniqueSession() {
  const sessions = readSessions()
  let id

  do {
    id = generateShortId()
  } while (sessions[id])

  sessions[id] = {
    content: "",
    files: [],
    createdAt: Date.now(),
  }

  writeSessions(sessions)
  return id
}
