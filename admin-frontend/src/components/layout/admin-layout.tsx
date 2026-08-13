"use client"

import { usePathname } from "next/navigation"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSettings = pathname.startsWith("/settings")
  const isLogin = pathname === "/login"

  if (isSettings || isLogin) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] font-sans antialiased text-[#1a1a1a] overflow-x-hidden">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f1f1f1] font-sans antialiased text-[#1a1a1a] overflow-hidden">
      {/* Left Sidebar Menu */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6">
          <div className="mx-auto w-full max-w-[1280px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
