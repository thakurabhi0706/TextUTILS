import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me"

const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const payload = jwt.verify(token, JWT_SECRET)

    req.user = {
      id: payload.id,
      email: payload.email,
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

export default requireAuth
