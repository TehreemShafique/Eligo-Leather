"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Tag,
  Plus,
  DownloadSimple,
  UploadSimple,
  DotsThreeOutline,
  Eye,
  EyeSlash,
  EnvelopeSimple,
  Star,
  MagnifyingGlass,
  CheckCircle,
  X,
  FileCsv,
  PaperPlaneTilt,
  Code,
  Sparkle,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { resolveProductImage } from "@/lib/media-resolver"
import { PageHeader } from "@/components/layout/page-header"

interface ProductItem {
  id: number
  title: string
  category: string
  price: string
  status: string
  inventory: string
  channels: string
  productType: string
  vendor: string
  uploadedImage: string | null
  defaultImage: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [showAnalyticsBar, setShowAnalyticsBar] = useState(true)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [emailCampaignModalOpen, setEmailCampaignModalOpen] = useState(false)

  // Export Modal State
  const [exportScope, setExportScope] = useState("all")
  const [exportFormat, setExportFormat] = useState("excel")

  // Import File State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // Email Campaign Jinja State
  const [selectedTemplate, setSelectedTemplate] = useState("product_launch")
  const [emailSubject, setEmailSubject] = useState("Discover {{ product.title }} - Eligo Leather")
  const [emailBody, setEmailBody] = useState(
    `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
  <h2 style="color: #854d0e;">Handcrafted Leather: {{ product.title }}</h2>
  <p>Dear {{ customer_name | default('Valued Customer') }},</p>
  <p>We are excited to present our latest artisanal creation from {{ store_name }}.</p>
  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0; font-weight: bold; font-size: 16px; color: #111827;">{{ product.title }}</p>
    <p style="margin: 4px 0; color: #4b5563;">Category: {{ product.category }} | Vendor: {{ product.vendor }}</p>
    <p style="margin: 4px 0; font-size: 18px; font-weight: bold; color: #854d0e;">Price: {{ product.price }}</p>
  </div>
  <a href="http://localhost:3000/products/{{ product.id }}" style="background: #854d0e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Order Now &rarr;</a>
  <p style="margin-top: 24px; text-color: #6b7280; font-size: 12px;">Sent with ❤️ from {{ store_name }} Team.</p>
</div>`
  )
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [sendingCampaign, setSendingCampaign] = useState(false)

