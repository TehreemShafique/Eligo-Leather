"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminSettingsLanguagesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/settings/general")
  }, [router])

  return (
    <div className="p-8 text-center text-xs text-gray-500 font-sans">
      Languages settings have been removed. Redirecting...
    </div>
  )
}
