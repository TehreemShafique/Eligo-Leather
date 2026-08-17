"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PrivacyRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/settings/legal")
  }, [router])

  return (
    <div className="p-8 text-center text-xs text-gray-500 font-medium">
      Redirecting to Policies &amp; Customer Privacy...
    </div>
  )
}
