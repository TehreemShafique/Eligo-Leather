"use client"

import { useState } from "react"
import { EnvelopeSimple } from "@phosphor-icons/react"
import { toast } from "sonner"

export function VipSignupForm() {
  const [vipEmail, setVipEmail] = useState("")

  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vipEmail) return
    toast.success("Welcome to the Eligoleather VIP List! Check your email for your exclusive welcome discount code.")
    setVipEmail("")
  }

  return (
    <form onSubmit={handleVipSubmit} className="max-w-xl pt-2">
      <div className="bg-white rounded-full p-1.5 flex items-center shadow-lg">
        <div className="pl-4 text-gray-400">
          <EnvelopeSimple className="w-5 h-5" />
        </div>
        <input
          type="email"
          required
          value={vipEmail}
          onChange={(e) => setVipEmail(e.target.value)}
          placeholder="Enter your VIP email address"
          className="w-full bg-transparent px-3 py-2 text-black text-sm font-medium focus:outline-hidden"
        />
        <button
          type="submit"
          className="px-8 py-3 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-full transition-colors shrink-0"
        >
          Join VIP
        </button>
      </div>
    </form>
  )
}
