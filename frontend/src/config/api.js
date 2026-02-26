// API Configuration

const getApiUrl = () => {
  // Production
  if (process.env.NEXT_PUBLIC_API_BASE) {
    console.log("Using ENV API:", process.env.NEXT_PUBLIC_API_BASE)
    return process.env.NEXT_PUBLIC_API_BASE
  }

  // Development fallback
  const devUrl = "http://localhost:4000/api"
  console.log("Using DEV API:", devUrl)
  return devUrl
}

export const API_BASE = getApiUrl()
export const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000"

export { getApiUrl }