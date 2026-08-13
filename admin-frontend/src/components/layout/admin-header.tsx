"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlass, Bell, Question, Command, CaretDown, SignOut } from "@phosphor-icons/react"
import { toast } from "sonner"

export function AdminHeader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    toast.success("Logged out successfully!")
    router.push("/login")
  }

  return (
    <header className="h-14 shrink-0 bg-[#ebebeb] border-b border-[#d2d2d2] px-5 flex items-center justify-between gap-4 z-40 select-none">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl min-w-0">
        <div className="relative flex items-center group">
          <MagnifyingGlass className="w-4 h-4 text-gray-500 absolute left-3 transition-colors group-focus-within:text-amber-800" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full h-9 pl-9 pr-14 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all shadow-sm"
          />
          <kbd className="absolute right-3 flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right Actions & Store Badge Dropdown */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2.5 text-gray-600 hover:text-amber-800 hover:bg-white/80 rounded-xl transition-all relative group cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-800 rounded-full ring-2 ring-white animate-pulse-soft" />
        </button>

        <button
          type="button"
          aria-label="Help & Documentation"
          className="p-2.5 text-gray-600 hover:text-amber-800 hover:bg-white/80 rounded-xl transition-all cursor-pointer"
        >
          <Question className="w-4 h-4" />
        </button>

        <div className="ml-2 h-7 w-px bg-gray-300" />

        {/* Store Badge & Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/80 transition-colors group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
              EL
            </div>
            <span className="hidden lg:inline text-xs font-bold text-gray-900">Eligo Leather</span>
            <CaretDown className={`w-3 h-3 text-gray-400 group-hover:text-gray-700 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Popover Card Matching Picture 1 */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 z-50 animate-scale-in font-sans">
              {/* Super Admin Info */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  BH
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate leading-snug">
                    Bilal Hussain Abbasi
                  </span>
                  <span className="text-xs text-gray-500 truncate leading-snug">
                    eligoleather9@gmail.com
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200/80 my-3" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150 group cursor-pointer"
              >
                <SignOut className="w-4 h-4 text-gray-600 group-hover:text-rose-600 transition-colors shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
