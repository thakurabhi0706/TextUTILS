// API Configuration

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE
  }

  return "/api"
}

export const API_BASE = getApiUrl()
export const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000"

export { getApiUrl }