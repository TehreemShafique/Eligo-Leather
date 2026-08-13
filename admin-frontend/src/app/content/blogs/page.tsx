"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Article,
  Plus,
  ChatCircleText,
  WarningCircle,
  Eye,
  PencilSimple,
  CheckCircle,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

export default function AdminBlogsPage() {
  const blogs = [
    {
      id: 1,
      slug: "timeless-black-leather-accessories",
      title: "Timeless Black Leather Accessories for Everyday Style",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=300",
      visibility: "Visible",
      author: "Bilal Hussain Abbasi",
      category: "Style & Care",
      updated: "Feb 8, 2026",
      published: "Feb 4, 2026",
    },
    {
      id: 2,
      slug: "how-to-care-for-genuine-leather-wallets",
      title: "How to Properly Care for Your Handmade Genuine Leather Wallet",
      image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300",
      visibility: "Visible",
      author: "Bilal Hussain Abbasi",
      category: "Leather Maintenance",
      updated: "Feb 2, 2026",
      published: "Jan 28, 2026",
    },
    {
      id: 3,
      slug: "choosing-the-perfect-leather-belt-guide",
      title: "The Ultimate Guide to Choosing the Perfect Handmade Leather Belt",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=300",
      visibility: "Visible",
      author: "Eligo Editorial",
      category: "Buying Guides",
      updated: "Jan 15, 2026",
      published: "Jan 10, 2026",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Blog Posts"
        icon={<Article className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => toast.info("Managing blog categories...")}
              className="eligo-btn-secondary"
            >
              <Article className="w-4 h-4 text-amber-800" />
              <span>Manage blogs</span>
            </button>
            <button
              onClick={() => toast.info("Opening 3 pending comments for moderation...")}
              className="eligo-btn-secondary"
            >
              <ChatCircleText className="w-4 h-4 text-amber-800" />
              <span>Manage comments (3)</span>
            </button>
            <Link
              href="/content/blogs/new"
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add blog post</span>
            </Link>
          </>
        }
      />

      {/* Moderation Alert Banner (Matching image_1964d4.png) */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2.5 font-bold">
          <WarningCircle className="w-5 h-5 text-amber-800 shrink-0" />
          <span>There are 3 comments that require moderation.</span>
        </div>
        <button
          onClick={() => toast.info("Reviewing comments...")}
          className="px-3 py-1.5 bg-amber-800 text-white text-[11px] font-bold rounded-lg hover:bg-amber-900 transition-colors"
        >
          Review Comments
        </button>
      </div>

      {/* Blog Posts Data Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Published Blog Articles ({blogs.length})</h2>
          <span className="text-xs text-gray-500">Live on Storefront</span>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th w-[10%]">Thumbnail</th>
                <th className="eligo-th">Title</th>
                <th className="eligo-th w-[12%]">Visibility</th>
                <th className="eligo-th w-[16%]">Author</th>
                <th className="eligo-th w-[16%]">Blog Category</th>
                <th className="eligo-th w-[14%]">Updated</th>
                <th className="eligo-th w-[12%] text-right">Published</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td">
                    <div className="w-14 h-10 rounded-lg bg-gray-100 relative overflow-hidden border border-gray-200">
                      <Image src={b.image} alt={b.title} fill unoptimized className="object-cover" />
                    </div>
                  </td>
                  <td className="eligo-td font-bold text-amber-800">
                    <Link href="/content/blogs/new" className="hover:underline block truncate">{b.title}</Link>
                  </td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      {b.visibility}
                    </span>
                  </td>
                  <td className="eligo-td font-semibold text-gray-900">{b.author}</td>
                  <td className="eligo-td font-semibold text-gray-700">{b.category}</td>
                  <td className="eligo-td text-gray-500">{b.updated}</td>
                  <td className="eligo-td text-right font-medium text-gray-900">{b.published}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
