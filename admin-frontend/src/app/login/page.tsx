"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, EnvelopeSimple, Eye, EyeSlash, ArrowRight, ShieldCheck } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("eligoleather9@gmail.com")
  const [password, setPassword] = useState("admin123456")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in both email and password.")
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success("Welcome back, Bilal Hussain Abbasi!")
      router.push("/")
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#e5e0d5] shadow-xl p-8 sm:p-10 space-y-6 relative z-10 animate-scale-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-900 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-md tracking-wider">
            EL
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Eligo Leather
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-900 border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-800" />
            <span>Super Admin Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <EnvelopeSimple className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eligoleather.com"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Password
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset request sent to primary email.")}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
              >
                {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-amber-800 focus:ring-amber-800"
              />
              <span className="text-xs font-semibold text-gray-700">Keep me signed in</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-amber-800 hover:bg-amber-900 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In to Admin</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Super Admin Info Quick Fill */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>Super Admin account</span>
          <span className="font-bold text-gray-800">Bilal Hussain Abbasi</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-400 font-medium">
        &copy; 2026 Eligo Leather Admin Portal. All rights reserved.
      </footer>
    </div>
  )
}
