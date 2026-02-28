"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getApiUrl } from "@/config/api"

export default function ShareRedirect() {
  const { shortCode } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (!shortCode) return

    // Redirect to main page with session parameter
    router.push(`/?session=${shortCode}`)
  }, [shortCode, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading shared session...</p>
      </div>
    </div>
  )
}
