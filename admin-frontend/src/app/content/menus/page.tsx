"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { List, Plus, ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

interface MenuRecord {
  id: number
  title: string
  handle: string
  items: string[]
}

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<MenuRecord[]>([
    {
      id: 1,
      title: "Quick Links",
      handle: "quick-links",
      items: ["Home", "About Us", "Blog", "Contact Us"],
    },
    {
      id: 2,
      title: "Main menu",
      handle: "main-menu",
      items: ["Home", "Wallets", "Belts", "Keychains", "Accessories", "Sales", "About us", "Blogs"],
    },
    {
      id: 3,
      title: "Information",
      handle: "information",
      items: ["Privacy Policy", "Refund Policy", "Terms of Service", "Contact Information", "Sales"],
    },
    {
      id: 4,
      title: "Footer Menu",
      handle: "footer-menu",
      items: ["Women Wallets", "Mens Wallets", "Key Chain", "Cases", "Belt"],
    },
    {
      id: 5,
      title: "Customer account main menu",
      handle: "customer-account-menu",
      items: ["Orders", "Profile"],
    },
  ])

  // Fetch live menus from DB & LocalStorage
  useEffect(() => {
    let isMounted = true

    // Check local storage for created menus
    try {
      const stored = localStorage.getItem("eligo_created_menus")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
          setMenus((prev) => {
            const combined = [...parsed, ...prev]
            const uniqueMap = new Map()
            combined.forEach((item) => {
              if (!uniqueMap.has(item.handle)) {
                uniqueMap.set(item.handle, item)
              }
            })
            return Array.from(uniqueMap.values())
          })
        }
      }
    } catch (e) {
      console.log("localStorage read error", e)
    }

    // Fetch from Backend PostgreSQL DB
    const fetchMenusFromDB = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/menus/")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: MenuRecord[] = data.map((m: any) => ({
              id: m.id,
              title: m.title,
              handle: m.handle,
              items: (m.items || []).map((it: any) => it.title || it.url),
            }))

            setMenus((prev) => {
              const combined = [...mapped, ...prev]
              const uniqueMap = new Map()
              combined.forEach((item) => {
                if (!uniqueMap.has(item.handle)) {
                  uniqueMap.set(item.handle, item)
                }
              })
              return Array.from(uniqueMap.values())
            })
          }
        }
      } catch (err) {
        console.log("Menus DB API offline, rendering local list.")
      }
    }

    fetchMenusFromDB()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Menus"
        icon={<List className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Opening URL redirects manager...")}
              className="eligo-btn-secondary"
            >
              <ArrowSquareOut className="w-4 h-4 text-amber-800" />
              <span>URL redirects</span>
            </button>
            <Link
              href="/content/menus/new"
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create menu</span>
            </Link>
          </>
        }
      />

      {/* Menus Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Navigation Menus ({menus.length})</h2>
          <span className="text-xs text-gray-500">Live storefront synced</span>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[20%]">Menu Title</th>
                <th className="eligo-th w-[14%]">Handle</th>
                <th className="eligo-th">Menu Items Structure</th>
                <th className="eligo-th w-[12%] text-right">Items Count</th>
                <th className="eligo-th w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu, idx) => (
                <tr key={menu.id ? `menu-${menu.id}-${idx}` : `menu-${idx}`} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="truncate">{menu.title}</span>
                    </div>
                  </td>
                  <td className="eligo-td font-mono text-gray-500">{menu.handle}</td>
                  <td className="eligo-td">
                    <div className="flex flex-wrap gap-1.5">
                      {menu.items.length > 0 ? (
                        menu.items.map((item, itemIdx) => (
                          <span
                            key={itemIdx}
                            className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 font-medium rounded-md text-[11px]"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">No items added</span>
                      )}
                    </div>
                  </td>
                  <td className="eligo-td text-right font-bold text-gray-900">
                    {menu.items.length} items
                  </td>
                  <td className="eligo-td text-center">
                    <button
                      onClick={() => toast.info(`Editing menu: ${menu.title}`)}
                      className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-lg font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <PencilSimple className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
