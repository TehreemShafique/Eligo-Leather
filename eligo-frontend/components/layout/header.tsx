"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MagnifyingGlass, ShoppingCartSimple, User, Heart, CaretDown, CaretRight, List, X } from "@phosphor-icons/react"
import { getHeaderMenu } from "@/modules/menu/api"
import type { MenuItem } from "@/modules/menu/types"

import { useCart } from "@/context/cart-context"

export function Header() {
  const pathname = usePathname()
  const { cartCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
  const [activeSubDropdownId, setActiveSubDropdownId] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    getHeaderMenu().then((items) => {
      if (isMounted) {
        setMenuItems(items)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <header className="w-full bg-white text-black shadow-xs z-50 sticky top-0 font-['Manrope']">
      {/* Top Announcement Bar */}
      <div className="w-full bg-black text-white text-xs sm:text-sm py-2 px-4 flex justify-between items-center">
        <div className="hidden md:flex items-center space-x-3 text-xs text-white/70">
          <span>Handcrafted Leather Essentials</span>
        </div>
        <div className="mx-auto md:mx-0 text-center font-semibold tracking-wide">
          Free Shipping on above 2000/- PKR Order
        </div>
        <div className="hidden md:flex items-center space-x-3 text-xs text-white/80">
          <span>PKR (Rs.)</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-wider text-black font-['Manrope'] group-hover:text-amber-800 transition-colors">
              ELIGO
            </span>
            <span className="text-[10px] tracking-[0.25em] font-semibold text-amber-800 uppercase">
              Leather
            </span>
          </div>
        </Link>

        {/* Dynamic Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {menuItems.map((item) => {
            const isActive = pathname === item.url
            const hasChildren = item.children && item.children.length > 0

            if (hasChildren) {
              return (
                <div
                  key={item.id}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdownId(item.id)}
                  onMouseLeave={() => {
                    setActiveDropdownId(null)
                    setActiveSubDropdownId(null)
                  }}
                >
                  <Link
                    href={item.url || "#"}
                    className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors py-2 ${
                      isActive ? "text-amber-800" : "text-black hover:text-amber-800"
                    }`}
                  >
                    {item.label}
                    <CaretDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                  </Link>

                  {/* Main Downward Dropdown Sub-menu */}
                  {activeDropdownId === item.id && (
                    <div className="absolute top-full left-0 w-52 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {item.children?.map((subItem) => {
                        const hasSubChildren = subItem.children && subItem.children.length > 0

                        return (
                          <div
                            key={subItem.id}
                            className="relative group/sub"
                            onMouseEnter={() => setActiveSubDropdownId(subItem.id)}
                            onMouseLeave={() => setActiveSubDropdownId(null)}
                          >
                            <Link
                              href={subItem.url}
                              className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                            >
                              <span>{subItem.label}</span>
                              {hasSubChildren && <CaretRight className="w-3.5 h-3.5 text-gray-400 group-hover/sub:text-amber-800" />}
                            </Link>

                            {/* Sub-dropdown Menu Opening to the Right */}
                            {hasSubChildren && activeSubDropdownId === subItem.id && (
                              <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-left-2 duration-150">
                                {subItem.children?.map((nestedItem) => (
                                  <Link
                                    key={nestedItem.id}
                                    href={nestedItem.url}
                                    className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                                  >
                                    {nestedItem.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.url}
                className={`text-sm font-semibold transition-colors ${
                  isActive ? "text-amber-800" : "text-black hover:text-amber-800"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Header Action Icons */}
        <div className="flex items-center space-x-4">
          <Link
            href="/search"
            aria-label="Search"
            className="p-2 text-gray-700 hover:text-amber-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MagnifyingGlass className="w-5 h-5" />
          </Link>
          <Link
            href="/auth/login"
            aria-label="Account"
            className="p-2 text-gray-700 hover:text-amber-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <User className="w-5 h-5" />
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="p-2 text-gray-700 hover:text-amber-800 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <Heart className="w-5 h-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className="p-2 text-gray-700 hover:text-amber-800 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <ShoppingCartSimple className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-800 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-amber-800"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-6 space-y-3">
          {menuItems.map((item) => (
            <div key={item.id}>
              <Link
                href={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-bold text-gray-900 hover:text-amber-800 py-1"
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="pl-4 space-y-2 border-l border-amber-800/30 my-1">
                  {item.children.map((subItem) => (
                    <div key={subItem.id}>
                      <Link
                        href={subItem.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm font-semibold text-amber-900 hover:text-amber-800 py-1"
                      >
                        {subItem.label}
                      </Link>
                      {subItem.children && (
                        <div className="pl-3 space-y-1">
                          {subItem.children.map((nested) => (
                            <Link
                              key={nested.id}
                              href={nested.url}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-xs text-gray-600 hover:text-amber-800 py-0.5"
                            >
                              {nested.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
