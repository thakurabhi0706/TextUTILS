import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  shortCode: { type: String, unique: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
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
  // Optional preview text to help identify sessions in the UI
  preview: {
    type: String,
    default: "",
    maxlength: 1000,
  },
  // Optional expiry date for TTL-based automatic deletion
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
})

// TTL index for expiresAt: documents will be removed when expiresAt passes
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Add text index for better search performance

export default mongoose.model("Session", sessionSchema)