"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  House,
  ShoppingBagOpen,
  Tag,
  Users,
  Percent,
  FileText,
  Globe,
  InstagramLogo,
  Robot,
  Truck,
  Eye,
  Gear,
  CaretDown,
  CaretRight,
  ArrowSquareOut,
  Sparkle,
  SquaresFour,
  Key,
} from "@phosphor-icons/react"
import { clsx } from "clsx"

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: React.ComponentType<any>
  label: string
  active: boolean
  badge?: string
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200",
        active
          ? "bg-white text-gray-900 font-bold shadow-sm border border-gray-200/70"
          : "text-gray-700 font-semibold hover:bg-white/70 hover:translate-x-0.5 border border-transparent"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={clsx("w-4 h-4 shrink-0 transition-colors", active ? "text-amber-800" : "text-gray-500 group-hover:text-amber-800")} />
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 rounded-full shrink-0">
          {badge}
        </span>
      )}
    </Link>
  )
}

function SubItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border-l-2",
        active
          ? "bg-white text-amber-900 font-bold shadow-sm border-amber-800"
          : "text-gray-600 hover:text-black hover:bg-white/60 border-transparent"
      )}
    >
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
      {children}
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [productsOpen, setProductsOpen] = useState(false)
  const [customersOpen, setCustomersOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)
  const [onlineStoreOpen, setOnlineStoreOpen] = useState(false)

  useEffect(() => {
    if (pathname.startsWith("/products")) setProductsOpen(true)
    if (pathname.startsWith("/customers")) setCustomersOpen(true)
    if (pathname.startsWith("/content")) setContentOpen(true)
    if (pathname.startsWith("/online-store")) setOnlineStoreOpen(true)
  }, [pathname])

  const expandableSections = [
    {
      key: "products",
      open: productsOpen,
      toggle: () => setProductsOpen(!productsOpen),
      icon: Tag,
      label: "Products",
      baseHref: "/products",
      active: pathname.startsWith("/products"),
      items: [
        { name: "All products", href: "/products" },
        { name: "Categories", href: "/products/collections" },
        { name: "Inventory", href: "/products/inventory" },
        { name: "Purchase orders", href: "/products/purchase-orders" },
        { name: "Transfers", href: "/products/transfers" },
        { name: "Gift cards", href: "/products/gift-cards" },
      ],
    },
    {
      key: "customers",
      open: customersOpen,
      toggle: () => setCustomersOpen(!customersOpen),
      icon: Users,
      label: "Customers",
      baseHref: "/customers",
      active: pathname.startsWith("/customers"),
      items: [
        { name: "All customers", href: "/customers" },
        { name: "Segments", href: "/customers/segments" },
        { name: "Companies", href: "/customers/companies" },
      ],
    },
    {
      key: "content",
      open: contentOpen,
      toggle: () => setContentOpen(!contentOpen),
      icon: FileText,
      label: "Content",
      baseHref: "/content",
      active: pathname.startsWith("/content"),
      items: [
        { name: "Metaobjects", href: "/content/metaobjects" },
        { name: "Files", href: "/content/files" },
        { name: "Menus", href: "/content/menus" },
        { name: "Blog posts", href: "/content/blogs" },
      ],
    },
  ]

  return (
    <aside className="w-64 shrink-0 bg-[#ebebeb] text-[#1a1a1a] h-full flex flex-col border-r border-[#d2d2d2] font-sans select-none overflow-y-auto">
      <div className="p-3 flex-1 space-y-1">
        {/* Store Selector Profile Header */}
        <button
          type="button"
          className="group w-full flex items-center justify-between p-2 rounded-xl bg-white/70 border border-gray-200/80 shadow-sm hover:bg-white hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-900 text-white font-bold text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              EL
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-bold leading-tight text-gray-900 truncate">
                Eligo Leather
              </span>
              <a
                href="https://eligoleather.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-gray-500 hover:text-amber-800 inline-flex items-center gap-1"
              >
                eligoleather.com
                <ArrowSquareOut className="w-3 h-3" />
              </a>
            </div>
          </div>
          <CaretDown className="w-4 h-4 text-gray-400 group-hover:text-gray-700 shrink-0" />
        </button>

        {/* Main Nav */}
        <nav className="space-y-0.5 pt-2">
          <NavItem
            href="/"
            icon={House}
            label="Home"
            active={pathname === "/"}
          />

          {/* Orders */}
          <div>
            <NavItem
              href="/orders"
              icon={ShoppingBagOpen}
              label="Orders"
              active={pathname === "/orders"}
            />
            <div className="mt-0.5 pl-4 space-y-0.5">
              <SubItem href="/orders/drafts" label="Drafts" active={pathname === "/orders/drafts"} />
              <SubItem href="/orders/checkouts" label="Abandoned checkouts" active={pathname === "/orders/checkouts"} />
            </div>
          </div>

          {/* Expandable sections */}
          {expandableSections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={section.toggle}
                  className={clsx(
                    "group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer",
                    section.active
                      ? "bg-white text-gray-900 font-bold shadow-sm border border-gray-200/70"
                      : "text-gray-700 font-semibold hover:bg-white/70 hover:translate-x-0.5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={clsx("w-4 h-4 shrink-0 transition-colors", section.active ? "text-amber-800" : "text-gray-500 group-hover:text-amber-800")} />
                    <span className="truncate">{section.label}</span>
                  </div>
                  <span className={clsx("transition-transform duration-200 shrink-0", section.open ? "rotate-180" : "")}>
                    {section.open ? (
                      <CaretDown className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <CaretRight className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </span>
                </button>

                <div
                  className={clsx(
                    "grid transition-all duration-200 ease-out overflow-hidden",
                    section.open ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 pl-4 space-y-0.5">
                    {section.items.map((sub) => (
                      <SubItem
                        key={sub.href}
                        href={sub.href}
                        label={sub.name}
                        active={pathname === sub.href}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          <NavItem
            href="/discounts"
            icon={Percent}
            label="Discounts"
            active={pathname.startsWith("/discounts")}
          />

          {/* Online Store */}
          <div>
            <button
              type="button"
              onClick={() => setOnlineStoreOpen(!onlineStoreOpen)}
              className={clsx(
                "group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer",
                pathname.startsWith("/online-store")
                  ? "bg-white text-gray-900 font-bold shadow-sm border border-gray-200/70"
                  : "text-gray-700 font-semibold hover:bg-white/70 hover:translate-x-0.5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <SquaresFour className={clsx("w-4 h-4 shrink-0 transition-colors", pathname.startsWith("/online-store") ? "text-amber-800" : "text-gray-500 group-hover:text-amber-800")} />
                <span className="truncate">Online Store</span>
              </div>
              <span className={clsx("transition-transform duration-200 shrink-0", onlineStoreOpen ? "rotate-180" : "")}>
                {onlineStoreOpen ? (
                  <CaretDown className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <CaretRight className="w-3.5 h-3.5 text-gray-500" />
                )}
              </span>
            </button>

            <div
              className={clsx(
                "grid transition-all duration-200 ease-out overflow-hidden",
                onlineStoreOpen ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0 pl-4 space-y-0.5">
                <SubItem href="/online-store/pages" label="Pages" active={pathname.startsWith("/online-store/pages")} />
              </div>
            </div>
          </div>
        </nav>

        {/* Divider */}
        <div className="h-px bg-gray-300/80 my-3" />

        {/* Sales Channels */}
        <div>
          <SectionLabel>Sales channels</SectionLabel>
          <NavItem
            href="/settings/sales_channels"
            icon={InstagramLogo}
            label="Facebook & Instagram"
            active={pathname.includes("sales_channels")}
            badge="Pending"
          />
        </div>
      </div>

      {/* Bottom Settings & User Account Section */}
      <div className="p-3 border-t border-[#d2d2d2] space-y-2 bg-[#e6e6e6]">
        <Link
          href="/settings/general"
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Gear className="w-4 h-4 text-amber-800 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-gray-800">Settings</span>
          </div>
          <ArrowSquareOut className="w-3.5 h-3.5 text-gray-500" />
        </Link>

        <Link
          href="/settings/account/personal"
          className="group flex items-center gap-2.5 p-2 rounded-xl bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            BH
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-gray-900 group-hover:text-amber-800 truncate transition-colors">Bilal Hussain Abbasi</span>
            <span className="text-[10px] text-gray-500 truncate">eligoleather9@gmail.com</span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
