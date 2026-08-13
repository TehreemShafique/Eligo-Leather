"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Sliders,
  Eye,
  Plus,
  Code,
  Sparkle,
  CheckCircle,
  Play,
  Copy,
  Check,
  FloppyDisk,
  WarningCircle,
  Lightning,
  X,
  Tag,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsCustomerEventsPage() {
  const DEFAULT_HEADER_SCRIPTS = `<!-- Microsoft Clarity Session Recorder -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){\n        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
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
  const [activeTab, setActiveTab] = useState<"pixels" | "code" | "simulator">("pixels")
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [detectedTags, setDetectedTags] = useState<Array<{ name: string; type: string; status: string; id: string }>>([])

  // Modal State for Adding Custom Web Pixel / Script
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPixelType, setNewPixelType] = useState<"ga4" | "ms_clarity" | "fb_pixel" | "custom">("custom")
  const [newPixelName, setNewPixelName] = useState("TikTok Pixel")
  const [newPixelCode, setNewPixelCode] = useState(`<script>
  console.log("Custom Tracking Pixel Loaded!");
</script>`)

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
      // Fallback defaults remain intact
    }
  }, [mounted])

  // Run DOM & Script Execution Simulator
  const runScriptSimulation = () => {
    setSimulationRunning(true)
    toast.info("Executing storefront header script visual simulator...")

    setTimeout(() => {
      const tags: Array<{ name: string; type: string; status: string; id: string }> = []

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
          type: "Traffic & Ecommerce Conversion Analytics",
          status: "Executing in <head>",
          id: "gtag_G-ELIGO94821",
        })
      }

      if (headerScripts.includes("connect.facebook.net") || headerScripts.includes("fbq")) {
        tags.push({
          name: "Meta Pixel (Facebook)",
          type: "Retargeting & Ad Attribution",
          status: "Executing in <head>",
          id: "fbq_pixel_1049281",
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

  const handleSaveScripts = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    localStorage.setItem("eligo_store_header_scripts", headerScripts)
    setTimeout(() => {
      setSaving(false)
      toast.success("Header scripts saved & published live to storefront <head>!")
      runScriptSimulation()
    }, 650)
  }

  const handleAddPixelSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let codeToAdd = newPixelCode
    if (newPixelType === "ga4") {
      codeToAdd = `\n<!-- Google Analytics 4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-GA4ID"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-GA4ID');\n</script>\n`
    } else if (newPixelType === "ms_clarity") {
      codeToAdd = `\n<!-- Microsoft Clarity -->\n<script type="text/javascript">\n    (function(c,l,a,r,i,t,y){\n        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\n        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n    })(window, document, "clarity", "script", "clarity_id");\n</script>\n`
    } else if (newPixelType === "fb_pixel") {
      codeToAdd = `\n<!-- Meta Pixel -->\n<script>\n!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', 'FB_PIXEL_ID');fbq('track', 'PageView');\n</script>\n`
    }

    const updated = headerScripts + `\n\n<!-- Custom Pixel: ${newPixelName} -->\n` + codeToAdd
    setHeaderScripts(updated)
    localStorage.setItem("eligo_store_header_scripts", updated)

    setShowAddModal(false)
    toast.success(`Connected '${newPixelName}' and saved script to storefront!`)
    runScriptSimulation()
  }

  const handleInsertPreset = (presetType: "ms_clarity" | "ga4" | "fb_pixel") => {
    let snippet = ""
    if (presetType === "ms_clarity") {
      snippet = `\n<!-- Microsoft Clarity Session Recorder -->\n<script type="text/javascript">\n    (function(c,l,a,r,i,t,y){\n        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\n        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n    })(window, document, "clarity", "script", "clarity_id_here");\n</script>\n`
    } else if (presetType === "ga4") {
      snippet = `\n<!-- Google Analytics 4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOURGA4ID"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-YOURGA4ID');\n</script>\n`
    } else if (presetType === "fb_pixel") {
      snippet = `\n<!-- Facebook Meta Pixel -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', 'FB_PIXEL_ID');\nfbq('track', 'PageView');\n</script>\n`
    }

    setHeaderScripts(prev => prev + snippet)
    toast.success(`Inserted ${presetType.toUpperCase()} preset script!`)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
              <Sliders className="w-4 h-4 text-amber-800" />
              <span>Customer Events &amp; Web Pixels</span>
            
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Events</h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage web pixels, customer event telemetry, and custom tracking scripts injected into storefront &amp; checkout.
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
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
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
            <span>Script Execution Simulator</span>
          </button>
        </div>
      </div>

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

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-bold">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleInsertPreset("ms_clarity")}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-[11px] rounded-lg border border-amber-200 transition-colors"
                >
                  + Microsoft Clarity
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertPreset("ga4")}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-[11px] rounded-lg border border-blue-200 transition-colors"
                >
                  + Google Analytics 4
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertPreset("fb_pixel")}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-[11px] rounded-lg border border-indigo-200 transition-colors"
                >
                  + Meta Pixel
                </button>
              </div>
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
                  Scripts saved here will auto-execute on customer storefront page load (`GET /api/v1/store/public/header-scripts`).
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
            {/* Active Executing Tags */}
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

            {/* DOM Execution Console Output */}
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

      {/* Add Custom Pixel / Script Modal */}
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
                <label className="block font-bold text-gray-700 mb-1">Select Pixel Integration Preset</label>
                <select
                  value={newPixelType}
                  onChange={(e) => setNewPixelType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 focus:outline-hidden"
                >
                  <option value="custom">Custom JS / HTML Script Tag</option>
                  <option value="ga4">Google Analytics 4 (GA4)</option>
                  <option value="ms_clarity">Microsoft Clarity Session Recorder</option>
                  <option value="fb_pixel">Meta Pixel (Facebook Ads)</option>
                </select>
              </div>

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
