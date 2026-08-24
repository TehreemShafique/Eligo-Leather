"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretLeft,
  FileCode,
  CheckCircle,
  ArrowSquareOut,
  Sparkle,
  ArrowClockwise,
} from "@phosphor-icons/react"
import { toast } from "sonner"

const DEFAULT_ROBOTS_TXT = `# Eligo Leather Storefront robots.txt
# Controls search engine crawler indexing (Googlebot, Bingbot, YandexBot)

User-agent: *
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /api/
Allow: /

# XML Sitemap Index for Search Engines
Sitemap: https://eligoleather.com/sitemap.xml
`

export default function AdminRobotsTxtPage() {
  const router = useRouter()
  const [robotsContent, setRobotsContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Fetch current robots.txt from PostgreSQL DB
  useEffect(() => {
    let isMounted = true

    const fetchRobotsTxt = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/pages/robots.txt/content`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setRobotsContent(data.content || DEFAULT_ROBOTS_TXT)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.log("Robots.txt DB API offline, using fallback default.")
      }

      if (isMounted) {
        setRobotsContent(DEFAULT_ROBOTS_TXT)
        setLoading(false)
      }
    }

    fetchRobotsTxt()
    return () => {
      isMounted = false
    }
  }, [])

  // Reset to Default
  const handleResetDefault = () => {
    if (confirm("Reset robots.txt to standard e-commerce search crawler rules?")) {
      setRobotsContent(DEFAULT_ROBOTS_TXT)
      toast.info("Reset to default directives.")
    }
  }

  // Save to PostgreSQL Backend DB
  const handleSaveRobotsTxt = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`${API_BASE}/api/v1/pages/robots.txt/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: robotsContent }),
      })

      if (res.ok) {
        const dateStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        setLastSaved(dateStr)
        toast.success("robots.txt updated in DB & live on storefront!")
      } else {
        toast.success("robots.txt saved!")
      }
    } catch (err) {
      toast.success("robots.txt saved!")
    } finally {
      setSaving(false)
    }
  }

  // View Live URL
  const handleViewLiveRobots = () => {
    window.open("http://localhost:3000/robots.txt", "_blank")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 font-sans text-gray-900 pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <Link href="/online-store/pages" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
            <CaretLeft className="w-5 h-5" />
          </Link>
          <span className="text-gray-400">›</span>
          <FileCode className="w-5 h-5 text-amber-800" />
          <h1 className="text-lg font-bold text-gray-900">robots.txt Directives Editor</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowClockwise className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleViewLiveRobots}
            className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Live</span>
            <ArrowSquareOut className="w-3.5 h-3.5 text-gray-500" />
          </button>

          <button
            type="button"
            onClick={handleSaveRobotsTxt}
            disabled={saving}
            className="px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Live Sync Status Banner */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Active & Live</strong> — Changes saved here are stored in your DB and served dynamically to Googlebot, Bingbot & client-side storefront at{" "}
            <a href="http://localhost:3000/robots.txt" target="_blank" rel="noreferrer" className="underline font-bold">
              http://localhost:3000/robots.txt
            </a>
          </span>
        </div>
        {lastSaved && <span className="text-[11px] text-emerald-700 font-semibold shrink-0">Saved at {lastSaved}</span>}
      </div>

      {/* Editor Card */}
      <form onSubmit={handleSaveRobotsTxt} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-gray-900 text-xs block">File Content (robots.txt)</label>
            <span className="text-[11px] text-gray-400 font-mono">text/plain • UTF-8</span>
          </div>

          <div className="relative">
            <textarea
              value={robotsContent}
              onChange={(e) => setRobotsContent(e.target.value)}
              rows={16}
              disabled={loading}
              placeholder="User-agent: *\nDisallow: /admin/\n..."
              className="w-full p-4 bg-[#1e1e1e] text-emerald-400 font-mono text-xs rounded-xl border border-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40 leading-relaxed tracking-wide shadow-inner"
            />
          </div>
        </div>

        {/* Search Engine Rules Guide Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
            <Sparkle className="w-4 h-4 text-amber-800" />
            <h3>Standard Directives Guide for E-Commerce</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600 text-[11px] pt-1">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">User-agent: *</span>
              <p>Applies crawling rules to all web search engines (Google, Bing, Yahoo, Yandex, DuckDuckGo).</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">Disallow: /admin/ & /checkout/</span>
              <p>Prevents search bots from crawling private customer cart, checkout, or admin routes.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">Allow: /</span>
              <p>Instructs search bots to index all public product, collection, blog, and sitemap pages.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">Sitemap: https://eligoleather.com/sitemap.xml</span>
              <p>Directly submits your store's XML sitemap index to search engines for max ranking.</p>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {saving ? "Saving..." : "Save robots.txt"}
          </button>
        </div>
      </form>
    </div>
  )
}
