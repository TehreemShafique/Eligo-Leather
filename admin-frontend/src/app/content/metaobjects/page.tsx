"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Browsers, Plus, ArrowRight, CheckCircle, Pencil, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { apiFetch } from "@/lib/api"

interface MetaobjectDefinition {
  id: number
  name: string
  type_key: string
  handle: string | null
  status: string
  available_on_storefront: boolean
  publish_as_web_pages: boolean
}

interface MetaobjectEntry {
  id: number
  definition_id: number
  display_name: string
  handle: string | null
  status: string
  references_count: number
}

export default function AdminMetaobjectsPage() {
  const [definitions, setDefinitions] = useState<MetaobjectDefinition[]>([])
  const [entries, setEntries] = useState<MetaobjectEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [defs, ents] = await Promise.all([
        apiFetch<MetaobjectDefinition[]>("/api/v1/metaobject-definitions/"),
        apiFetch<MetaobjectEntry[]>("/api/v1/metaobject-entries/?limit=100"),
      ])
      setDefinitions(defs)
      setEntries(ents)
    } catch (err) {
      toast.error("Failed to load metaobject data")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDefinition = async (id: number, name: string) => {
    if (!window.confirm(`Delete definition "${name}"? Its entries will also be deleted.`)) return
    try {
      await apiFetch(`/api/v1/metaobject-definitions/${id}`, { method: "DELETE" })
      toast.success(`Definition "${name}" deleted`)
      fetchData()
    } catch (err) {
      toast.error("Failed to delete definition")
    }
  }

  const handleDeleteEntry = async (id: number, name: string) => {
    if (!window.confirm(`Delete entry "${name}"?`)) return
    try {
      await apiFetch(`/api/v1/metaobject-entries/${id}`, { method: "DELETE" })
      toast.success(`Entry "${name}" deleted`)
      fetchData()
    } catch (err) {
      toast.error("Failed to delete entry")
    }
  }

  const activeEntries = entries.filter(e => e.status === "active")
  const draftEntries = entries.filter(e => e.status === "draft")
  const storefrontEntries = entries.filter(e => {
    const def = definitions.find(d => d.id === e.definition_id)
    return def?.available_on_storefront
  })

  const recentEntries = entries
    .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading metaobjects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Metaobjects"
        icon={<Browsers className="w-5 h-5" />}
        actions={
          <Link
            href="/content/metaobjects/new"
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add definition</span>
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/content/metaobjects/entries?filter=storefront"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-amber-800 font-semibold uppercase group-hover:underline">
            Available on Storefront &rarr;
          </span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{storefrontEntries.length} entries</div>
          <span className="text-[11px] text-emerald-600 font-medium">Custom schemas & definitions</span>
        </Link>

        <Link
          href="/content/metaobjects/entries?filter=webpages"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-gray-500 font-semibold uppercase group-hover:underline">
            Web Pages &rarr;
          </span>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {definitions.filter(d => d.publish_as_web_pages).length} definitions
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Custom landing pages</span>
        </Link>

        <Link
          href="/content/metaobjects/entries?filter=active"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-gray-500 font-semibold uppercase group-hover:underline">
            Active Entries &rarr;
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{activeEntries.length} active</div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {entries.length > 0 ? Math.round((activeEntries.length / entries.length) * 100) : 0}% published
          </span>
        </Link>

        <Link
          href="/content/metaobjects/entries?filter=draft"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-800 transition-all group"
        >
          <span className="text-xs text-gray-500 font-semibold uppercase group-hover:underline">
            Draft Entries &rarr;
          </span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{draftEntries.length} drafts</div>
          <span className="text-[11px] text-gray-400 font-medium">
            {draftEntries.length === 0 ? "No pending drafts" : "Entries awaiting publish"}
          </span>
        </Link>
      </div>

      {/* Definitions Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Definitions ({definitions.length})</h2>
        </div>

        {definitions.length === 0 ? (
          <div className="p-12 text-center">
            <Browsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No definitions yet</p>
            <Link
              href="/content/metaobjects/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-800 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Create your first definition
            </Link>
          </div>
        ) : (
          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Name</th>
                  <th className="eligo-th">Type Key</th>
                  <th className="eligo-th">Status</th>
                  <th className="eligo-th">Storefront</th>
                  <th className="eligo-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {definitions.map((def) => (
                  <tr key={def.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{def.name}</td>
                    <td className="px-6 py-4 font-mono text-gray-600 text-xs">{def.type_key}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        def.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {def.status === "active" ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {def.available_on_storefront ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/content/metaobjects/entries?definition_id=${def.id}`}
                          className="text-xs font-bold text-amber-800 hover:underline"
                        >
                          View entries
                        </Link>
                        <Link
                          href={`/content/metaobjects/${def.id}`}
                          className="p-1.5 text-gray-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit definition"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteDefinition(def.id, def.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete definition"
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

      {/* Recent Entries Section */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Metaobject Entries</h2>
            <Link
              href="/content/metaobjects/entries"
              className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
            >
              <span>View all {entries.length} entries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Display Name</th>
                  <th className="eligo-th">Definition</th>
                  <th className="eligo-th">Status</th>
                  <th className="eligo-th text-right">References</th>
                  <th className="eligo-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEntries.map((entry) => {
                  const def = definitions.find(d => d.id === entry.definition_id)
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{entry.display_name}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{def?.name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          entry.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {entry.status === "active" ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {entry.references_count} references
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/content/metaobjects/entries/${entry.id}`}
                            className="p-1.5 text-gray-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit entry"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteEntry(entry.id, entry.display_name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete entry"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
