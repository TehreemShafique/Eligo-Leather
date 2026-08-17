"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  House,
  Users,
  CreditCard,
  ShoppingCart,
  UserCircle,
  Truck,
  Receipt,
  MapPin,
  AppWindow,
  Globe,
  Sliders,
  Bell,
  Database,
  Translate,
  Cookie,
  ShieldCheck,
  X,
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  GlobeHemisphereWest,
  FileText,
} from "@phosphor-icons/react"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [usersOpen, setUsersOpen] = useState(pathname.includes("/organization-account"))

  // Settings Items (Plan and Billing explicitly removed)
  const settingsNavItems = [
    { name: "General", href: "/settings/general", icon: House },
    {
      name: "Users",
      href: "/settings/organization-account",
      icon: Users,
      hasSub: true,
      subItems: [
        { name: "Users List", href: "/settings/organization-account" },
        { name: "Roles & Permissions", href: "/settings/organization-account/roles" },
        { name: "Security Logs", href: "/settings/organization-account/security" },
      ],
    },
    { name: "Payments", href: "/settings/payments", icon: CreditCard },
    { name: "Checkout", href: "/settings/checkout", icon: ShoppingCart },
    { name: "Customer accounts", href: "/settings/customer_accounts", icon: UserCircle },
    { name: "Shipping and delivery", href: "/settings/shipping", icon: Truck },
    { name: "Locations", href: "/settings/locations", icon: MapPin },
    { name: "Apps", href: "/settings/apps", icon: AppWindow },
    { name: "Sales channels", href: "/settings/sales_channels", icon: Globe },
    { name: "Customer events", href: "/settings/customer_events", icon: Sliders },
    { name: "Notifications", href: "/settings/notifications", icon: Bell },
    { name: "Metafields and metaobjects", href: "/settings/custom_data", icon: Database },
    { name: "Policies & Privacy", href: "/settings/legal", icon: ShieldCheck },
  ]

  const filteredNavItems = settingsNavItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f1f1f1] font-sans antialiased text-[#1a1a1a] p-4 sm:p-6 overflow-x-hidden">
      {/* Top Right Close Button (Exit Settings) */}
      <div className="flex justify-end max-w-7xl mx-auto mb-2">
        <Link
          href="/"
          className="p-2 bg-white hover:bg-gray-100 text-gray-600 hover:text-amber-800 rounded-xl border border-gray-200 shadow-sm hover:border-amber-300 transition-all duration-200 flex items-center gap-1.5 font-semibold text-xs"
          title="Close Settings & Return to Dashboard"
        >
          <X className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Settings Container matching the exact Shopify UI design */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
        {/* Left-Side Settings Navigation Sidebar Card */}
        <aside className="w-full md:w-72 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm shrink-0 md:sticky md:top-6 space-y-4">
          {/* Store Info Card */}
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              EL
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-gray-900 text-xs truncate">Eligo Leather</span>
              <span className="text-[11px] text-gray-500 truncate">eligoleather.com</span>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <div className="relative">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all"
            />
          </div>

          {/* Settings Nav Menu */}
          <nav className="space-y-0.5 text-xs max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/settings/general" && pathname.startsWith(item.href))

              if (item.hasSub) {
                return (
                  <div key={item.name} className="space-y-0.5">
                    <button
                      onClick={() => setUsersOpen(!usersOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gray-100 text-gray-900 font-bold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-black"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-800" : "text-gray-600"}`} />
                        <span>{item.name}</span>
                      </div>
                      <span className={usersOpen ? "rotate-180 transition-transform" : "transition-transform"}>
                        {usersOpen ? (
                          <CaretDown className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <CaretRight className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </span>
                    </button>

                    {usersOpen && (
                      <div className="pl-6 space-y-0.5 py-1 border-l-2 border-amber-800/30 ml-3">
                        {item.subItems?.map((sub) => {
                          const isSubActive = pathname === sub.href
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className={`block px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                                isSubActive
                                  ? "bg-amber-100 text-amber-900 font-bold"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-bold shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-800" : "text-gray-600"}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Admin User Profile Card */}
          <Link
            href="/settings/account/personal"
            className="pt-3 border-t border-gray-100 flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 transition-all duration-200 cursor-pointer block"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
              BH
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-900 truncate">Bilal Hussain Abbasi</span>
              <span className="text-[10px] text-gray-500 truncate">eligoleather9@gmail.com</span>
            </div>
          </Link>
        </aside>

        {/* Setting Content Area */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
