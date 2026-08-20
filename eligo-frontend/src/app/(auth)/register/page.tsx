"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeSlash, LockKey, EnvelopeSimple, User, Phone } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export default function AuthRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match. Please check again.")
      return
    }

    setLoading(true)

    setTimeout(() => {
      toast.success("Account created successfully! Welcome to Eligo Leather VIP Club.")
      setLoading(false)
      router.push("/auth/login")
    }, 600)
  }

  return (
    <div className="py-12 bg-slate-50 min-h-screen font-['Manrope'] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-6">
        <PageBreadcrumb positioned={false} items={[{ label: "Create Account" }]} />
      </div>

      <div className="max-w-lg w-full mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white rounded-[20px] border border-gray-100 p-8 sm:p-12 shadow-xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-[0.3em] font-bold text-amber-800 uppercase">
              Eligo Leather
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
              Create an Account
            </h1>
            <p className="text-sm text-gray-600">
              Join Eligo Leather for faster checkout, order tracking, and exclusive discounts.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Anderson"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                <EnvelopeSimple className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 0000000"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-black uppercase tracking-wide mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-stone-100 border border-stone-800/10 text-black text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
                />
                <LockKey className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-amber-800 hover:bg-amber-900 text-stone-100 text-sm font-semibold rounded-[10px] uppercase tracking-wide shadow-md transition-colors font-['Manrope'] cursor-pointer mt-2"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-4 border-t border-gray-100 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-amber-800 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
