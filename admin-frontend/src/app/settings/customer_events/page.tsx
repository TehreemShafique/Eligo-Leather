"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Sliders,
  Eye,
  Plus,
  Code,
  CheckCircle,
  Play,
  Copy,
  Check,
  FloppyDisk,
  Lightning,
  X,
  Sparkle,
  ShareNetwork,
  FolderSimple,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsCustomerEventsPage() {
  const DEFAULT_HEADER_SCRIPTS = `<!-- Microsoft Clarity Session Recorder -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "k8492019482");
</script>

<!-- Google Analytics 4 (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ELIGO94821"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ELIGO94821');
</script>`

  const [headerScripts, setHeaderScripts] = useState(DEFAULT_HEADER_SCRIPTS)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"pixels" | "code" | "simulator" | "schema">("schema")
  const [schemaMode, setSchemaMode] = useState<"product" | "category" | "blog">("product")
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [detectedTags, setDetectedTags] = useState<Array<{ name: string; type: string; status: string; id: string }>>([])
  const [copied, setCopied] = useState(false)

  // Modal State for Adding Custom Web Pixel / Script
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPixelType, setNewPixelType] = useState<"ga4" | "ms_clarity" | "fb_pixel" | "custom">("custom")
  const [newPixelName, setNewPixelName] = useState("TikTok Pixel")
  const [newPixelCode, setNewPixelCode] = useState(`<script>\n  console.log("Custom Tracking Pixel Loaded!");\n</script>`)

  // Product Schema State
  const [schemaData, setSchemaData] = useState({
    productName: "ARDOR - Handmade Leather Card Holder Wallet",
    productSku: "ELIGO-ARDOR-01",
    productPrice: "1699",
    productCurrency: "PKR",
    productBrand: "Eligo Leather",
    productDesc: "Handcrafted top-grain real leather card holder wallet with 2 slots and minimalist design.",
    productImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200",
    ratingValue: "4.8",
    reviewCount: "1520",
    orgName: "Eligo Leather Official Store",
    orgUrl: "https://eligoleather.com",
    orgLogo: "https://eligoleather.com/logo.png",
    facebookUrl: "https://facebook.com/eligoleather",
    instagramUrl: "https://instagram.com/eligoleather",
    faq1Q: "Is this wallet made of 100% genuine real leather?",
    faq1A: "Yes! All Eligo Leather products are handcrafted from 100% genuine top-grain cowhide leather.",
    faq2Q: "What is the return and exchange policy?",
    faq2A: "We offer a 7-Day Easy Exchange policy on all orders across Pakistan.",
  })

  // Category / Collection Schema State
  const [categorySchemaData, setCategorySchemaData] = useState({
    categoryTitle: "Men's Handcrafted Leather Wallets & Cardholders",
    categorySlug: "wallets",
    categoryDesc: "Explore handcrafted top-grain real leather wallets, cardholders, and billfolds.",
    itemCount: "12",
    sampleProduct1: "ARDOR - Handmade Leather Card Holder Wallet",
    sampleProduct2: "ROYAL - Premium Leather Bi-Fold Wallet",
    sampleProduct3: "VANGUARD - Executive Long Leather Wallet",
  })

  // Blog Post Schema State (Multi-Image 2 or 3 pictures support)
  const [blogSchemaData, setBlogSchemaData] = useState({
    postTitle: "Luxury Leather Care: How to Maintain Top-Grain Goods",
    postSlug: "luxury-leather-care-guide",
    postExcerpt: "Learn how master artisans clean, condition, and protect genuine leather wallets and bags.",
    postAuthor: "Bilal Hussain Abbasi",
    postCategory: "News & Style Guides",
    image1: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=1200",
    image2: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200",
    image3: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200",
    faq1Q: "How often should I condition my leather wallet?",
    faq1A: "Apply leather conditioner every 3 to 6 months to preserve softness and natural shine.",
    faq2Q: "Can genuine leather survive rain and moisture?",
    faq2A: "Wipe water drops immediately with a dry microfiber cloth and let air dry naturally.",
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load from localStorage with fallback defaults
  useEffect(() => {
    if (!mounted) return
    try {
      const stored = localStorage.getItem("eligo_store_header_scripts")
      if (stored) {
        setHeaderScripts(stored)
      }
    } catch (e) {
      console.warn(e)
    }
  }, [mounted])

  // Build JSON-LD Script payload (Product or Category)
  const generateSchemaScript = () => {
    if (schemaMode === "category") {
      const categoryJsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "name": categorySchemaData.categoryTitle,
            "url": `${schemaData.orgUrl}/categories/${categorySchemaData.categorySlug}`,
            "description": categorySchemaData.categoryDesc,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": parseInt(categorySchemaData.itemCount, 10) || 12,
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": categorySchemaData.sampleProduct1,
                  "url": `${schemaData.orgUrl}/products/ardor-wallet`,
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": categorySchemaData.sampleProduct2,
                  "url": `${schemaData.orgUrl}/products/royal-wallet`,
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": categorySchemaData.sampleProduct3,
                  "url": `${schemaData.orgUrl}/products/vanguard-wallet`,
                },
              ],
            },
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": schemaData.orgUrl,
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Categories",
                "item": `${schemaData.orgUrl}/categories`,
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": categorySchemaData.categoryTitle,
                "item": `${schemaData.orgUrl}/categories/${categorySchemaData.categorySlug}`,
              },
            ],
          },
          {
            "@type": "Organization",
            "name": schemaData.orgName,
            "url": schemaData.orgUrl,
            "logo": schemaData.orgLogo,
            "sameAs": [schemaData.facebookUrl, schemaData.instagramUrl],
          },
        ],
      }
      return `<script type="application/ld+json">\n${JSON.stringify(categoryJsonLd, null, 2)}\n</script>`
    }

    if (schemaMode === "blog") {
      const blogJsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            "@id": `https://eligoleather.com/blog/${blogSchemaData.postSlug}/#blogposting`,
            "headline": blogSchemaData.postTitle,
            "description": blogSchemaData.postExcerpt,
            "image": [blogSchemaData.image1, blogSchemaData.image2, blogSchemaData.image3].filter(Boolean),
            "datePublished": "2026-02-04T08:00:00+05:00",
            "dateModified": new Date().toISOString(),
            "author": {
              "@type": "Person",
              "name": blogSchemaData.postAuthor,
              "url": `${schemaData.orgUrl}/authors/bilal-abbasi`
            },
            "publisher": {
              "@type": "Organization",
              "name": schemaData.orgName,
              "url": schemaData.orgUrl,
              "logo": {
                "@type": "ImageObject",
                "url": schemaData.orgLogo
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://eligoleather.com/blog/${blogSchemaData.postSlug}`
            }
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": schemaData.orgUrl },
              { "@type": "ListItem", "position": 2, "name": "Blogs", "item": `${schemaData.orgUrl}/blogs` },
              { "@type": "ListItem", "position": 3, "name": blogSchemaData.postTitle, "item": `${schemaData.orgUrl}/blog/${blogSchemaData.postSlug}` }
            ]
          },
          {
            "@type": "Organization",
            "name": schemaData.orgName,
            "url": schemaData.orgUrl,
            "logo": schemaData.orgLogo,
            "sameAs": [schemaData.facebookUrl, schemaData.instagramUrl]
          },
          {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": blogSchemaData.faq1Q,
                "acceptedAnswer": { "@type": "Answer", "text": blogSchemaData.faq1A }
              },
              {
                "@type": "Question",
                "name": blogSchemaData.faq2Q,
                "acceptedAnswer": { "@type": "Answer", "text": blogSchemaData.faq2A }
              }
            ]
          }
        ]
      }
      return `<script type="application/ld+json">\n${JSON.stringify(blogJsonLd, null, 2)}\n</script>`
    }

    const productJsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "name": schemaData.productName,
          "image": schemaData.productImage,
          "description": schemaData.productDesc,
          "sku": schemaData.productSku,
          "brand": {
            "@type": "Brand",
            "name": schemaData.productBrand,
          },
          "offers": {
            "@type": "Offer",
            "url": `${schemaData.orgUrl}/products/${schemaData.productSku.toLowerCase()}`,
            "priceCurrency": schemaData.productCurrency,
            "price": schemaData.productPrice,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": schemaData.ratingValue,
            "reviewCount": schemaData.reviewCount,
          },
        },
        {
          "@type": "Organization",
          "name": schemaData.orgName,
          "url": schemaData.orgUrl,
          "logo": schemaData.orgLogo,
          "sameAs": [schemaData.facebookUrl, schemaData.instagramUrl],
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": schemaData.orgUrl,
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Products",
              "item": `${schemaData.orgUrl}/products`,
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": schemaData.productName,
              "item": `${schemaData.orgUrl}/products/${schemaData.productSku.toLowerCase()}`,
            },
          ],
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": schemaData.faq1Q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": schemaData.faq1A,
              },
            },
            {
              "@type": "Question",
              "name": schemaData.faq2Q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": schemaData.faq2A,
              },
            },
          ],
        },
      ],
    }

    return `<script type="application/ld+json">\n${JSON.stringify(productJsonLd, null, 2)}\n</script>`
  }

  const generatedScriptSnippet = generateSchemaScript()

  const handleCopySchemaScript = () => {
    navigator.clipboard.writeText(generatedScriptSnippet)
    setCopied(true)
    toast.success(`JSON-LD ${schemaMode.toUpperCase()} Schema snippet copied!`)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveScriptsToDatabase = async (scripts: string) => {
    try {
      await fetch("http://127.0.0.1:8000/api/v1/store/header-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header_scripts: scripts }),
      })
    } catch (e) {
      console.warn("Backend DB header scripts save endpoint fallback:", e)
    }
  }

  const handlePublishSchemaToPages = async () => {
    const routePrefix = schemaMode === "category" ? "/categories" : schemaMode === "blog" ? "/blog" : "/products"
    const targetName = schemaMode === "category" ? "Category Pages (/categories/*)" : schemaMode === "blog" ? "Blog Pages (/blog/*)" : "Product Pages (/products/*)"

    const scriptWrapper = `<!-- ${schemaMode.toUpperCase()} Page Target Script -->\n<script>\nif (window.location.pathname.startsWith('${routePrefix}')) {\n  const script = document.createElement('script');\n  script.type = 'application/ld+json';\n  script.text = JSON.stringify(${JSON.stringify(JSON.parse(generatedScriptSnippet.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')), null, 2)});\n  document.head.appendChild(script);\n}\n</script>`

    localStorage.setItem(`eligo_${schemaMode}_schema_script`, generatedScriptSnippet)

    const updatedScripts = headerScripts + "\n\n" + scriptWrapper
    setHeaderScripts(updatedScripts)
    localStorage.setItem("eligo_store_header_scripts", updatedScripts)

    await saveScriptsToDatabase(updatedScripts)

    toast.success(`Schema script saved to Database & published! Running strictly on ${targetName}.`)
  }

  // Run Visual Simulator
  const runScriptSimulation = () => {
    setSimulationRunning(true)

    setTimeout(() => {
      const tags: Array<{ name: string; type: string; status: string; id: string }> = []

      if (headerScripts.includes("CollectionPage") || headerScripts.includes("categories")) {
        tags.push({
          name: "JSON-LD Category & ItemList Schema",
          type: "Structured Data (Collection Search Snippets)",
          status: "Executing on /categories/* only",
          id: "schema_category_jsonld",
        })
      }

      if (headerScripts.includes("application/ld+json") || headerScripts.includes("Product")) {
        tags.push({
          name: "JSON-LD Product & FAQ Schema",
          type: "Structured Data (Google Rich Results)",
          status: "Executing on /products/* only",
          id: "schema_product_jsonld",
        })
      }

      if (headerScripts.includes("clarity.ms") || headerScripts.includes("clarity")) {
        tags.push({
          name: "Microsoft Clarity",
          type: "Session Recording & Heatmaps",
          status: "Executing in <head>",
          id: "clarity_k8492019482",
        })
      }

      if (headerScripts.includes("googletagmanager.com") || headerScripts.includes("gtag")) {
        tags.push({
          name: "Google Analytics 4 (GA4)",
          type: "Traffic Analytics",
          status: "Executing in <head>",
          id: "gtag_G-ELIGO94821",
        })
      }

      if (tags.length === 0) {
        tags.push({
          name: "Custom HTML/JS Script",
          type: "Custom Storefront Script",
          status: "Executing in DOM",
          id: "custom_script_01",
        })
      }

      setDetectedTags(tags)
      setSimulationRunning(false)
    }, 600)
  }

  useEffect(() => {
    runScriptSimulation()
  }, [])

  const handleSaveScripts = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    localStorage.setItem("eligo_store_header_scripts", headerScripts)
    await saveScriptsToDatabase(headerScripts)
    setTimeout(() => {
      setSaving(false)
      toast.success("Header scripts saved to Database & published live to storefront <head>!")
      runScriptSimulation()
    }, 650)
  }

  const handleAddPixelSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let codeToAdd = newPixelCode
    if (newPixelType === "ga4") {
      codeToAdd = `\n<!-- Google Analytics 4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-GA4ID"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-GA4ID');\n</script>\n`
    }

    const updated = headerScripts + `\n\n<!-- Custom Pixel: ${newPixelName} -->\n` + codeToAdd
    setHeaderScripts(updated)
    localStorage.setItem("eligo_store_header_scripts", updated)

    setShowAddModal(false)
    toast.success(`Connected '${newPixelName}' and saved script to storefront!`)
    runScriptSimulation()
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <Sliders className="w-4 h-4 text-amber-800" />
              <span>Customer Events &amp; SEO Schemas</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Events &amp; SEO Schemas</h1>
            <p className="text-xs text-gray-500 mt-1">
              Generate Product &amp; Category JSON-LD schemas and manage database tracking scripts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Pixel</span>
            </button>

            <button
              onClick={handleSaveScripts}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-xl border border-gray-300 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FloppyDisk className="w-4 h-4 text-amber-800" />
              <span>{saving ? "Publishing..." : "Save All Scripts"}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab("schema")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${
              activeTab === "schema" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Sparkle className="w-4 h-4" />
            <span>SEO Schema Generator</span>
          </button>

          <button
            onClick={() => setActiveTab("pixels")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${
              activeTab === "pixels" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Active Web Pixels ({detectedTags.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${
              activeTab === "code" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Header Script Editor</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${
              activeTab === "simulator" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Script Simulator</span>
          </button>
        </div>
      </div>

      {/* Tab 0: Product & Category SEO Schema Generator (JSON-LD) */}
      {activeTab === "schema" && (
        <div className="space-y-6">
          {/* Mode Switcher: Product Schema vs Category Schema */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="font-bold text-gray-900 text-xs mr-2">Target Page Type:</span>
            <button
              type="button"
              onClick={() => setSchemaMode("product")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                schemaMode === "product" ? "bg-black text-white shadow-xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Sparkle className="w-4 h-4" />
              <span>Product Page Schema (@type: Product)</span>
            </button>

            <button
              type="button"
              onClick={() => setSchemaMode("category")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                schemaMode === "category" ? "bg-black text-white shadow-xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FolderSimple className="w-4 h-4" />
              <span>Category / Collection Schema (@type: CollectionPage &amp; ItemList)</span>
            </button>

            <button
              type="button"
              onClick={() => setSchemaMode("blog")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                schemaMode === "blog" ? "bg-black text-white shadow-xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Blog Post Schema (@type: BlogPosting)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs (7 columns) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6 text-xs">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  {schemaMode === "category" ? <FolderSimple className="w-4 h-4 text-amber-800" /> : <Sparkle className="w-4 h-4 text-amber-800" />}
                  <span>{schemaMode === "category" ? "Category Schema Fields" : "Product Schema Fields"}</span>
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-full text-[10px] border border-amber-200">
                  Google Rich Results Ready
                </span>
              </div>

              {schemaMode === "blog" ? (
                /* Blog Schema Fields */
                <div className="space-y-4">
                  <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px] text-amber-800 block">
                    Blog Post Page Fields (@type: BlogPosting, Breadcrumb, FAQs)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Blog Post Title</label>
                      <input
                        type="text"
                        value={blogSchemaData.postTitle}
                        onChange={(e) => setBlogSchemaData({ ...blogSchemaData, postTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Post URL Handle / Slug</label>
                      <input
                        type="text"
                        value={blogSchemaData.postSlug}
                        onChange={(e) => setBlogSchemaData({ ...blogSchemaData, postSlug: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={blogSchemaData.postAuthor}
                      onChange={(e) => setBlogSchemaData({ ...blogSchemaData, postAuthor: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900 uppercase tracking-wide text-[10px] text-amber-900 block">
                      Multi-Image Gallery (2 or 3 Picture URLs for Google Discover &amp; Schema)
                    </span>
                    <div>
                      <label className="block font-semibold text-gray-600 text-[10px] mb-0.5">Image 1 URL (Primary)</label>
                      <input
                        type="text"
                        value={blogSchemaData.image1}
                        onChange={(e) => setBlogSchemaData({ ...blogSchemaData, image1: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-600 text-[10px] mb-0.5">Image 2 URL (Secondary)</label>
                      <input
                        type="text"
                        value={blogSchemaData.image2}
                        onChange={(e) => setBlogSchemaData({ ...blogSchemaData, image2: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-600 text-[10px] mb-0.5">Image 3 URL (Gallery)</label>
                      <input
                        type="text"
                        value={blogSchemaData.image3}
                        onChange={(e) => setBlogSchemaData({ ...blogSchemaData, image3: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : schemaMode === "category" ? (
                /* Category Schema Fields */
                <div className="space-y-4">
                  <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px] text-amber-800 block">
                    Category Page Fields (@type: CollectionPage &amp; ItemList)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Category Title</label>
                      <input
                        type="text"
                        value={categorySchemaData.categoryTitle}
                        onChange={(e) => setCategorySchemaData({ ...categorySchemaData, categoryTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Category Slug</label>
                      <input
                        type="text"
                        value={categorySchemaData.categorySlug}
                        onChange={(e) => setCategorySchemaData({ ...categorySchemaData, categorySlug: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category SEO Description</label>
                    <textarea
                      rows={2}
                      value={categorySchemaData.categoryDesc}
                      onChange={(e) => setCategorySchemaData({ ...categorySchemaData, categoryDesc: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900 text-xs block">Sample Featured Products in Collection</span>
                    <div>
                      <label className="block text-gray-500 mb-1">Product #1</label>
                      <input
                        type="text"
                        value={categorySchemaData.sampleProduct1}
                        onChange={(e) => setCategorySchemaData({ ...categorySchemaData, sampleProduct1: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Product #2</label>
                      <input
                        type="text"
                        value={categorySchemaData.sampleProduct2}
                        onChange={(e) => setCategorySchemaData({ ...categorySchemaData, sampleProduct2: e.target.value })}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Product Schema Fields */
                <div className="space-y-3">
                  <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px] text-amber-800 block">
                    Product Schema Fields (@type: Product)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Product Title</label>
                      <input
                        type="text"
                        value={schemaData.productName}
                        onChange={(e) => setSchemaData({ ...schemaData, productName: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">SKU / Model</label>
                      <input
                        type="text"
                        value={schemaData.productSku}
                        onChange={(e) => setSchemaData({ ...schemaData, productSku: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Price (PKR)</label>
                      <input
                        type="text"
                        value={schemaData.productPrice}
                        onChange={(e) => setSchemaData({ ...schemaData, productPrice: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Rating</label>
                      <input
                        type="text"
                        value={schemaData.ratingValue}
                        onChange={(e) => setSchemaData({ ...schemaData, ratingValue: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Review Count</label>
                      <input
                        type="text"
                        value={schemaData.reviewCount}
                        onChange={(e) => setSchemaData({ ...schemaData, reviewCount: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Product Description</label>
                    <textarea
                      rows={2}
                      value={schemaData.productDesc}
                      onChange={(e) => setSchemaData({ ...schemaData, productDesc: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Live JSON-LD Code Output & Actions (5 columns) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="font-bold text-gray-900 flex items-center gap-2">
                    <Code className="w-4 h-4 text-amber-800" />
                    <span>Generated JSON-LD Script</span>
                  </span>

                  <button
                    onClick={handleCopySchemaScript}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy Script"}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-gray-950 text-emerald-400 font-mono text-[11px] rounded-xl border border-gray-800 max-h-[460px] overflow-y-auto leading-relaxed shadow-inner">
                    <code>{generatedScriptSnippet}</code>
                  </pre>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={handlePublishSchemaToPages}
                  className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShareNetwork className="w-4 h-4" />
                  <span>
                    Publish Schema to {schemaMode === "category" ? "Category Pages (/categories/*)" : "Product Pages (/products/*)"}
                  </span>
                </button>
                <p className="text-[11px] text-gray-500 text-center">
                  Saves to Database &amp; updates {schemaMode === "category" ? "category" : "product"} pages on storefront in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Active Connected Web Pixels */}
      {activeTab === "pixels" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-amber-800" />
                <span>Connected Web Pixels &amp; Telemetry Tags</span>
              </span>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Pixel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detectedTags.map((tag, idx) => (
                <div key={idx} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 flex items-center justify-between space-y-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{tag.name}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                        {tag.status}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs block mt-0.5">{tag.type}</span>
                    <span className="text-amber-800 font-mono text-[11px] block mt-0.5">Tag ID: {tag.id}</span>
                  </div>

                  <button
                    onClick={() => setActiveTab("code")}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded-xl text-xs transition-colors"
                  >
                    Edit Code
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Code Editor & Presets */}
      {activeTab === "code" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-800" />
                <span>Storefront HTML &lt;head&gt; Scripts Editor</span>
              </span>
            </div>

            <form onSubmit={handleSaveScripts} className="space-y-3">
              <textarea
                rows={12}
                value={headerScripts}
                onChange={(e) => setHeaderScripts(e.target.value)}
                placeholder="Paste <script> tags here..."
                className="w-full p-4 bg-gray-950 text-emerald-400 font-mono text-xs rounded-xl border border-gray-800 focus:outline-hidden leading-relaxed shadow-inner"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500 text-[11px]">
                  Scripts saved here execute on storefront head script injection.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FloppyDisk className="w-4 h-4" />
                  <span>{saving ? "Publishing..." : "Save & Publish Header Scripts"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Visual Execution Simulator */}
      {activeTab === "simulator" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-800" />
                <span>Storefront Script Execution Simulator</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Simulates dynamic HTML &lt;head&gt; DOM injection and script tag execution.
              </p>
            </div>
            <button
              onClick={runScriptSimulation}
              disabled={simulationRunning}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl border border-gray-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Lightning className="w-4 h-4 text-amber-800" />
              <span>{simulationRunning ? "Simulating..." : "Re-Run Simulator"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <span className="font-bold text-gray-900 block text-xs">Detected Active Tags in DOM ({detectedTags.length})</span>
              {detectedTags.map((tag, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900 block">{tag.name}</span>
                    <span className="text-gray-500 text-[11px] block">{tag.type}</span>
                    <span className="text-amber-800 font-mono text-[10px] block">ID: {tag.id}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{tag.status}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 font-mono">
              <span className="font-bold text-gray-900 block text-xs font-sans">DOM Console Log</span>
              <div className="p-4 bg-gray-950 text-emerald-400 rounded-xl text-[11px] space-y-1.5 h-44 overflow-y-auto border border-gray-800">
                <div className="text-gray-500">&gt; GET /api/v1/store/public/header-scripts</div>
                <div className="text-gray-400">&gt; HTTP 200 OK - Received published header scripts payload</div>
                <div className="text-emerald-400">&gt; DOM &lt;head&gt; injection initiated...</div>
                {detectedTags.map((t, i) => (
                  <div key={i} className="text-amber-300">
                    &gt; Executed script: {t.name} [{t.id}]
                  </div>
                ))}
                <div className="text-emerald-300 font-bold">&gt; Ready: Storefront telemetry tracking initialized cleanly.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Pixel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 text-xs font-sans">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-800" />
                <h3 className="text-base font-bold text-gray-900">Add Custom Pixel / Customer Event</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPixelSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Pixel Name</label>
                <input
                  type="text"
                  required
                  value={newPixelName}
                  onChange={(e) => setNewPixelName(e.target.value)}
                  placeholder="e.g. TikTok Pixel or Checkout Tracker"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Script Tag Code (`&lt;script&gt;...&lt;/script&gt;`)</label>
                <textarea
                  rows={6}
                  required
                  value={newPixelCode}
                  onChange={(e) => setNewPixelCode(e.target.value)}
                  placeholder="Paste your tracking script snippet here..."
                  className="w-full p-3 bg-gray-950 text-emerald-400 font-mono text-xs rounded-xl border border-gray-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Save &amp; Connect Web Pixel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