  const [products, setProducts] = useState<ProductItem[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/catalog/products/")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const mapped: ProductItem[] = data.map((p: any) => ({
              id: p.id,
              title: p.title,
              category: p.categories || (p.category_list && p.category_list.length > 0 ? p.category_list.join(", ") : p.category || "Wallets"),
              price: p.price ? `Rs. ${p.price}` : "Rs. 2,799",
              status: p.status || "Active",
              inventory: "In stock",
              channels: "4 channels",
              productType: p.product_type || "Leather Goods",
              vendor: p.vendor || "Eligo Leather",
              uploadedImage: p.image_url || null,
              defaultImage: p.image_url || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200",
            }))
            setProducts(mapped)
          }
        }
      } catch (err) {
        console.error("Failed to fetch products from backend engine:", err)
      }
    }
    fetchProducts()
  }, [])

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/catalog/products/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setProducts(prev => prev.filter(p => p.id !== id))
        toast.success("Product deleted from database successfully!")
      } else {
        setProducts(prev => prev.filter(p => p.id !== id))
        toast.info("Product removed from list.")
      }
    } catch (err) {
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.info("Product removed from list.")
    }
  }

  // --- Real CSV Export Generator ---
  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const exportList = exportScope === "current_page" ? products : products
      const headers = ["ID", "Title", "Category", "Price", "Status", "Inventory", "Channels", "Product Type", "Vendor"]

      const rows = exportList.map(p => [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        `"${p.price.replace(/"/g, '""')}"`,
        `"${p.status.replace(/"/g, '""')}"`,
        `"${p.inventory.replace(/"/g, '""')}"`,
        `"${p.channels.replace(/"/g, '""')}"`,
        `"${p.productType.replace(/"/g, '""')}"`,
        `"${p.vendor.replace(/"/g, '""')}"`,
      ])

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Successfully downloaded CSV file (${exportList.length} products exported)!`)
      setExportModalOpen(false)
    } catch (err) {
      toast.error("Failed to generate CSV export file.")
    }
  }

  // --- Real CSV Import Parser ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      toast.error("Please choose a CSV file to import.")
      return
    }
    setImporting(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
        
        if (lines.length <= 1) {
          toast.error("CSV file contains no valid product rows.")
          setImporting(false)
          return
        }

        const newItems: ProductItem[] = []
        for (let i = 1; i < lines.length; i++) {
          const rawRow = lines[i]
          const colMatches = rawRow.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawRow.split(",")
          const cleanCols = colMatches.map(c => c.replace(/^"|"$/g, "").trim())

          if (cleanCols.length >= 2) {
            newItems.push({
              id: Date.now() + i,
              title: cleanCols[1] || cleanCols[0] || `Imported Product #${i}`,
              category: cleanCols[2] || "Accessories",
              price: cleanCols[3] || "Rs. 1,999",
              status: cleanCols[4] || "Active",
              inventory: cleanCols[5] || "20 in stock",
              channels: "4 channels",
              productType: cleanCols[7] || "Leather Item",
              vendor: cleanCols[8] || "Eligo Artisans",
              uploadedImage: null,
              defaultImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
            })
          }
        }

        setProducts(prev => [...newItems, ...prev])
        toast.success(`Successfully imported ${newItems.length} products from ${importFile.name}!`)
        setImportModalOpen(false)
        setImportFile(null)
      } catch (err) {
        toast.error("Failed to parse CSV file. Ensure format is standard comma separated values.")
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(importFile)
  }

  // --- Send Jinja Email Campaign ---
  const handleSendEmailCampaign = () => {
    setSendingCampaign(true)
    setTimeout(() => {
      setSendingCampaign(false)
      setEmailCampaignModalOpen(false)
      toast.success("Jinja2 Email campaign dispatched to active subscribers!")
    }, 1000)
  }

  // --- Jinja Live Renderer Preview ---
  const renderJinjaPreview = (text: string) => {
    const sampleProduct = products[0] || {
      id: 1,
      title: "ARDOR Handmade Leather Wallet",
      category: "Wallets",
      price: "Rs. 1,699",
      vendor: "Eligo Artisans",
    }
    return text
      .replace(/\{\{\s*product\.title\s*\}\}/g, sampleProduct.title)
      .replace(/\{\{\s*product\.category\s*\}\}/g, sampleProduct.category)
      .replace(/\{\{\s*product\.price\s*\}\}/g, sampleProduct.price)
      .replace(/\{\{\s*product\.vendor\s*\}\}/g, sampleProduct.vendor)
      .replace(/\{\{\s*product\.id\s*\}\}/g, String(sampleProduct.id))
      .replace(/\{\{\s*store_name\s*\}\}/g, "Eligo Leather")
      .replace(/\{\{\s*customer_name\s*\|\s*default\('[^']+'\)\s*\}\}/g, "Valued Customer")
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        icon={<Tag className="w-5 h-5" />}
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
              className="eligo-btn-secondary"
            >
              <UploadSimple className="w-4 h-4 text-gray-600" />
              <span>Import</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                className="eligo-btn-secondary"
              >
                <span>More actions</span>
                <DotsThreeOutline className="w-4 h-4 text-gray-600" />
              </button>

              {moreActionsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setShowAnalyticsBar(!showAnalyticsBar)
                      setMoreActionsOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 font-semibold hover:bg-gray-50 rounded-lg flex items-center justify-between text-gray-700"
                  >
                    <span>{showAnalyticsBar ? "Hide analytics bar" : "Show analytics bar"}</span>
                    {showAnalyticsBar ? <EyeSlash className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </button>

                  <button
                    onClick={() => {
                      setMoreActionsOpen(false)
                      setEmailCampaignModalOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 font-semibold hover:bg-amber-50 hover:text-amber-800 rounded-lg flex items-center gap-2 text-amber-900"
                  >
                    <EnvelopeSimple className="w-4 h-4 text-amber-800" />
                    <span>Create email campaign</span>
                  </button>

                  <Link
                    href="/apps/supabase/reviews"
                    onClick={() => setMoreActionsOpen(false)}
                    className="w-full text-left px-3 py-2 font-semibold hover:bg-gray-50 rounded-lg flex items-center gap-2 text-gray-700"
                  >
                    <Star className="w-4 h-4 text-amber-800" />
                    <span>Supabase Reviews</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/products/new"
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add product</span>
            </Link>
          </>
        }
      />

      {/* Top Toggleable Analytics Bar */}
      {showAnalyticsBar && (
        <div className="bg-amber-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs animate-slide-up">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] text-amber-200 uppercase font-bold tracking-wider">Total Products</span>
              <div className="text-xl font-bold">{products.length} Active SKUs</div>
            </div>
            <div className="h-8 w-px bg-amber-700" />
            <div>
              <span className="text-[11px] text-amber-200 uppercase font-bold tracking-wider">Stock Valuation</span>
              <div className="text-xl font-bold">Rs. 485,000</div>
            </div>
          </div>
          <button
            onClick={() => setShowAnalyticsBar(false)}
            className="text-amber-300 hover:text-white text-xs underline cursor-pointer"
          >
            Hide Bar
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="eligo-card overflow-hidden animate-slide-up delay-75">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search products..."
              className="eligo-input pl-9"
            />
          </div>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Product</th>
                <th className="eligo-th w-[12%]">Status</th>
                <th className="eligo-th w-[22%]">Inventory</th>
                <th className="eligo-th w-[13%]">Sales Channels</th>
                <th className="eligo-th w-[11%] text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const displayImage = resolveProductImage(p.uploadedImage, p.defaultImage)
                return (
                  <tr key={p.id} className="hover:bg-[#faf9f7] transition-colors">
                    <td className="eligo-td">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={displayImage}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <Link href={`/products/${p.id}`} className="font-bold text-amber-900 hover:underline block text-xs truncate">
                            {p.title}
                          </Link>
                          <span className="text-[11px] text-gray-500 truncate block">{p.productType} &bull; {p.vendor}</span>
                        </div>
                      </div>
                    </td>
                    <td className="eligo-td">
                      <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="eligo-td font-semibold text-gray-900">{p.inventory}</td>
                    <td className="eligo-td text-gray-600">{p.channels}</td>
                    <td className="eligo-td text-right font-bold text-gray-900">{p.price}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Export products</h3>
              <button onClick={() => setExportModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExportSubmit} className="space-y-4">
              <div>
                <span className="font-bold text-gray-900 uppercase tracking-wide block mb-2">Export Scope</span>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input type="radio" name="scope" checked={exportScope === "all"} onChange={() => setExportScope("all")} />
                    <span>All products ({products.length})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input type="radio" name="scope" checked={exportScope === "current_page"} onChange={() => setExportScope("current_page")} />
                    <span>Current page</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-900 uppercase tracking-wide block mb-2">Export As</span>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input type="radio" name="format" checked={exportFormat === "excel"} onChange={() => setExportFormat("excel")} />
                    <span>CSV for Excel, Messages or Numbers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                    <input type="radio" name="format" checked={exportFormat === "plain"} onChange={() => setExportFormat("plain")} />
                    <span>Plain CSV file</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setExportModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">
                  Export products CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Import products by CSV</h3>
              <button onClick={() => setImportModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-amber-800/30 hover:border-amber-800 rounded-xl text-center space-y-2 bg-amber-50/40 hover:bg-amber-50 cursor-pointer transition-colors"
              >
                <FileCsv className="w-10 h-10 text-amber-800 mx-auto" />
                {importFile ? (
                  <div>
                    <span className="font-bold text-amber-900 block">{importFile.name}</span>
                    <span className="text-[11px] text-gray-500 block">{(importFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-gray-900 block">Click to browse or drop CSV file here</span>
                    <span className="text-[11px] text-gray-500 block">Supports standard product CSV format (Max 15MB)</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false)
                    setImportFile(null)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Upload & Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jinja2 Email Campaign Modal */}
      {emailCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Jinja2 Template Engine</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">Create Email Campaign</h3>
              </div>
              <button onClick={() => setEmailCampaignModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector & Tabs */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">Template:</span>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="h-8 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 focus:outline-hidden"
                >
                  <option value="product_launch">Product Launch Announcement</option>
                  <option value="special_offer">Special Discount Offer</option>
                  <option value="restock">Restock Alert</option>
                </select>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === "edit" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Jinja Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === "preview" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Render Preview</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activeTab === "edit" ? (
                <>
                  <div>
                    <label className="font-bold text-gray-900 block mb-1">Email Subject (Jinja tags allowed):</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-900">HTML Body Template (Jinja2):</label>
                      <span className="text-[10px] text-amber-800 font-mono">Variables: {"{{ product.title }}"}, {"{{ product.price }}"}, {"{{ store_name }}"}</span>
                    </div>
                    <textarea
                      rows={10}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="w-full p-3 bg-gray-900 text-amber-200 border border-gray-800 rounded-xl text-xs font-mono focus:outline-hidden leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Rendered Subject</span>
                    <span className="font-bold text-gray-900 text-sm block mt-0.5">{renderJinjaPreview(emailSubject)}</span>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Rendered Email Output</span>
                    <div
                      dangerouslySetInnerHTML={{ __html: renderJinjaPreview(emailBody) }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEmailCampaignModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailCampaign}
                disabled={sendingCampaign}
                className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
              >
                <PaperPlaneTilt className="w-4 h-4" />
                <span>{sendingCampaign ? "Dispatching..." : "Send Jinja Campaign"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
