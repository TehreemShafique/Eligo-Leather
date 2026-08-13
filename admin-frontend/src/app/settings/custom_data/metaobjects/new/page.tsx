"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash,
  Check,
  X,
  Database,
  PencilSimple,
  TextT,
  FileText,
  Image as ImageIcon,
  Palette,
  Hash,
  ToggleLeft,
  Link as LinkIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminNewMetaobjectDefinitionPage() {
  const router = useRouter()
  const [name, setName] = useState("Leather Grain Specs")
  const [description, setDescription] = useState("Structured multi-field definition for leather texture grade, grain type, and care notes.")
  const [storefrontApiAccess, setStorefrontApiAccess] = useState(true)

  // Dynamic Fields State
  const [fields, setFields] = useState([
    { id: 1, name: "Grain Type", type: "Single line text", required: true, description: "e.g. Full Grain, Top Grain, Genuine" },
    { id: 2, name: "Texture Image", type: "Image (File)", required: false, description: "Close-up macro image of leather surface" },
    { id: 3, name: "Care & Cleaning Notes", type: "Multi-line text", required: false, description: "Instructions for maintaining leather" },
  ])

  // New Field Form Drawer State
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState("Single line text")
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldDesc, setNewFieldDesc] = useState("")

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName.trim()) {
      toast.error("Please enter a field name.")
      return
    }

    const createdField = {
      id: Date.now(),
      name: newFieldName,
      type: newFieldType,
      required: newFieldRequired,
      description: newFieldDesc,
    }

    setFields([...fields, createdField])
    setNewFieldName("")
    setNewFieldDesc("")
    setNewFieldRequired(false)
    setAddFieldOpen(false)
    toast.success(`Field "${newFieldName}" added to Metaobject!`)
  }

  const handleRemoveField = (id: number) => {
    setFields(fields.filter((f) => f.id !== id))
    toast.info("Field removed.")
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please provide a metaobject definition name.")
      return
    }
    toast.success(`Metaobject definition "${name}" saved successfully!`)
    setTimeout(() => {
      router.push("/settings/custom_data")
    }, 400)
  }

  const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "")

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/custom_data"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-800" />
              <h1 className="text-2xl font-bold text-gray-900">Add Metaobject Definition</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Define a multi-field structure to hold custom content or complex datasets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/settings/custom_data"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors border border-gray-300"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Metaobject Definition
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Definition Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Definition Details
            </h2>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Name*
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Leather Grain Specs"
                className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-300 text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Type / Handle (System Key)
              </label>
              <div className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-gray-200 font-mono text-gray-700 font-bold flex items-center">
                {handle || "leather_grain_specs"}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Used in GraphQL Liquid &amp; Storefront API queries (`metaobjects.{handle || "leather_grain_specs"}`).
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what data this metaobject structure contains..."
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Fields List Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Fields ({fields.length})
                </h2>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Fields define the individual attributes stored inside each entry of this metaobject.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAddFieldOpen(true)}
                className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add field</span>
              </button>
            </div>

            {/* Rendered Fields Table */}
            <div className="space-y-3">
              {fields.map((f, index) => (
                <div
                  key={f.id}
                  className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 flex items-center justify-between gap-4 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-950 font-mono font-bold text-xs flex items-center justify-center border border-amber-200 shrink-0">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{f.name}</span>
                        {f.required && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      {f.description && (
                        <p className="text-gray-500 text-[11px] mt-0.5">{f.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white border border-gray-300 text-amber-900 font-mono font-bold rounded-full text-[11px]">
                      {f.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Access Settings Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
              Access Settings
            </h2>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <label className="flex items-center justify-between font-bold text-gray-900 cursor-pointer">
                <span>Storefront API Access</span>
                <input
                  type="checkbox"
                  checked={storefrontApiAccess}
                  onChange={(e) => setStorefrontApiAccess(e.target.checked)}
                  className="w-4 h-4 text-amber-800 rounded border-gray-300 cursor-pointer"
                />
              </label>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Allow storefront templates and mobile APIs to query entries of this metaobject publicly.
              </p>
            </div>
          </div>

          {/* Features Info Card */}
          <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 space-y-3 text-amber-950">
            <h3 className="font-bold text-sm text-amber-900">What are Metaobjects?</h3>
            <p className="text-xs leading-relaxed text-amber-900/90">
              Metaobjects allow you to create custom multi-field objects. Once saved, you can create entries for this definition and reference them from products, collections, or storefront pages.
            </p>
          </div>
        </div>
      </form>

      {/* Add Field Modal Drawer */}
      {addFieldOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Field to Metaobject</h3>
              <button onClick={() => setAddFieldOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddField} className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Field Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Care Instructions"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Data Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-900"
                >
                  <option value="Single line text">Single line text</option>
                  <option value="Multi-line text">Multi-line text</option>
                  <option value="Image (File)">Image (File)</option>
                  <option value="Color">Color</option>
                  <option value="Integer">Integer</option>
                  <option value="URL">URL</option>
                  <option value="Date">Date</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Instructions for content editors..."
                  value={newFieldDesc}
                  onChange={(e) => setNewFieldDesc(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req-field"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="w-4 h-4 text-amber-800 rounded border-gray-300"
                />
                <label htmlFor="req-field" className="font-bold text-gray-800 cursor-pointer">
                  Require this field when creating entries
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddFieldOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
