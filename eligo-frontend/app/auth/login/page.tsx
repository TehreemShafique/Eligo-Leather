"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeSlash, LockKey, EnvelopeSimple } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default function AuthLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      toast.success("Welcome back to Eligo Leather!")
      setLoading(false)
      router.push("/account")
    }, 500)
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen font-['Manrope'] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-6">
        <Breadcrumbs items={[{ label: "Account Login" }]} />
      </div>

      <div className="max-w-md w-full mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white rounded-[20px] border border-gray-100 p-8 sm:p-12 shadow-xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-[0.3em] font-bold text-amber-800 uppercase">
              Eligo Leather
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600">
              Sign in to manage orders, wishlist, and exclusive member discounts.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                <EnvelopeSimple className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-black uppercase tracking-wide">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-amber-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                <LockKey className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-amber-800 transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-amber-800 hover:bg-amber-900 text-stone-100 text-sm font-semibold rounded-[10px] uppercase tracking-wide shadow-md transition-colors font-['Manrope'] cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-4 border-t border-gray-100 text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-amber-800 hover:underline"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
