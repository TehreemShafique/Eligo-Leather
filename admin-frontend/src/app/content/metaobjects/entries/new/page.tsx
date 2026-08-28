"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretLeft,
  Browsers,
  Plus,
  Trash,
  Check,
  CaretDown,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

interface MetaobjectField {
  id: number
  label: string
  field_type: string
  cardinality: string
  required: boolean
  is_display_name: boolean
  position: number
}

interface MetaobjectDefinition {
  id: number
  name: string
  type_key: string
  fields: MetaobjectField[]
}

interface FieldValue {
  field_id: number
  value: string
}

export default function CreateMetaobjectEntryPage() {
  const router = useRouter()
  const [definitions, setDefinitions] = useState<MetaobjectDefinition[]>([])
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<number | null>(null)
  const [selectedDefinition, setSelectedDefinition] = useState<MetaobjectDefinition | null>(null)
  const [definitionDropdownOpen, setDefinitionDropdownOpen] = useState(false)
  const [definitionSearch, setDefinitionSearch] = useState("")

  const [displayName, setDisplayName] = useState("")
  const [handle, setHandle] = useState("")
  const [status, setStatus] = useState<"active" | "draft">("active")
  const [tags, setTags] = useState("")
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDefinitions()
  }, [])

  useEffect(() => {
    if (selectedDefinition) {
      const displayField = selectedDefinition.fields.find(f => f.is_display_name)
      if (displayField && fieldValues[displayField.id]) {
        const generated = fieldValues[displayField.id]
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
        setHandle(generated)
      }
    }
  }, [fieldValues, selectedDefinition])

  async function fetchDefinitions() {
    try {
      const defs = await apiFetch<MetaobjectDefinition[]>("/api/v1/metaobject-definitions/")
      setDefinitions(defs)
    } catch (err) {
      toast.error("Failed to load definitions")
    }
  }

  const filteredDefinitions = definitions.filter(d =>
    d.name.toLowerCase().includes(definitionSearch.toLowerCase())
  )

  const handleSelectDefinition = (def: MetaobjectDefinition) => {
    setSelectedDefinitionId(def.id)
    setSelectedDefinition(def)
    setDefinitionDropdownOpen(false)
    setFieldValues({})
  }

  const handleFieldValueChange = (fieldId: number, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDefinitionId) {
      toast.error("Please select a definition")
      return
    }

    if (!displayName.trim()) {
      toast.error("Please enter a display name")
      return
    }

    const def = definitions.find(d => d.id === selectedDefinitionId)
    if (!def) return

    const requiredFields = def.fields.filter(f => f.required)
    for (const field of requiredFields) {
      if (!fieldValues[field.id]?.trim()) {
        toast.error(`Please fill in the required field: ${field.label}`)
        return
      }
    }

    setSaving(true)

    const payload = {
      definition_id: selectedDefinitionId,
      display_name: displayName.trim(),
      handle: handle || undefined,
      status: status,
      tags: tags || null,
      field_values: def.fields.map(field => ({
        field_id: field.id,
        value: fieldValues[field.id] || null,
      })),
    }

    try {
      const res = await apiFetch("/api/v1/metaobject-entries/", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      toast.success(`Entry "${displayName}" created successfully!`)
      router.push("/content/metaobjects/entries")
    } catch (err) {
      toast.error("Failed to create entry")
    } finally {
      setSaving(false)
    }
  }

  const renderFieldInput = (field: MetaobjectField) => {
    const value = fieldValues[field.id] || ""

    switch (field.field_type) {
      case "Multi-line text":
      case "Rich text":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            rows={4}
            className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
          />
        )

      case "Integer":
      case "Decimal":
      case "Money":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            step={field.field_type === "Integer" ? "1" : "0.01"}
            className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
          />
        )

      case "True or false":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleFieldValueChange(field.id, value === "true" ? "false" : "true")}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                value === "true" ? "bg-black" : "bg-gray-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                value === "true" ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
            <span className="text-xs text-gray-600">{value === "true" ? "Yes" : "No"}</span>
          </div>
        )

      case "Date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
          />
        )

      case "Date and time":
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
          />
        )

      case "URL":
      case "Link":
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder="https://example.com"
            className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
          />
        )

      case "Email (Single line text)":
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder="email@example.com"
            className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
          />
        )

      case "Color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
              placeholder="#000000"
              className="flex-1 h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400 font-mono"
            />
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
          />
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-gray-900 pb-20">
      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <Link href="/content/metaobjects/entries" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
          <CaretLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <span className="text-gray-400">›</span>
        <h1 className="text-lg font-bold text-gray-900">Add entry</h1>
      </div>

      <form onSubmit={handleSaveEntry} className="space-y-6 text-xs">
        {/* Definition Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 text-xs block">Definition</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDefinitionDropdownOpen(!definitionDropdownOpen)}
                className="w-full h-11 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm flex items-center justify-between focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 cursor-pointer"
              >
                <span className={selectedDefinition ? "text-gray-900" : "text-gray-400"}>
                  {selectedDefinition?.name || "Select a definition"}
                </span>
                <CaretDown className="w-4 h-4 text-gray-500" />
              </button>

              {definitionDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-2">
                  <div className="p-1">
                    <input
                      type="text"
                      value={definitionSearch}
                      onChange={(e) => setDefinitionSearch(e.target.value)}
                      placeholder="Search definitions..."
                      className="w-full h-8 px-3 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-hidden"
                    />
                  </div>
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {filteredDefinitions.map((def) => (
                      <button
                        key={def.id}
                        type="button"
                        onClick={() => handleSelectDefinition(def)}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-800 transition-colors flex items-center justify-between ${
                          selectedDefinitionId === def.id ? "text-amber-800 font-bold bg-amber-50/60" : "text-gray-700"
                        }`}
                      >
                        <div>
                          <span className="block">{def.name}</span>
                          <span className="text-[10px] text-gray-400">{def.fields.length} fields</span>
                        </div>
                        {selectedDefinitionId === def.id && <Check className="w-3.5 h-3.5 text-amber-800" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Entry Details */}
        {selectedDefinition && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 text-xs block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter entry display name"
                  className="w-full h-11 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                <span>Handle: <span className="font-mono text-gray-600">{handle || "—"}</span></span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 text-xs block">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags (optional)"
                  className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Dynamic Fields */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Fields</h2>

              <div className="space-y-4">
                {selectedDefinition.fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="font-bold text-gray-900 text-xs block">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      {field.is_display_name && (
                        <span className="ml-2 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">Display Name</span>
                      )}
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            </div>

            {/* Status & Options */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Status</h2>

              <div className="flex items-center justify-between py-1">
                <span className="font-bold text-gray-800">Active</span>
                <button
                  type="button"
                  onClick={() => setStatus(status === "active" ? "draft" : "active")}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    status === "active" ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                    status === "active" ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom Save Action Button */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <Link
            href="/content/metaobjects/entries"
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !selectedDefinitionId}
            className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}
