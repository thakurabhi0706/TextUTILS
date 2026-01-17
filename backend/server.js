import express from "express"
import cors from "cors"
import sessionRoutes from "./routes/sessions.js"
import path from "path"
import { fileURLToPath } from "url"

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
