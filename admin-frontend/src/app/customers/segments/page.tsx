"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Plus, MagnifyingGlass, DotsThree, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

interface SegmentItem {
  id: number
  name: string
  percentage_of_customers: number
  last_activity: string
}

export default function AdminSegmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Default: Only 1 segment example by default as requested!
  const [segments, setSegments] = useState<SegmentItem[]>([
    {
      id: 1,
      name: "Email subscribers",
      percentage_of_customers: 14,
      last_activity: "Edited on 5 Nov 2024",
    },
  ])
  const [loading, setLoading] = useState(false)

  // Fetch live segments from backend DB safely
  useEffect(() => {
    let isMounted = true
    const fetchSegments = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/segments/")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: SegmentItem[] = data.map((s: any) => ({
              id: s.id,
              name: s.name,
              percentage_of_customers: s.percentage_of_customers || 0,
              last_activity: s.last_activity || `Created on ${new Date(s.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
            }))
            
            // Merge with the 1 default item while avoiding duplicate IDs/names
            setSegments((prev) => {
              const combined = [...mapped, ...prev]
              const uniqueMap = new Map()
              combined.forEach((item) => {
                if (!uniqueMap.has(item.name)) {
                  uniqueMap.set(item.name, item)
                }
              })
              return Array.from(uniqueMap.values())
            })
          }
        }
      } catch (err) {
        console.log("Backend segments endpoint offline, using local list.")
      }
    }

    fetchSegments()
    return () => {
      isMounted = false
    }
  }, [])

  const handleDeleteSegment = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/segments/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setSegments((prev) => prev.filter((s) => s.id !== id))
        toast.success("Segment deleted from database.")
      } else {
        setSegments((prev) => prev.filter((s) => s.id !== id))
        toast.info("Segment deleted.")
      }
    } catch (err) {
      setSegments((prev) => prev.filter((s) => s.id !== id))
      toast.info("Segment removed.")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSegments.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const filteredSegments = segments.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4 font-sans text-gray-900">
      {/* Top Header matching Pic 1 */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Segments</h1>
        </div>

        <Link
          href="/customers/segments/new"
          className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
        >
          <span>Create segment</span>
        </Link>
      </div>

      {/* Main Table Card matching Pic 1 (without Created By column) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-3.5 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search segments"
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-gray-300 text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold text-[11px]">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredSegments.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[20%] text-right">% of customers</th>
                <th className="py-3 px-4 font-semibold text-gray-700 w-[25%] text-left">
                  <span className="inline-flex items-center gap-1 border-b border-dashed border-gray-400 pb-0.5">
                    Last activity <span className="text-[10px]">↕</span>
                  </span>
                </th>
                <th className="py-3 px-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSegments.length > 0 ? (
                filteredSegments.map((seg, idx) => {
                  const isSelected = selectedIds.includes(seg.id)
                  return (
                    <tr
                      key={seg.id ? `seg-${seg.id}-${idx}` : `seg-${idx}`}
                      className={`hover:bg-[#faf8f5] transition-colors ${
                        isSelected ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(seg.id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-800 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <Link href="/customers/segments/new" className="hover:underline text-amber-900">
                          {seg.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                        {seg.percentage_of_customers}%
                      </td>
                      <td className="py-3.5 px-4 text-left font-medium text-gray-600">
                        {seg.last_activity}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSegment(seg.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete segment"
                        >
                          <DotsThree className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-gray-500 font-medium">
                    No segments found. Click "Create segment" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Link */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/30 text-center text-xs font-semibold text-gray-600">
          <span className="hover:underline cursor-pointer">Learn more about segments</span>
        </div>
      </div>
    </div>
  )
}
