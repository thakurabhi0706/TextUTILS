import express from "express"
import cors from "cors"
import sessionRoutes from "./routes/sessions.js"
import path from "path"
import { fileURLToPath } from "url"
import { askAI } from "./lib/api.js"
import "dotenv/config"


const app = express()
const PORT = 4000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
app.use(express.json())

app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/api/sessions", sessionRoutes)

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})


app.post("/api/ai/ask", async (req, res) => {
  try {
    const { prompt, content } = req.body
    const reply = await askAI(prompt, content)
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})




