"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { CaretLeft, Browsers } from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { useFormDirty } from "@/components/unsaved-changes"

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

interface MetaobjectEntryValue {
  id: number
  field_id: number
  value: string | null
  reference_id: number | null
  reference_type: string | null
}

interface MetaobjectEntry {
  id: number
  definition_id: number
  display_name: string
  code: string | null
  handle: string | null
  status: string
  tags: string | null
  added_by: string | null
  references_count: number
  field_values: MetaobjectEntryValue[]
  created_at: string
  updated_at: string | null
}

export default function EditMetaobjectEntryPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [definition, setDefinition] = useState<MetaobjectDefinition | null>(null)
  const [entry, setEntry] = useState<MetaobjectEntry | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [code, setCode] = useState("")
  const [handle, setHandle] = useState("")
  const [status, setStatus] = useState<"active" | "draft">("active")
  const [tags, setTags] = useState("")
  const [fieldValues, setFieldValues] = useState<Record<number, { value: string; reference_id: number | null; reference_type: string | null }>>({})
  const [saving, setSaving] = useState(false)

  const { reset, isDirty } = useFormDirty({
    displayName,
    code,
    status,
    tags,
    fieldValues: JSON.stringify(fieldValues),
  })

  useEffect(() => {
    Promise.all([
      apiFetch<MetaobjectEntry>(`/api/v1/metaobject-entries/${id}`),
      apiFetch<MetaobjectDefinition[]>("/api/v1/metaobject-definitions/"),
    ])
      .then(([ent, defs]) => {
        setEntry(ent)
        setDisplayName(ent.display_name)
        setCode(ent.code ?? "")
        setHandle(ent.handle ?? "")
        setStatus(ent.status === "draft" ? "draft" : "active")
        setTags(ent.tags ?? "")
        setDefinition(defs.find(d => d.id === ent.definition_id) ?? null)
        const values: Record<number, { value: string; reference_id: number | null; reference_type: string | null }> = {}
        ent.field_values.forEach(v => {
          values[v.field_id] = { value: v.value ?? "", reference_id: v.reference_id, reference_type: v.reference_type }
        })
        setFieldValues(values)
      })
      .catch(() => toast.error("Failed to load entry"))
      .finally(() => setLoading(false))
  }, [id])

  const handleFieldValueChange = (fieldId: number, value: string) => {
    setFieldValues(prev => {
      const existing = prev[fieldId]
      return {
        ...prev,
        [fieldId]: { value, reference_id: existing?.reference_id ?? null, reference_type: existing?.reference_type ?? null },
      }
    })
  }

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      toast.error("Please enter a display name")
      return
    }

    setSaving(true)

    const payload = {
      display_name: displayName.trim(),
      code: code.trim() || null,
      handle: handle || null,
      status: status,
      tags: tags || null,
      field_values: definition
        ? definition.fields.map(field => {
            const v = fieldValues[field.id]
            return {
              field_id: field.id,
              value: v?.value || null,
              reference_id: v?.reference_id ?? null,
              reference_type: v?.reference_type ?? null,
            }
          })
        : [],
    }

    try {
      await apiFetch(`/api/v1/metaobject-entries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })

      toast.success(`Entry "${displayName}" updated successfully!`)
      reset()
      router.push("/content/metaobjects/entries")
    } catch (err) {
      toast.error("Failed to update entry")
    } finally {
      setSaving(false)
    }
  }

  const renderFieldInput = (field: MetaobjectField) => {
    const value = fieldValues[field.id]?.value ?? ""

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
              className="flex-1 h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-mono text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400"
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading entry...</div>
      </div>
    )
  }

  if (!entry || !definition) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Entry not found.</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-gray-900 pb-20">
      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <Link href="/content/metaobjects/entries" className="p-1 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
          <CaretLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <Browsers className="w-5 h-5 text-gray-700" />
        <span className="text-gray-400">›</span>
        <h1 className="text-lg font-bold text-gray-900">Edit entry</h1>
      </div>

      <form onSubmit={handleSaveEntry} className="space-y-6 text-xs">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <label className="font-bold text-gray-900 text-xs block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter entry display name"
                className="w-full h-11 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 transition-all placeholder:text-gray-400"
              />
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg shrink-0">
              {definition.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-900 text-xs block">
                Code <span className="font-normal text-gray-400">(SKU token)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="E.g. RED"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl font-mono font-bold text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 placeholder:text-gray-400 placeholder:font-sans placeholder:font-normal"
              />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Used in product variant SKUs (e.g. <span className="font-mono">004-RED</span>). Changing the display name
                never alters variant SKUs because they reference this code.
              </p>
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
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Handle: <span className="font-mono">{handle || "—"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Fields</h2>

          <div className="space-y-4">
            {definition.fields.map((field) => (
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

        <div className="flex items-center justify-end gap-2 pt-4">
          <Link
            href="/content/metaobjects/entries"
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}