"use client"

import { useState } from "react"
import Link from "next/link"
import { List, Plus, ArrowSquareOut, PencilSimple, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminMenusPage() {
  const menus = [
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
  ]

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
            <button
              onClick={() => toast.success("Create menu drawer opened!")}
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create menu</span>
            </button>
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
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-amber-800 shrink-0" />
                      <span className="truncate">{menu.title}</span>
                    </div>
                  </td>
                  <td className="eligo-td font-mono text-gray-500">{menu.handle}</td>
                  <td className="eligo-td">
                    <div className="flex flex-wrap gap-1.5">
                      {menu.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 font-medium rounded-md text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
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
