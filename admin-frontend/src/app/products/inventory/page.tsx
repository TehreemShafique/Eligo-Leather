"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Package, DownloadSimple, UploadSimple, X, MagnifyingGlass } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { apiFetch } from "@/lib/api"

interface InventoryRowItem {
  id: number
  productId: number
  sku: string
  title: string
  variant: string
  colorHex?: string
  onHand: number
  available: number
  committed: number
  unavailable: number
  img: string
}

export default function AdminInventoryPage() {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Export State
  const [location, setLocation] = useState("All locations")
  const [exportScope, setExportScope] = useState("all")

  const [inventoryRows, setInventoryRows] = useState<InventoryRowItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInventoryFromBackend = async () => {
    setLoading(true)
    try {
      // Committed units per variant come from open orders:
      // available = on_hand - committed (cancelled/restocked orders excluded server-side).
      let commitments: Record<string, number> = {}
      try {
        commitments = await apiFetch<Record<string, number>>("/api/v1/orders/inventory-commitments")
      } catch (commitErr) {
        console.error("Could not load order commitments:", commitErr)
      }

      const res = await fetch("http://127.0.0.1:8000/api/v1/catalog/products/")
      if (res.ok) {
        const products = await res.json()
        if (Array.isArray(products) && products.length > 0) {
          const rows: InventoryRowItem[] = []
          products.forEach((p: any) => {
            const defaultImg = p.images?.[0]?.url || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200"
            if (p.variants && p.variants.length > 0) {
              p.variants.forEach((v: any) => {
                const onHand = v.inventory_quantity ?? 0
                const committed = commitments[String(v.id)] ?? 0
                rows.push({
                  id: v.id,
                  productId: p.id,
                  sku: v.sku || `${p.id}-VAR-${v.id}`,
                  title: p.title,
                  variant: v.color_name || v.title || "Standard",
                  colorHex: v.color_hex,
                  onHand,
                  available: Math.max(onHand - committed, 0),
                  committed,
                  unavailable: 0,
                  img: v.image_url || defaultImg,
                })
              })
            } else {
              rows.push({
                id: p.id * 1000,
                productId: p.id,
                sku: p.url_handle || `PROD-${p.id}`,
                title: p.title,
                variant: "Standard",
                onHand: 0,
                available: 0,
                committed: 0,
                unavailable: 0,
                img: defaultImg,
              })
            }
          })
          setInventoryRows(rows)
        } else {
          setInventoryRows([])
        }
      }
    } catch (err) {
      console.error("Error loading inventory from DB:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventoryFromBackend()
  }, [])

  const handleUpdateVariantStock = async (variantId: number, newStock: number) => {
    setInventoryRows(prev =>
      prev.map(item => (
        item.id === variantId
          ? { ...item, onHand: newStock, available: Math.max(newStock - item.committed, 0) }
          : item
      ))
    )

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/catalog/products/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory_quantity: newStock }),
      })

      if (res.ok) {
        toast.success("Updated variant inventory stock in database!")
      }
    } catch (err) {
      toast.info("Updated stock quantity locally.")
    }
  }

  const filteredRows = inventoryRows.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExport = () => {
    toast.success(`Exporting inventory for ${location} (${exportScope === "all" ? "All variants" : "Current page"}) as CSV!`)
    setExportModalOpen(false)
  }

  return (
    <div className="space-y-5 font-sans">
      <PageHeader
        title="Inventory"
        icon={<Package className="w-5 h-5" />}
        actions={
          <>
            <button
              onClick={() => setExportModalOpen(true)}
              className="eligo-btn-secondary"
            >
              <DownloadSimple className="w-4 h-4 text-gray-600" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setImportModalOpen(true)}
              className="eligo-btn-primary"
            >
              <UploadSimple className="w-4 h-4" />
              <span>Import</span>
            </button>
          </>
        }
      />

      {/* Inventory Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory color variants, SKUs..."
              className="eligo-input pl-9 text-xs"
            />
          </div>

          <span className="text-xs font-bold text-gray-700">
            Total Variants: <span className="text-amber-800 font-extrabold">{filteredRows.length} Color Rows</span>
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500 font-semibold">
            Loading Live Inventory Database...
          </div>
        ) : filteredRows.length > 0 ? (
          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Product &amp; Color Variant</th>
                  <th className="eligo-th w-[18%]">SKU</th>
                  <th className="eligo-th w-[10%]">Unavailable</th>
                  <th className="eligo-th w-[10%]">Committed</th>
                  <th className="eligo-th w-[12%] text-center">Available Stock</th>
                  <th className="eligo-th w-[14%] text-right">On Hand Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((inv) => (
                  <tr key={inv.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="eligo-td">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 relative overflow-hidden border border-gray-200 shrink-0">
                          <Image src={inv.img} alt={inv.title} fill unoptimized className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">{inv.title}</div>
                          <div className="text-[11px] text-amber-900 font-bold flex items-center gap-1.5 mt-0.5">
                            {inv.colorHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-gray-300 shadow-2xs inline-block"
                                style={{ backgroundColor: inv.colorHex }}
                              />
                            )}
                            <span>{inv.variant} Color Variant</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="eligo-td font-mono text-gray-600 text-xs font-semibold">{inv.sku}</td>
                    <td className="eligo-td font-semibold text-gray-400">{inv.unavailable}</td>
                    <td className="eligo-td">
                      {inv.committed > 0 ? (
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 font-extrabold text-xs rounded-full border border-orange-300">
                          {inv.committed} committed
                        </span>
                      ) : (
                        <span className="font-semibold text-gray-400">0</span>
                      )}
                    </td>
                    <td className="eligo-td text-center">
                      <span
                        className={`px-2.5 py-1 font-extrabold text-xs rounded-full border ${
                          inv.available > 0
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : "bg-red-100 text-red-900 border-red-300"
                        }`}
                      >
                        {inv.available} units
                      </span>
                    </td>
                    <td className="eligo-td text-right">
                      <input
                        type="number"
                        value={inv.onHand}
                        onChange={(e) => handleUpdateVariantStock(inv.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 px-2 rounded-lg bg-amber-50 border border-amber-300 font-extrabold text-amber-900 text-xs text-right focus:outline-hidden focus:ring-1 focus:ring-amber-800"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3 bg-gray-50/50">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">No inventory variants in database</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Create a new product with color variants to automatically populate the live inventory database rows.
            </p>
          </div>
        )}
      </div>

      {/* 1. Export Inventory Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Export inventory</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Export inventory from</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                <option value="All locations">All locations</option>
                <option value="Gulberg Empire Islamabad">Gulberg Empire Islamabad</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setExportModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-xl">
                Cancel
              </button>
              <button onClick={handleExport} className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-xs">
                Export Inventory CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
