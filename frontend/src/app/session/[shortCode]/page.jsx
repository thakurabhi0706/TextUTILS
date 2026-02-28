"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function SessionRedirect() {
  const { shortCode } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (!shortCode) return

    // Redirect to the correct /s/[shortCode] route
    router.replace(`/s/${shortCode}`)
  }, [shortCode, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
