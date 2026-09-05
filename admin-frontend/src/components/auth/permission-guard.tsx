"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldCheck } from "@phosphor-icons/react"
import { canAccess, Feature } from "@/lib/permissions"

function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md text-center space-y-3">
        <ShieldCheck className="w-10 h-10 text-amber-800 mx-auto" />
        <h1 className="text-lg font-bold text-gray-900">Access denied</h1>
        <p className="text-xs text-gray-500">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-amber-800 text-white rounded-xl font-semibold text-xs"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

export default function PermissionGuard({
  feature,
  children,
}: {
  feature: Feature
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!canAccess(feature)) return <AccessDenied />

  return <>{children}</>
}