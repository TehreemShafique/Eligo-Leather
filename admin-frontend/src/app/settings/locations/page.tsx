"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Plus, MagnifyingGlass, House, X, Check, CaretDown, DotsThreeOutline } from "@phosphor-icons/react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { useFormDirty } from "@/components/unsaved-changes"

export default function AdminSettingsLocationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all")
  const [addLocationModalOpen, setAddLocationModalOpen] = useState(false)
  const [changeDefaultModalOpen, setChangeDefaultModalOpen] = useState(false)

  // Location State List
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: "Eligo Primary Warehouse (Islamabad)",
      address: "Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens",
      apartment: "Office 407",
      city: "Islamabad",
      postalCode: "44000",
      country: "Pakistan",
      phone: "0334-5399470",
      status: "Active",
      isDefault: true,
      fulfillOnlineOrders: true,
      allowLocalPickup: true,
    },
  ])

  // Form inputs for Add Location
  const [locName, setLocName] = useState("")
  const [locStreet, setLocStreet] = useState("")
  const [locApartment, setLocApartment] = useState("")
  const [locCity, setLocCity] = useState("Lahore")
  const [locPostal, setLocPostal] = useState("54000")
  const [locCountry, setLocCountry] = useState("Pakistan")
  const [locPhone, setLocPhone] = useState("+92 300 1234567")
  const [locFulfillOnline, setLocFulfillOnline] = useState(true)
  const [locLocalPickup, setLocLocalPickup] = useState(false)

  const { reset } = useFormDirty({
    locName,
    locStreet,
    locApartment,
    locCity,
    locPostal,
    locCountry,
    locPhone,
    locFulfillOnline,
    locLocalPickup,
  })

  const defaultLocation = locations.find((l) => l.isDefault) || locations[0]

  const filteredLocations = activeTab === "all"
    ? locations
    : locations.filter((l) => l.status.toLowerCase() === activeTab)

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!locName || !locStreet) {
      toast.error("Please fill in location name and street address.")
      return
    }

    const newLoc = {
      id: Date.now(),
      name: locName,
      address: locStreet,
      apartment: locApartment,
      city: locCity,
      postalCode: locPostal,
      country: locCountry,
      phone: locPhone,
      status: "Active",
      isDefault: false,
      fulfillOnlineOrders: locFulfillOnline,
      allowLocalPickup: locLocalPickup,
    }

    setLocations([...locations, newLoc])
    setAddLocationModalOpen(false)
    setLocName("")
    setLocStreet("")
    toast.success(`Fulfillment location "${locName}" added successfully!`)
    reset()
  }

  const handleSetDefault = (id: number) => {
    setLocations(
      locations.map((l) => ({
        ...l,
        isDefault: l.id === id,
      }))
    )
    setChangeDefaultModalOpen(false)
    toast.success("Primary default fulfillment location updated!")
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Locations"
        icon={<MapPin className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setAddLocationModalOpen(true)}
            className="eligo-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add location</span>
          </button>
        }
      />

      <div className="space-y-6 text-xs">
        {/* 1. Default Location Settings Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Default Location Settings</h2>
              <p className="text-xs text-gray-500">This location is used by the system and apps when no other location is specified.</p>
            </div>

            <button
              onClick={() => setChangeDefaultModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 font-bold text-amber-800 rounded-xl shadow-2xs transition-colors"
            >
              Change
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-amber-800 shrink-0" />
              <div>
                <span className="font-bold text-gray-900 text-sm block">{defaultLocation.name}</span>
                <span className="text-gray-600 text-xs block">{defaultLocation.address}, {defaultLocation.city}, {defaultLocation.country}</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">
              System Default
            </span>
          </div>
        </div>

        {/* 2. Locations Index Dashboard Table with Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  activeTab === "all" ? "bg-white text-gray-900 shadow-2xs border border-gray-200" : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                All ({locations.length})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  activeTab === "active" ? "bg-white text-gray-900 shadow-2xs border border-gray-200" : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                Active ({locations.filter((l) => l.status === "Active").length})
              </button>
              <button
                onClick={() => setActiveTab("inactive")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  activeTab === "inactive" ? "bg-white text-gray-900 shadow-2xs border border-gray-200" : "text-gray-600 hover:bg-gray-200/50"
                }`}
              >
                Inactive ({locations.filter((l) => l.status === "Inactive").length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search locations by name or city..."
                className="w-full h-9 pl-9 pr-4 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Location Name &amp; Address</th>
                  <th className="eligo-th">Online Fulfillment</th>
                  <th className="eligo-th">Local Pickup</th>
                  <th className="eligo-th text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-amber-800 text-xs flex items-center gap-2">
                        <span>{loc.name}</span>
                        {loc.isDefault && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px]">Default</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 block mt-0.5">{loc.address}, {loc.city}, {loc.country}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {loc.fulfillOnlineOrders ? "Enabled" : "Disabled"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {loc.allowLocalPickup ? "Enabled" : "Disabled"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* A. Add Location Modal */}
      {addLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Location</h3>
              <button onClick={() => setAddLocationModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gulberg Warehouse"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Country/region</label>
                <select value={locCountry} onChange={(e) => setLocCountry(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                  <option value="Pakistan">Pakistan</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Boulevard, Gulberg III"
                  value={locStreet}
                  onChange={(e) => setLocStreet(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Apartment, suite</label>
                  <input type="text" placeholder="Suite 2B" value={locApartment} onChange={(e) => setLocApartment(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">City</label>
                  <input type="text" value={locCity} onChange={(e) => setLocCity(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Postal Code</label>
                  <input type="text" value={locPostal} onChange={(e) => setLocPostal(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Phone Number</label>
                  <input type="text" value={locPhone} onChange={(e) => setLocPhone(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={locFulfillOnline}
                    onChange={(e) => setLocFulfillOnline(e.target.checked)}
                    className="rounded border-gray-300 text-amber-800"
                  />
                  <span>Fulfill online orders from this location</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={locLocalPickup}
                    onChange={(e) => setLocLocalPickup(e.target.checked)}
                    className="rounded border-gray-300 text-amber-800"
                  />
                  <span>Enable local pickup at this location</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAddLocationModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Change Default Location Modal */}
      {changeDefaultModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Change Default Location</h3>
              <button onClick={() => setChangeDefaultModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-500">Select which facility serves as the fallback node for inventory deduction and shipping calculations.</p>

            <div className="space-y-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSetDefault(loc.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    loc.isDefault ? "bg-amber-50 border-amber-800 text-amber-900 font-bold" : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <div>
                    <span className="font-bold block">{loc.name}</span>
                    <span className="text-[11px] text-gray-500">{loc.city}, {loc.country}</span>
                  </div>
                  {loc.isDefault && <Check className="w-4 h-4 text-amber-800" />}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button onClick={() => setChangeDefaultModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
