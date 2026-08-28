"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { UnsavedChangesProvider } from "@/components/unsaved-changes"
import { getAuthToken, patchFetch } from "@/lib/api"

patchFetch()

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === "/login"
  const isSettings = pathname.startsWith("/settings")
  const [authorized, setAuthorized] = useState(isLogin)

  useEffect(() => {
    if (isLogin) {
      setAuthorized(true)
      return
    }
    const token = getAuthToken()
    if (!token) {
      router.replace("/login")
      return
    }
    setAuthorized(true)
  }, [pathname, isLogin, router])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isSettings || isLogin) {
    return (
      <UnsavedChangesProvider>
        <div className="min-h-screen bg-[#f1f1f1] font-sans antialiased text-[#1a1a1a] overflow-x-hidden">
          {children}
        </div>
      </UnsavedChangesProvider>
    )
  }

  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen bg-[#f1f1f1] font-sans antialiased text-[#1a1a1a] overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6">
            <div className="mx-auto w-full max-w-[1280px] min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </UnsavedChangesProvider>
  )
}
