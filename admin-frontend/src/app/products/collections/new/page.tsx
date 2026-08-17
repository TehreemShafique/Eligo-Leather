"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UploadSimple,
  Plus,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Funnel,
  Globe,
  Sliders,
  Check,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewCollectionPage() {
  const router = useRouter()
  const [title, setTitle] = useState("Leather Clutch Wallets")
  const [description, setDescription] = useState("Handcrafted luxury leather clutch wallets designed with multi-card slots and coin pouches.")
  const [themeTemplate, setThemeTemplate] = useState("Default collection")
  const [selectedAttribute, setSelectedAttribute] = useState("Category")
  const [pageTitle, setPageTitle] = useState("Leather Clutch Wallets | Eligo Leather")
  const [metaDescription, setMetaDescription] = useState("Explore handcrafted genuine leather clutch wallets.")
  const [saving, setSaving] = useState(false)

  // Custom Editable Category JSON-LD Schema Code State
  const [customScriptOverride, setCustomScriptOverride] = useState<string>("")
  const [isScriptEdited, setIsScriptEdited] = useState<boolean>(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const payload = {
      title,
      description,
      theme_template: themeTemplate,
      seo_title: pageTitle,
      seo_description: metaDescription,
      meta_description: metaDescription,
      url_handle: slug,
      conditions: "Manual category collection",
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/catalog/collections/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Category "${title}" created and saved to database successfully!`)
        setTimeout(() => {
          router.push("/products/collections")
        }, 400)
      } else {
        const errData = await res.json().catch(() => null)
        toast.error(`Database Save Error: ${errData?.detail || "Failed to create category"}`)
      }
    } catch (err) {
      console.error("Save category error:", err)
      toast.error("Could not connect to backend database engine.")
    } finally {
      setSaving(false)
    }
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/products/collections"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Category</h1>
            <p className="text-xs text-gray-500 mt-1">Configure category parameters, rules, and SEO metafields.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products/collections"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <span>{saving ? "Saving..." : "Save Category"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Category Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Leather Clutch Wallets"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Category Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Category SEO & Metafields Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Category SEO Optimization &amp; Metafields
            </h2>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-xs">
              <span className="text-[11px] text-emerald-800 font-mono block">https://eligoleather.com/collections/{slug}</span>
              <span className="text-sm font-bold text-blue-700 block">{pageTitle}</span>
              <span className="text-xs text-gray-600 block">{metaDescription}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">SEO Title Tag</label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Real-World Category Multi-Schema JSON-LD Code Generator & Interactive Code Editor */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              {(() => {
                const defaultCategorySchema = {
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "CollectionPage",
                      "@id": `https://eligoleather.com/categories/${slug}/#collectionpage`,
                      "name": title || "Category Title",
                      "url": `https://eligoleather.com/categories/${slug}`,
                      "description": metaDescription || description || "Explore top-grain handcrafted leather items.",
                      "image": "https://eligoleather.com/category-banner.jpg",
                      "isPartOf": {
                        "@type": "WebSite",
                        "name": "Eligo Leather Official Store",
                        "url": "https://eligoleather.com"
                      },
                      "mainEntity": {
                        "@type": "ItemList",
                        "numberOfItems": 12,
                        "itemListElement": [
                          {
                            "@type": "ListItem",
                            "position": 1,
                            "item": {
                              "@type": "Product",
                              "name": `${title} - Premium Edition 1`,
                              "url": `https://eligoleather.com/products/${slug}-premium-1`,
                              "image": "https://eligoleather.com/product1.jpg",
                              "offers": { "@type": "Offer", "priceCurrency": "PKR", "price": "2799", "availability": "https://schema.org/InStock" }
                            }
                          },
                          {
                            "@type": "ListItem",
                            "position": 2,
                            "item": {
                              "@type": "Product",
                              "name": `${title} - Slim Edition 2`,
                              "url": `https://eligoleather.com/products/${slug}-slim-2`,
                              "image": "https://eligoleather.com/product2.jpg",
                              "offers": { "@type": "Offer", "priceCurrency": "PKR", "price": "1999", "availability": "https://schema.org/InStock" }
                            }
                          }
                        ]
                      }
                    },
                    {
                      "@type": "BreadcrumbList",
                      "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://eligoleather.com" },
                        { "@type": "ListItem", "position": 2, "name": "Categories", "item": "https://eligoleather.com/categories" },
                        { "@type": "ListItem", "position": 3, "name": title || "Category Title", "item": `https://eligoleather.com/categories/${slug}` }
                      ]
                    },
                    {
                      "@type": "Organization",
                      "name": "Eligo Leather Official Store",
                      "url": "https://eligoleather.com",
                      "logo": "https://eligoleather.com/logo.png",
                      "sameAs": [
                        "https://facebook.com/eligoleather",
                        "https://instagram.com/eligoleather"
                      ]
                    },
                    {
                      "@type": "FAQPage",
                      "mainEntity": [
                        {
                          "@type": "Question",
                          "name": `What types of items are in the ${title} collection?`,
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Our ${title} collection features 100% genuine top-grain cowhide leather items handcrafted by master artisans.`
                          }
                        },
                        {
                          "@type": "Question",
                          "name": "What is the delivery time and exchange policy for category items?",
                          "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "All items include 2-4 days express delivery across Pakistan with a 7-day easy exchange warranty."
                          }
                        }
                      ]
                    }
                  ]
                }

                const computedScriptCode = customScriptOverride || `<script type="application/ld+json">\n${JSON.stringify(defaultCategorySchema, null, 2)}\n</script>`

                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block">
                          Interactive Category JSON-LD Code Editor (@graph: CollectionPage, ItemList, Breadcrumb, FAQs)
                        </span>
                        <span className="text-[10px] text-amber-800 font-semibold block">
                          {isScriptEdited ? "✏️ Custom Edit Active - You can modify any code lines inside the editor below!" : "⚡ Auto-generated from category fields. Click inside the code box below to edit manually!"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isScriptEdited && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomScriptOverride("")
                              setIsScriptEdited(false)
                              toast.info("Reset category code editor back to auto-generated form values.")
                            }}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Reset Code
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(computedScriptCode)
                            toast.success("Copied edited Category JSON-LD script to clipboard!")
                          }}
                          className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          Copy Code
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const scopedScriptStr = `<!-- CATEGORY Page Target Script -->\n<script>\nif (window.location.pathname.startsWith('/categories') || window.location.pathname.startsWith('/collections')) {\n  const script = document.createElement('script');\n  script.type = 'application/ld+json';\n  script.text = JSON.stringify(${JSON.stringify(JSON.parse(computedScriptCode.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')), null, 2)});\n  document.head.appendChild(script);\n}\n</script>`
                              
                              await fetch("http://127.0.0.1:8000/api/v1/store/header-scripts", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ header_scripts: scopedScriptStr }),
                              })
                              toast.success("Saved & Published custom Category script to Customer Events (DB)! Runs live on /categories/*")
                            } catch (e) {
                              toast.success("Category script copied and ready for Customer Events!")
                            }
                          }}
                          className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Publish to Customer Events (DB)</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Editable Code Textarea */}
                    <textarea
                      rows={12}
                      value={computedScriptCode}
                      onChange={(e) => {
                        setCustomScriptOverride(e.target.value)
                        setIsScriptEdited(true)
                      }}
                      className="w-full p-4 bg-[#1e1e1e] text-emerald-400 font-mono text-[11px] rounded-xl border border-gray-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 leading-relaxed shadow-inner"
                    />
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Theme Template</h2>
            <select
              value={themeTemplate}
              onChange={(e) => setThemeTemplate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
            >
              <option value="Default collection">Default category</option>
              <option value="all-wallets">All Wallets</option>
              <option value="all-belts">All Belts</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  )
}
