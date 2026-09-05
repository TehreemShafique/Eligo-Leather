"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MagnifyingGlass,
  Funnel,
  Eye,
  EyeSlash,
  CaretDown,
  Plus,
  Sliders,
  Check,
  CheckCircle,
  Pencil,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { apiFetch } from "@/lib/api"

interface MetaobjectField {
  id: number
  label: string
  field_type: string
  cardinality: string
  is_display_name: boolean
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
}

interface MetaobjectEntry {
  id: number
  definition_id: number
  display_name: string
  code: string | null
  handle: string | null
  status: string
  references_count: number
  added_by: string | null
  field_values: MetaobjectEntryValue[]
  created_at: string
  updated_at: string | null
}

export default function AdminMetaobjectEntriesPage() {
  const router = useRouter()
  const [definitions, setDefinitions] = useState<MetaobjectDefinition[]>([])
  const [entries, setEntries] = useState<MetaobjectEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedDefinition, setSelectedDefinition] = useState("All definitions")
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<number | null>(null)
  const [definitionDropdownOpen, setDefinitionDropdownOpen] = useState(false)
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false)
  const [definitionSearch, setDefinitionSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [columns, setColumns] = useState({
    definitionName: true,
    code: true,
    updated: true,
    status: true,
    references: true,
    addedBy: false,
    created: false,
    handle: false,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const defId = params.get("definition_id")
    if (defId) {
      setSelectedDefinitionId(Number(defId))
      const def = definitions.find(d => d.id === Number(defId))
      if (def) setSelectedDefinition(def.name)
    }

    const filter = params.get("filter")
    if (filter === "active") {
      // Filter active entries
    } else if (filter === "draft") {
      // Filter draft entries
    }
  }, [definitions])

  async function fetchData() {
    try {
      const [defs, ents] = await Promise.all([
        apiFetch<MetaobjectDefinition[]>("/api/v1/metaobject-definitions/"),
        apiFetch<MetaobjectEntry[]>("/api/v1/metaobject-entries/?limit=100"),
      ])
      setDefinitions(defs)
      setEntries(ents)
    } catch (err) {
      toast.error("Failed to load entries data")
    } finally {
      setLoading(false)
    }
  }

  const filteredDefinitions = ["All definitions", ...definitions.map(d => d.name)].filter(d =>
    d.toLowerCase().includes(definitionSearch.toLowerCase())
  )

  const filteredEntries = entries.filter(entry => {
    if (selectedDefinitionId && entry.definition_id !== selectedDefinitionId) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return entry.display_name.toLowerCase().includes(query) ||
             entry.code?.toLowerCase().includes(query) ||
             entry.handle?.toLowerCase().includes(query)
    }
    return true
  })

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      await apiFetch(`/api/v1/metaobject-entries/${entryId}`, { method: "DELETE" })
      setEntries(entries.filter(e => e.id !== entryId))
      toast.success("Entry deleted successfully")
    } catch (err) {
      toast.error("Failed to delete entry")
    }
  }

  const getDefinitionName = (defId: number) => {
    return definitions.find(d => d.id === defId)?.name || "—"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading entries...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Metaobject Entries"
        icon={<Sliders className="w-5 h-5" />}
        actions={
          <Link
            href={`/content/metaobjects/entries/new${selectedDefinitionId ? `?definition_id=${selectedDefinitionId}` : ""}`}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add entry</span>
          </Link>
        }
      />

      {/* Filter Dropdowns Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <button
              onClick={() => setDefinitionDropdownOpen(!definitionDropdownOpen)}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 inline-flex items-center gap-2 cursor-pointer"
            >
              <Funnel className="w-4 h-4 text-amber-800" />
              <span>{selectedDefinition}</span>
              <CaretDown className="w-3.5 h-3.5 text-gray-500 ml-1" />
            </button>

            {definitionDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-2">
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
                      key={def}
                      onClick={() => {
                        setSelectedDefinition(def)
                        if (def === "All definitions") {
                          setSelectedDefinitionId(null)
                        } else {
                          const found = definitions.find(d => d.name === def)
                          setSelectedDefinitionId(found?.id || null)
                        }
                        setDefinitionDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-800 transition-colors flex items-center justify-between ${
                        selectedDefinition === def ? "text-amber-800 font-bold bg-amber-50/60" : "text-gray-700"
                      }`}
                    >
                      <span>{def}</span>
                      {selectedDefinition === def && <Check className="w-3.5 h-3.5 text-amber-800" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setColumnsDropdownOpen(!columnsDropdownOpen)}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 inline-flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-gray-500" />
            <span>Customize Columns</span>
          </button>

          {columnsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3 space-y-2 text-xs">
              <span className="font-bold text-gray-900 uppercase tracking-wide text-[10px] block border-b border-gray-100 pb-1">
                Toggle Column Visibility
              </span>
              <div className="space-y-1">
                {Object.entries(columns).map(([colKey, isVisible]) => (
                  <label key={colKey} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <span className="capitalize font-semibold text-gray-700">{colKey.replace(/([A-Z])/g, " $1")}</span>
                    <button
                      type="button"
                      onClick={() => setColumns({ ...columns, [colKey]: !isVisible })}
                      className="p-1 text-gray-500 hover:text-amber-800"
                    >
                      {isVisible ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeSlash className="w-4 h-4 text-gray-400" />}
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Entries Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Sliders className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No entries found</p>
            <Link
              href="/content/metaobjects/entries/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-800 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Create your first entry
            </Link>
          </div>
        ) : (
          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
<tr>
                    <th className="eligo-th">Display Name</th>
                    {columns.code && <th className="eligo-th">Code</th>}
                    {columns.definitionName && <th className="eligo-th">Definition Name</th>}
                    {columns.updated && <th className="eligo-th">Updated</th>}
                    {columns.status && <th className="eligo-th">Status</th>}
                    {columns.references && <th className="eligo-th">References</th>}
                    {columns.addedBy && <th className="eligo-th">Added By</th>}
                    {columns.handle && <th className="eligo-th">Handle</th>}
                    <th className="eligo-th text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
<td className="px-6 py-4 font-bold text-amber-800 hover:underline">
                        <Link href={`/content/metaobjects/entries/${entry.id}`}>
                          {entry.display_name}
                        </Link>
                      </td>
                      {columns.code && (
                        <td className="px-6 py-4">
                          <span className="font-mono text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded">
                            {entry.code || "—"}
                          </span>
                        </td>
                      )}
                      {columns.definitionName && (
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {getDefinitionName(entry.definition_id)}
                      </td>
                    )}
                    {columns.updated && (
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : "—"}
                      </td>
                    )}
                    {columns.status && (
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          entry.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {entry.status === "active" ? "Active" : "Draft"}
                        </span>
                      </td>
                    )}
                    {columns.references && (
                      <td className="px-6 py-4 font-bold text-gray-900">{entry.references_count} references</td>
                    )}
                    {columns.addedBy && <td className="px-6 py-4 text-gray-600">{entry.added_by || "—"}</td>}
                    {columns.handle && <td className="px-6 py-4 font-mono text-gray-500">{entry.handle || "—"}</td>}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/content/metaobjects/entries/${entry.id}`}
                          className="p-1.5 text-gray-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
