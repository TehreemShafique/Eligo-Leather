"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { FolderOpen, Plus, MagnifyingGlass, CheckCircle } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminCollectionsPage() {
  const collections = [
    {
      id: 1,
      title: "Leather Clutch Wallets",
      productsCount: 14,
      conditions: "Tag includes smart-clutches",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 2,
      title: "Mens Wallet",
      productsCount: 22,
      conditions: "Tag includes M-en",
      image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 3,
      title: "Women Wallets",
      productsCount: 18,
      conditions: "Tag includes Wo-en",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 4,
      title: "Crocodile Leather Wallet",
      productsCount: 6,
      conditions: "Type equals Crocodile Leather",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 5,
      title: "Bifold Wallets",
      productsCount: 15,
      conditions: "Tag includes Bifold",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collections"
        icon={<FolderOpen className="w-5 h-5" />}
        actions={
          <Link
            href="/products/collections/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add collection</span>
          </Link>
        }
      />

      {/* Collections Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search collections..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[14%]">Thumbnail</th>
                <th className="eligo-th">Title</th>
                <th className="eligo-th w-[20%]">Products Count</th>
                <th className="eligo-th w-[30%] text-right">Conditions / Rules</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 relative overflow-hidden border border-gray-200">
                      <Image src={c.image} alt={c.title} fill unoptimized className="object-cover" />
                    </div>
                  </td>
                  <td className="eligo-td font-bold text-amber-800">
                    <Link href="/products/collections/new" className="hover:underline">{c.title}</Link>
                  </td>
                  <td className="eligo-td font-semibold text-gray-900">{c.productsCount} products</td>
                  <td className="eligo-td text-right text-gray-600 font-mono text-[11px]">{c.conditions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
