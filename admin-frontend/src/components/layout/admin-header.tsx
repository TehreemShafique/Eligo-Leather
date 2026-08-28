"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  MagnifyingGlass,
  Command,
  CaretDown,
  SignOut,
  Package,
  ShoppingBagOpen,
  UsersThree,
  Spinner,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { clearAuthToken, getStoredUser, API_BASE } from "@/lib/api"

interface SearchResult {
  kind: "product" | "order" | "customer"
  id: number
  title: string
  subtitle: string
  href: string
  meta?: string
}

export function AdminHeader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [user, setUser] = useState<{ email: string; full_name: string | null } | null>(null)

  // Data caches
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  const loadData = async () => {
    if (tracked) return
    setLoading(true)
    try {
      const [pRes, oRes, cRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/catalog/products/`),
        fetch(`${API_BASE}/api/v1/orders/?limit=100&skip=0`),
        fetch(`${API_BASE}/api/v1/customers/`),
      ])

      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const data = await pRes.value.json()
        if (Array.isArray(data)) setProducts(data)
      }
      if (oRes.status === "fulfilled" && oRes.value.ok) {
        const data = await oRes.value.json()
        if (Array.isArray(data)) setOrders(data)
      }
      if (cRes.status === "fulfilled" && cRes.value.ok) {
        const data = await cRes.value.json()
        if (Array.isArray(data)) setCustomers(data)
      }
    } catch {
      /* ignore network errors */
    } finally {
      setLoading(false)
      setTracked(true)
    }
  }

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  // Lazy-load once when the search is focused or the user types
  useEffect(() => {
    if (menuOpen || searchValue) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen, searchValue])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const results = useMemo<SearchResult[]>(() => {
    const term = searchValue.trim().toLowerCase()
    if (!term) return []

    const out: SearchResult[] = []

    // Products (title, category, vendor)
    products.forEach((p: any) => {
      const title = p.title || ""
      const category = p.categories || p.category || ""
      const vendor = p.vendor || ""
      const price = p.price
      if (
        title.toLowerCase().includes(term) ||
        String(category).toLowerCase().includes(term) ||
        String(vendor).toLowerCase().includes(term)
      ) {
        out.push({
          kind: "product",
          id: p.id,
          title,
          subtitle: [category, vendor].filter(Boolean).join(" • "),
          href: `/products/${p.id}`,
          meta: price != null ? `Rs. ${price}` : undefined,
        })
      }
    })

    // Orders (order number, customer name, product names)
    orders.forEach((o: any) => {
      const num = String(o.order_number || "")
      const cust = o.customer_name || ""
      const hasItem = (o.items || []).some((i: any) =>
        String(i.product_name || "").toLowerCase().includes(term),
      )
      if (
        num.toLowerCase().includes(term) ||
        cust.toLowerCase().includes(term) ||
        hasItem
      ) {
        out.push({
          kind: "order",
          id: o.id,
          title: `#${num}`,
          subtitle: cust || "Guest",
          href: `/orders/${encodeURIComponent(o.order_number || o.id)}`,
          meta: o.total_price != null ? `Rs. ${o.total_price}` : undefined,
        })
      }
    })

    // Customers (name, email)
    customers.forEach((c: any) => {
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ")
      const email = c.email || ""
      const disp = email ? c.email : fullName || `Guest Customer #${c.id}`
      if (
        fullName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)
      ) {
        out.push({
          kind: "customer",
          id: c.id,
          title: fullName || disp,
          subtitle: email || "No email",
          href: `/customers/${c.id}`,
        })
      }
    })

    return out
  }, [searchValue, products, orders, customers])

  const grouped = useMemo(() => {
    const g: { product: SearchResult[]; order: SearchResult[]; customer: SearchResult[] } = {
      product: [],
      order: [],
      customer: [],
    }
    results.forEach((r) => g[r.kind].push(r))
    return g
  }, [results])

  const focused = menuOpen && searchValue.trim().length > 0
  const hasResults = results.length > 0

  const goTo = (r: SearchResult) => {
    setSearchValue("")
    setMenuOpen(false)
    inputRef.current?.blur()
    router.push(r.href)
  }

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    clearAuthToken()
    toast.success("Logged out successfully!")
    router.push("/login")
  }

  const displayName = user?.full_name || user?.email || "Admin"
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "AD"

  const kindIcon = (kind: string) => {
    if (kind === "product") return <Package className="w-3.5 h-3.5 text-amber-800 shrink-0" />
    if (kind === "order") return <ShoppingBagOpen className="w-3.5 h-3.5 text-amber-800 shrink-0" />
    return <UsersThree className="w-3.5 h-3.5 text-amber-800 shrink-0" />
  }

  return (
    <header className="h-14 shrink-0 bg-[#ebebeb] border-b border-[#d2d2d2] px-5 flex items-center justify-between gap-4 z-40 select-none">
      <div className="flex-1 max-w-xl min-w-0" ref={searchWrapRef}>
        <div className="relative flex items-center group">
          <MagnifyingGlass className="w-4 h-4 text-gray-500 absolute left-3 transition-colors group-focus-within:text-amber-800" />
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              setMenuOpen(true)
            }}
            onFocus={() => setMenuOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMenuOpen(false)
            }}
            placeholder="Search products, orders, customers..."
            className="w-full h-9 pl-9 pr-14 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all shadow-sm"
          />
          <kbd className="absolute right-3 flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </kbd>

          {menuOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden animate-scale-in">
              {loading && (
                <div className="p-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Spinner className="w-4 h-4 animate-spin" /> Loading data...
                </div>
              )}

              {!loading && focused && !hasResults && (
                <div className="p-6 text-center text-xs text-gray-400">
                  No results for "{searchValue.trim()}"
                </div>
              )}

              {!loading && !searchValue.trim() && (
                <div className="p-6 text-center text-xs text-gray-400">
                  Search products, orders, customers...
                </div>
              )}

              {focused && hasResults && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {(["product", "order", "customer"] as const).map((kind) => {
                    if (grouped[kind].length === 0) return null
                    return (
                      <div key={kind}>
                        <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          {kind === "product" ? "Products" : kind === "order" ? "Orders" : "Customers"} ({grouped[kind].length})
                        </div>
                        {grouped[kind].map((r) => (
                          <button
                            key={`${kind}-${r.id}`}
                            type="button"
                            onClick={() => goTo(r)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-amber-50/60 cursor-pointer"
                          >
                            {kindIcon(kind)}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-gray-900 truncate">{r.title}</div>
                              <div className="text-[11px] text-gray-500 truncate">{r.subtitle}</div>
                            </div>
                            {r.meta && <div className="text-[11px] font-semibold text-gray-600 shrink-0">{r.meta}</div>}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="ml-2 h-7 w-px bg-gray-300" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/80 transition-colors group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <span className="hidden lg:inline text-xs font-bold text-gray-900">{displayName}</span>
            <CaretDown className={`w-3 h-3 text-gray-400 group-hover:text-gray-700 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 z-50 animate-scale-in font-sans">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate leading-snug">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-500 truncate leading-snug">
                    {user?.email || ""}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-200/80 my-3" />

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
