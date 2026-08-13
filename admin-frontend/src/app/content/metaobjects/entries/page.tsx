"use client"

import { useState } from "react"
import Link from "next/link"
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
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"

export default function AdminMetaobjectEntriesPage() {
  const [selectedDefinition, setSelectedDefinition] = useState("All definitions")
  const [definitionDropdownOpen, setDefinitionDropdownOpen] = useState(false)
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false)
  const [definitionSearch, setDefinitionSearch] = useState("")

  // Toggleable columns state
  const [columns, setColumns] = useState({
    definitionName: true,
    updated: true,
    status: true,
    references: true,
    addedBy: false,
    created: false,
    handle: false,
  })

  const definitionsList = [
    "All definitions",
    "Target gender",
    "Bag/Case material",
    "Accessory size",
    "Clothing accessory material",
    "Color",
  ]

  const filteredDefinitions = definitionsList.filter((d) =>
    d.toLowerCase().includes(definitionSearch.toLowerCase())
  )

  const entries = [
    {
      id: 1,
      displayName: "Maroon Tan Leather",
      definitionName: "Color",
      updated: "Feb 8, 2026",
      status: "Active",
      references: 14,
      addedBy: "Bilal Hussain Abbasi",
      created: "Jan 10, 2026",
      handle: "maroon-tan-leather",
    },
    {
      id: 2,
      displayName: "Unisex Everyday Carry",
      definitionName: "Target gender",
      updated: "Feb 6, 2026",
      status: "Active",
      references: 8,
      addedBy: "Bilal Hussain Abbasi",
      created: "Jan 12, 2026",
      handle: "unisex-everyday-carry",
    },
    {
      id: 3,
      displayName: "Full Grain Cowhide",
      definitionName: "Bag/Case material",
      updated: "Feb 4, 2026",
      status: "Active",
      references: 22,
      addedBy: "System Admin",
      created: "Dec 15, 2025",
      handle: "full-grain-cowhide",
    },
    {
      id: 4,
      displayName: "Slim Pocket Size",
      definitionName: "Accessory size",
      updated: "Feb 2, 2026",
      status: "Active",
      references: 19,
      addedBy: "Bilal Hussain Abbasi",
      created: "Jan 20, 2026",
      handle: "slim-pocket-size",
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Metaobject Entries"
        icon={<Sliders className="w-5 h-5" />}
        actions={
          <button
            onClick={() => toast.success("Add new entry drawer opened!")}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add entry</span>
          </button>
        }
      />

      {/* Filter Dropdowns Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Definition Filtering Dropdown */}
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
              placeholder="Search entries..."
              className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Columns Customization Dropdown */}
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
        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Display Name</th>
                {columns.definitionName && <th className="eligo-th">Definition Name</th>}
                {columns.updated && <th className="eligo-th">Updated</th>}
                {columns.status && <th className="eligo-th">Status</th>}
                {columns.references && <th className="eligo-th">References</th>}
                {columns.addedBy && <th className="eligo-th">Added By</th>}
                {columns.handle && <th className="eligo-th">Handle</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-amber-800 hover:underline">{entry.displayName}</td>
                  {columns.definitionName && <td className="px-6 py-4 font-semibold text-gray-900">{entry.definitionName}</td>}
                  {columns.updated && <td className="px-6 py-4 text-gray-500">{entry.updated}</td>}
                  {columns.status && (
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {entry.status}
                      </span>
                    </td>
                  )}
                  {columns.references && (
                    <td className="px-6 py-4 font-bold text-gray-900">{entry.references} references</td>
                  )}
                  {columns.addedBy && <td className="px-6 py-4 text-gray-600">{entry.addedBy}</td>}
                  {columns.handle && <td className="px-6 py-4 font-mono text-gray-500">{entry.handle}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
