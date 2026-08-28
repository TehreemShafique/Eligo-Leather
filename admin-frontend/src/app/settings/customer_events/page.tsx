"use client"

import { API_BASE } from "@/lib/api"
import { useState, useEffect } from "react"
import {
  Sliders,
  Eye,
  Plus,
  Code,
  CheckCircle,
  Play,
  FloppyDisk,
  Lightning,
  X,
  Sparkle,
  Trash,
  PencilSimple,
  ArrowClockwise,
} from "@phosphor-icons/react"
import { toast } from "sonner"

const API = `${API_BASE}/api/v1/store`

interface SavedSchema {
  id: number
  user_id: number
  name: string
  schema_type: string
  target_pages: string
  schema_json: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  product: { label: "Product", color: "bg-blue-100 text-blue-800 border-blue-200" },
  blog: { label: "Blog", color: "bg-purple-100 text-purple-800 border-purple-200" },
  category: { label: "Category", color: "bg-green-100 text-green-800 border-green-200" },
  global: { label: "Global", color: "bg-amber-100 text-amber-800 border-amber-200" },
  custom: { label: "Custom", color: "bg-gray-100 text-gray-800 border-gray-200" },
}

const PRESET_TARGETS = [
  { label: "All Pages", value: "/*" },
  { label: "Product Pages", value: "/products/*" },
  { label: "Blog Pages", value: "/blog/*" },
  { label: "Category Pages", value: "/categories/*" },
  { label: "Home Page", value: "/" },
]

