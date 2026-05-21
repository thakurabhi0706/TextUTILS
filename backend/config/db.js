import mongoose from "mongoose"

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error("Missing MongoDB connection string. Set MONGO_URI or MONGODB_URI.")
    }

    await mongoose.connect(mongoUri)
    console.log("✅ MongoDB Connected")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error)
    process.exit(1)
  }
}

export default connectDB