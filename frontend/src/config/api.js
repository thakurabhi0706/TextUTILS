// API Configuration for different environments
const getApiConfig = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Production environment
    if (window.location.hostname !== 'localhost') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || `https://your-render-app.onrender.com/api`
      console.log('Production API URL:', apiUrl)
      return {
        API_BASE: apiUrl,
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      }
    }
  }
  
  // Development environment
  const devApiUrl = "http://localhost:4000/api"
  console.log('Development API URL:', devApiUrl)
  return {
    API_BASE: devApiUrl,
    APP_URL: "http://localhost:3000"
  }
}

export const { API_BASE, APP_URL } = getApiConfig()

// Export for SSR compatibility
export const getApiUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Production environment
    if (window.location.hostname !== 'localhost') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || `https://your-render-app.onrender.com/api`
      console.log('Production getApiUrl:', apiUrl)
      return apiUrl
    }
    // Development environment
    const devUrl = "http://localhost:4000/api"
    console.log('Development getApiUrl:', devUrl)
    return devUrl
  }
  // Server-side (SSR) - fallback to localhost
  const ssrUrl = "http://localhost:4000/api"
  console.log('SSR getApiUrl:', ssrUrl)
  return ssrUrl
}