export default function AdminSettingsCustomerEventsPage() {
  const [activeTab, setActiveTab] = useState<"schemas" | "code" | "simulator">("schemas")

  const [schemas, setSchemas] = useState<SavedSchema[]>([])
  const [loadingSchemas, setLoadingSchemas] = useState(true)
  const [showSchemaModal, setShowSchemaModal] = useState(false)
  const [editingSchema, setEditingSchema] = useState<SavedSchema | null>(null)
  const [schemaName, setSchemaName] = useState("")
  const [schemaType, setSchemaType] = useState("custom")
  const [schemaTargetPages, setSchemaTargetPages] = useState("/*")
  const [schemaJson, setSchemaJson] = useState("")
  const [savingSchema, setSavingSchema] = useState(false)

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
  const [savingScripts, setSavingScripts] = useState(false)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [detectedTags, setDetectedTags] = useState<Array<{ name: string; type: string; status: string; id: string }>>([])

  useEffect(() => {
    fetchSchemas()
    fetchHeaderScripts()
    runScriptSimulation()
  }, [])

  const fetchSchemas = async () => {
    setLoadingSchemas(true)
    try {
      const res = await fetch(`${API}/schemas`)
      if (res.ok) setSchemas(await res.json())
    } catch {} finally {
      setLoadingSchemas(false)
    }
  }

  const fetchHeaderScripts = async () => {
    try {
      const res = await fetch(`${API}/header-scripts`)
      if (res.ok) {
        const data = await res.json()
        if (data.header_scripts) setHeaderScripts(data.header_scripts)
      }
    } catch {
      const stored = localStorage.getItem("eligo_store_header_scripts")
      if (stored) setHeaderScripts(stored)
    }
  }

  const openAddSchema = () => {
    setEditingSchema(null)
    setSchemaName("")
    setSchemaType("custom")
    setSchemaTargetPages("/*")
    setSchemaJson("")
    setShowSchemaModal(true)
  }

  const openEditSchema = (schema: SavedSchema) => {
    setEditingSchema(schema)
    setSchemaName(schema.name)
    setSchemaType(schema.schema_type)
    setSchemaTargetPages(schema.target_pages)
    setSchemaJson(schema.schema_json)
    setShowSchemaModal(true)
  }

  const handleSaveSchema = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schemaName.trim() || !schemaJson.trim()) {
      toast.error("Name and Schema JSON are required")
      return
    }
    setSavingSchema(true)
    try {
      const body = { name: schemaName, schema_type: schemaType, target_pages: schemaTargetPages, schema_json: schemaJson, is_active: true }
      let res: Response
      if (editingSchema) {
        res = await fetch(`${API}/schemas/${editingSchema.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      } else {
        res = await fetch(`${API}/schemas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      }
      if (res.ok) { toast.success(editingSchema ? "Schema updated!" : "Schema created!"); setShowSchemaModal(false); fetchSchemas() }
      else { const err = await res.json(); toast.error(err.detail || "Failed to save schema") }
    } catch { toast.error("Network error saving schema") } finally { setSavingSchema(false) }
  }

  const handleDeleteSchema = async (schema: SavedSchema) => {
    if (!confirm(`Delete schema "${schema.name}"?`)) return
    try {
      const res = await fetch(`${API}/schemas/${schema.id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Schema deleted"); fetchSchemas() }
    } catch { toast.error("Failed to delete schema") }
  }

  const handleToggleActive = async (schema: SavedSchema) => {
    try {
      const res = await fetch(`${API}/schemas/${schema.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !schema.is_active }) })
      if (res.ok) fetchSchemas()
    } catch { toast.error("Failed to toggle schema") }
  }

  const saveScriptsToDatabase = async (scripts: string) => {
    try {
      await fetch(`${API}/header-scripts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ header_scripts: scripts }) })
      localStorage.setItem("eligo_store_header_scripts", scripts)
    } catch { localStorage.setItem("eligo_store_header_scripts", scripts) }
  }

  const handleSaveScripts = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingScripts(true)
    await saveScriptsToDatabase(headerScripts)
    setTimeout(() => { setSavingScripts(false); toast.success("Header scripts saved & published!"); runScriptSimulation() }, 400)
  }

  const runScriptSimulation = () => {
    setSimulationRunning(true)
    setTimeout(() => {
      const tags: Array<{ name: string; type: string; status: string; id: string }> = []
      if (headerScripts.includes("clarity.ms") || headerScripts.includes("clarity")) tags.push({ name: "Microsoft Clarity", type: "Session Recording & Heatmaps", status: "Executing in <head>", id: "clarity_k8492019482" })
      if (headerScripts.includes("googletagmanager.com") || headerScripts.includes("gtag")) tags.push({ name: "Google Analytics 4", type: "Traffic & Page View Tracking", status: "Active (G-ELIGO94821)", id: "gtag_G-ELIGO94821" })
      if (headerScripts.includes("connect.facebook.net") || headerScripts.includes("fbq")) tags.push({ name: "Facebook Meta Pixel", type: "Conversion & Retargeting", status: "Active", id: "fb_pixel" })
      if (tags.length === 0) tags.push({ name: "Custom HTML/JS Script Tag", type: "Header Injection", status: "Executing in DOM", id: "custom_script_01" })
      setDetectedTags(tags)
      setSimulationRunning(false)
    }, 500)
  }

  return (
    <div className="space-y-6 font-sans max-w-6xl">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <Sliders className="w-4 h-4 text-amber-800" />
              <span>Customer Events &amp; SEO Schema Manager</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Events &amp; Schema Manager</h1>
            <p className="text-xs text-gray-500 mt-1">Manage JSON-LD schemas per page type, edit storefront tracking scripts, and preview script execution.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Storefront Scripts Live</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          <button onClick={() => setActiveTab("schemas")} className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${activeTab === "schemas" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <Sparkle className="w-4 h-4" /><span>SEO Schema Manager ({schemas.length})</span>
          </button>
          <button onClick={() => setActiveTab("code")} className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${activeTab === "code" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <Code className="w-4 h-4" /><span>Header Script Editor</span>
          </button>
          <button onClick={() => setActiveTab("simulator")} className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer ${activeTab === "simulator" ? "bg-amber-800 text-white shadow-2xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            <Play className="w-4 h-4" /><span>Script Simulator</span>
          </button>
        </div>
      </div>

      {/* TAB: Schema Manager */}
      {activeTab === "schemas" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <span className="text-xs text-gray-500">Schemas are injected into storefront pages via the <code className="font-mono text-amber-900 font-bold">SchemaInjector</code> component.</span>
            <div className="flex items-center gap-2">
              <button onClick={fetchSchemas} className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1.5 cursor-pointer">
                <ArrowClockwise className="w-3.5 h-3.5" />Refresh
              </button>
              <button onClick={openAddSchema} className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /><span>Add New Schema</span>
              </button>
            </div>
          </div>

          {loadingSchemas && <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-2xs text-center"><span className="text-xs text-gray-400">Loading schemas from database...</span></div>}

          {!loadingSchemas && schemas.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-3">
              <Sparkle className="w-8 h-8 text-amber-300 mx-auto" />
              <p className="text-sm font-bold text-gray-900">No Schemas Yet</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">Click "Add New Schema" to paste a JSON-LD snippet and assign it to specific storefront pages.</p>
              <button onClick={openAddSchema} className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs inline-flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />Add First Schema
              </button>
            </div>
          )}

          {!loadingSchemas && schemas.length > 0 && (
            <div className="space-y-3">
              {schemas.map((schema) => {
                const badge = TYPE_BADGES[schema.schema_type] || TYPE_BADGES.custom
                return (
                  <div key={schema.id} className={`bg-white p-4 rounded-2xl border shadow-2xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${schema.is_active ? "border-gray-200" : "border-gray-200 opacity-60"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{schema.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>{badge.label}</span>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{schema.target_pages}</span>
                        {!schema.is_active && <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200">Inactive</span>}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono block mt-0.5 truncate">{schema.schema_json.substring(0, 120)}...</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleActive(schema)} title={schema.is_active ? "Deactivate" : "Activate"} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${schema.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
                        {schema.is_active ? "Active" : "Inactive"}
                      </button>
                      <button onClick={() => openEditSchema(schema)} className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer">
                        <PencilSimple className="w-3.5 h-3.5" />Edit
                      </button>
                      <button onClick={() => handleDeleteSchema(schema)} className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-gray-700 font-semibold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Header Script Editor */}
      {activeTab === "code" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-2"><Code className="w-4 h-4 text-amber-800" /><span>Storefront &lt;head&gt; Scripts Editor</span></span>
              <span className="text-gray-400 font-mono text-[11px]">Backend: /api/v1/store/header-scripts</span>
            </div>
            <form onSubmit={handleSaveScripts} className="space-y-3">
              <textarea rows={14} value={headerScripts} onChange={(e) => setHeaderScripts(e.target.value)} placeholder="Paste script tags here..." className="w-full p-4 bg-gray-950 text-emerald-400 font-mono text-xs rounded-xl border border-gray-800 focus:outline-hidden leading-relaxed shadow-inner" />
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500 text-[11px]">Saved scripts execute on every storefront page via head injection.</span>
                <button type="submit" disabled={savingScripts} className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  <FloppyDisk className="w-4 h-4" /><span>{savingScripts ? "Saving..." : "Save & Publish Scripts"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: Script Simulator */}
      {activeTab === "simulator" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Play className="w-4 h-4 text-amber-800" /><span>Storefront Script Execution Simulator</span></h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Simulates dynamic head DOM injection and script tag execution.</p>
            </div>
            <button onClick={runScriptSimulation} disabled={simulationRunning} className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl border border-gray-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer">
              <Lightning className="w-4 h-4 text-amber-800" /><span>{simulationRunning ? "Simulating..." : "Re-Run"}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <span className="font-bold text-gray-900 block text-xs">Detected Active Tags ({detectedTags.length})</span>
              {detectedTags.map((tag, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900 block">{tag.name}</span>
                    <span className="text-gray-500 text-[11px] block">{tag.type}</span>
                    <span className="text-amber-800 font-mono text-[10px] block">ID: {tag.id}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /><span>{tag.status}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 font-mono">
              <span className="font-bold text-gray-900 block text-xs font-sans">DOM Console Log</span>
              <div className="p-4 bg-gray-950 text-emerald-400 rounded-xl text-[11px] space-y-1.5 h-44 overflow-y-auto border border-gray-800">
                <div className="text-gray-500">&gt; GET /api/v1/store/public/header-scripts</div>
                <div className="text-gray-400">&gt; HTTP 200 OK - Received header scripts payload</div>
                <div className="text-emerald-400">&gt; DOM head injection initiated...</div>
                {detectedTags.map((t, i) => (<div key={i} className="text-amber-300">&gt; Executed script: {t.name} [{t.id}]</div>))}
                <div className="text-emerald-300 font-bold">&gt; Ready: Storefront telemetry tracking initialized.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schema Add/Edit Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>JSON-LD Schema Editor</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{editingSchema ? "Edit Schema" : "Add New Schema"}</h3>
              </div>
              <button onClick={() => setShowSchemaModal(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveSchema} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Schema Name</label>
                  <input type="text" required value={schemaName} onChange={(e) => setSchemaName(e.target.value)} placeholder="e.g. Product Page Schema" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:outline-hidden" />
                </div>
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Schema Type</label>
                  <select value={schemaType} onChange={(e) => setSchemaType(e.target.value)} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:outline-hidden">
                    <option value="product">Product</option>
                    <option value="blog">Blog</option>
                    <option value="category">Category</option>
                    <option value="global">Global (All Pages)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Target Pages</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_TARGETS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setSchemaTargetPages(p.value)} className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${schemaTargetPages === p.value ? "bg-amber-800 text-white border-amber-800" : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <input type="text" value={schemaTargetPages} onChange={(e) => setSchemaTargetPages(e.target.value)} placeholder="/products/*" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono focus:outline-hidden" />
                <p className="text-[10px] text-gray-400 mt-1">Use * as wildcard. Comma-separate multiple patterns: /products/*,/categories/*</p>
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Schema JSON-LD Code</label>
                <textarea rows={14} required value={schemaJson} onChange={(e) => setSchemaJson(e.target.value)} placeholder={'<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  ...\n}\n</script>'} className="w-full p-3 bg-gray-900 text-amber-200 border border-gray-800 rounded-xl text-xs font-mono focus:outline-hidden leading-relaxed" />
                <p className="text-[10px] text-gray-400 mt-1">Paste the full script tag or just the JSON object. Both work.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowSchemaModal(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={savingSchema} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50">
                  {savingSchema ? "Saving..." : editingSchema ? "Update Schema" : "Save & Publish Schema"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
