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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

connectDB()

app.use(cors())
app.use(express.json())

app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/sessions", sessionRoutes)

app.post("/api/ai/ask", async (req, res) => {
  try {
    const { prompt, content } = req.body
    const reply = await askAI(prompt, content)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})