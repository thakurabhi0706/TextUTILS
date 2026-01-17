"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function Redirect() {
  const { shortCode } = useParams()
  const router = useRouter()

  useEffect(() => {
    fetch(`http://localhost:4000/api/sessions/s/${shortCode}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.text()
      })
      .then(() => {})
      .catch(() => router.replace("/"))
  }, [shortCode])

  return <p className="p-6">Redirecting…</p>
}
