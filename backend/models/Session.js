import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  shortCode: { type: String, unique: true },
  content: { 
    type: String, 
    default: "",
    maxlength: 10000000 // 10MB limit for content
  },
  files: { 
    type: Array, 
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 50; // Max 50 files
      },
      message: 'Too many files uploaded'
    }
  },
  chatMessages: { 
    type: Array, 
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 100; // Max 100 messages
      },
      message: 'Too many chat messages'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24
  }
})

// Add text index for better search performance
sessionSchema.index({ sessionId: 1 })

export default mongoose.model("Session", sessionSchema)