import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  shortCode: { type: String, unique: true },
  content: { type: String, default: "" },
  files: { type: Array, default: [] },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24
  }
})

export default mongoose.model("Session", sessionSchema)