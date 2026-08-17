"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { FolderOpen, Plus, MagnifyingGlass, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"

interface CategoryItem {
  id: number
  title: string
  description?: string
  productsCount: number
  conditions: string
  image: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchCategoriesFromDB = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/catalog/collections/")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const mapped: CategoryItem[] = data.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            productsCount: 12,
            conditions: c.conditions || "Manual category collection",
            image: c.image_url || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
          }))
          setCategories(mapped)
        } else {
          setCategories([
            { id: 1, title: "Leather Clutch Wallets", productsCount: 14, conditions: "Manual category collection", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=200" },
            { id: 2, title: "Mens Leather Goods", productsCount: 22, conditions: "Manual category collection", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200" },
            { id: 3, title: "Women Leather Accessories", productsCount: 18, conditions: "Manual category collection", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200" },
            { id: 4, title: "Crocodile Leather Special Edition", productsCount: 6, conditions: "Manual category collection", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200" },
          ])
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoriesFromDB()
  }, [])

  const handleDeleteCategory = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/catalog/collections/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setCategories(prev => prev.filter(c => c.id !== id))
        toast.success("Category deleted from database successfully!")
      } else {
        setCategories(prev => prev.filter(c => c.id !== id))
        toast.info("Category removed from list.")
      }
    } catch (err) {
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.info("Category removed from list.")
    }
  }

  const filteredCategories = categories.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-5 font-sans">
      <PageHeader
        title="Categories"
        icon={<FolderOpen className="w-5 h-5" />}
        actions={
          <Link
            href="/products/collections/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add category</span>
          </Link>
        }
      />

      {/* Categories Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="eligo-input pl-9 text-xs"
            />
          </div>

          <span className="text-xs font-bold text-gray-700">
            Total Categories: <span className="text-amber-800 font-extrabold">{filteredCategories.length}</span>
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500 font-semibold">
            Loading Categories from Database...
          </div>
        ) : (
          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th w-[14%]">Thumbnail</th>
                  <th className="eligo-th">Category Title</th>
                  <th className="eligo-th w-[20%]">Products Count</th>
                  <th className="eligo-th w-[25%]">Conditions / Rules</th>
                  <th className="eligo-th w-[10%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="eligo-td">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 relative overflow-hidden border border-gray-200">
                        <Image src={c.image} alt={c.title} fill unoptimized className="object-cover" />
                      </div>
                    </td>
                    <td className="eligo-td font-bold text-amber-900">
                      <Link href="/products/collections/new" className="hover:underline">{c.title}</Link>
                    </td>
                    <td className="eligo-td font-semibold text-gray-900">{c.productsCount} products</td>
                    <td className="eligo-td text-gray-600 font-mono text-[11px]">{c.conditions}</td>
                    <td className="eligo-td text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
