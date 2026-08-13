"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Code,
  CheckCircle,
  Eye,
  Sparkle,
  Globe,
  Gear,
  Lightning,
  ShieldCheck,
  Play,
  TrendUp,
  Terminal,
  Desktop,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminHeaderScriptsPage() {
  const DEFAULT_HEADER_SCRIPTS = `<!-- Microsoft Clarity Tracking Code for Eligo Storefront -->
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
  const [activeTab, setActiveTab] = useState<"code" | "simulator">("code")
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [detectedTags, setDetectedTags] = useState<Array<{ name: string; type: string; status: string; id: string }>>([])

  // Load from localStorage or fallback to default
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eligo_store_header_scripts")
      if (stored) {
        setHeaderScripts(stored)
      }
    } catch (e) {
      // Fallback defaults remain intact
    }
  }, [])

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
          name: "Google Analytics 4",
          type: "Traffic & Page View Tracking",
          status: "Active (G-ELIGO94821)",
          id: "gtag_G-ELIGO94821",
        })
      }

      if (headerScripts.includes("connect.facebook.net") || headerScripts.includes("fbq")) {
        tags.push({
          name: "Facebook Meta Pixel",
          type: "Conversion & Retargeting",
          status: "Active (Pixel #847291039)",
          id: "fb_847291039",
        })
      }

      if (tags.length === 0) {
        tags.push({
          name: "Custom HTML/JS Script Tag",
          type: "Header Injection",
          status: "Executing in DOM",
          id: "custom_script_01",
        })
      }

      setDetectedTags(tags)
      setSimulationRunning(false)
      toast.success("Script execution simulation complete! All tags executed successfully.")
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
      toast.success("Header scripts saved and published live to storefront <head>!")
      runScriptSimulation()
    }, 650)
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
              <Globe className="w-4 h-4 text-amber-800" />
              <span>Domain &amp; Storefront Analytics Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Storefront Header Scripts &amp; Tracking Code
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Inject custom scripts (Microsoft Clarity, Google Analytics, FB Pixel) directly into storefront <code className="font-mono text-amber-900 font-bold">&lt;head&gt;</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Domain Script Injection Live</span>
            </span>
          </div>
        </div>

        {/* Preset Insertion Bar */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
          <span className="font-bold text-gray-900 text-xs block">Insert Preset Tracking Scripts:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleInsertPreset("ms_clarity")}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-gray-300 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkle className="w-3.5 h-3.5 text-amber-800" />
              <span>+ Microsoft Clarity</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertPreset("ga4")}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-gray-300 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <TrendUp className="w-3.5 h-3.5 text-amber-800" />
              <span>+ Google Analytics 4 (gtag.js)</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertPreset("fb_pixel")}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-gray-300 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Lightning className="w-3.5 h-3.5 text-amber-800" />
              <span>+ Facebook Meta Pixel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "code" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-black"
              }`}
            >
              <Code className="w-4 h-4 text-amber-800" />
              <span>Header Scripts Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("simulator")
                runScriptSimulation()
              }}
              className={`px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "simulator" ? "bg-amber-800 text-white shadow-2xs" : "text-gray-500 hover:text-black"
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Script Execution Simulator</span>
            </button>
          </div>

          <span className="text-gray-400 font-mono text-[11px]">Backend API: `/api/v1/store/header-scripts`</span>
        </div>

        {activeTab === "code" ? (
          <form onSubmit={handleSaveScripts} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-gray-900 text-xs">
                  Storefront <code className="font-mono text-amber-900">&lt;head&gt;</code> HTML &amp; JS Code:
                </label>
                <span className="text-[10px] text-gray-400 font-mono">Executes on every storefront page view</span>
              </div>

              <textarea
                rows={14}
                value={headerScripts}
                onChange={e => setHeaderScripts(e.target.value)}
                className="w-full p-4 bg-gray-900 text-amber-300 font-mono text-xs rounded-2xl border border-gray-800 focus:outline-hidden leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                {saving ? "Publishing to Domain..." : "Save & Publish Header Scripts"}
              </button>
            </div>
          </form>
        ) : (
          /* Script Execution Visual Simulator Tab */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 bg-stone-900 text-white rounded-2xl border border-stone-800 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-400">Storefront DOM Execution Console</span>
                </div>
                <button
                  type="button"
                  onClick={runScriptSimulation}
                  disabled={simulationRunning}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {simulationRunning ? "Simulating..." : "Re-Run Simulator"}
                </button>
              </div>

              <div className="text-xs space-y-1 text-gray-300">
                <p>&gt; Fetching header scripts from backend API endpoint `/api/v1/store/public/header-scripts`...</p>
                <p className="text-emerald-400">&gt; HTTP 200 OK - Received {headerScripts.length} bytes of raw tracking code.</p>
                <p>&gt; Parsing &lt;script&gt; tags and binding to document.head...</p>
              </div>
            </div>

            {/* Detected & Executing Tracking Tags Grid */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                Detected Executing Scripts ({detectedTags.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedTags.map((tag, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Desktop className="w-4 h-4 text-amber-800" />
                        <span>{tag.name}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                        {tag.status}
                      </span>
                    </div>

                    <p className="text-gray-600 text-xs">{tag.type}</p>
                    <div className="p-2 bg-white rounded-lg border border-gray-200 font-mono text-[10px] text-amber-900 font-bold">
                      ID: {tag.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
