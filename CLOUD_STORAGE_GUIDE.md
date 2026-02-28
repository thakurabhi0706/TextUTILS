# 🌩 Cloud Storage Implementation Guide

## 🚨 Why Local Storage Fails on Render

Render's free tier uses **ephemeral filesystem**:
- Files are stored temporarily during deployment
- Files are **lost** when container restarts
- No persistence across deployments
- Not suitable for production file storage

## 🎯 Recommended Solutions

### 1️⃣ Cloudinary (Easiest)
**Best for:** Images, documents, media files
**Free Tier:** 25GB storage, 25GB bandwidth/month

**Implementation:**
```bash
npm install cloudinary multer-storage-cloudinary
```

**Backend Changes:**
```javascript
import cloudinary from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'textutils-files'
})
```

### 2️⃣ AWS S3 (Most Scalable)
**Best for:** All file types, enterprise
**Free Tier:** 5GB storage, 20,000 requests/month

**Implementation:**
```bash
npm install aws-sdk multer-s3
```

**Backend Changes:**
```javascript
import AWS from 'aws-sdk'
import multerS3 from 'multer-s3'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET,
  key: (req, file) => `textutils/${Date.now()}-${file.originalname}`
})
```

### 3️⃣ Supabase Storage (Modern Alternative)
**Best for:** Real-time apps, good free tier
**Free Tier:** 1GB storage, 2GB bandwidth/month

**Implementation:**
```bash
npm install @supabase/supabase-js multer-sharp-s3
```

## 🚀 Quick Fix for Current App

For immediate deployment, use **Cloudinary** (easiest):

1. **Add to backend/.env:**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. **Update routes/sessions.js:**
```javascript
import cloudinary from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'textutils-files'
})

const upload = multer({ storage })
```

3. **Update file upload route:**
```javascript
router.post("/:id/files", upload.single("file"), async (req, res) => {
  try {
    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: req.file.url, // Cloudinary URL
    }
    
    // Save to MongoDB as before
    const session = await Session.findOne({ sessionId: req.params.id })
    session.files.push(fileData)
    await session.save()
    
    res.json(fileData)
  } catch (err) {
    res.status(500).json({ error: "Upload failed" })
  }
})
```

## 📋 Environment Variables for Production

**Cloudinary:**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
```

**AWS S3:**
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Supabase:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 🎯 Recommendation

**Start with Cloudinary** because:
- ✅ Easiest setup
- ✅ Good free tier
- ✅ Built-in image optimization
- ✅ CDN included
- ✅ No complex configuration

**Migration Steps:**
1. Choose Cloudinary
2. Create free account
3. Get API credentials
4. Update backend code
5. Add environment variables
6. Deploy to Render
7. Test file upload/download

This will make your file storage **persistent** and **production-ready**!
