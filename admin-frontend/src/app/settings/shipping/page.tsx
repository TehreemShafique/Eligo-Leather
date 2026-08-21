"use client"

import { useState, useEffect, useCallback } from "react"
import { Truck, Globe, MapPin, Package as PackageIcon, Printer, Plus, Trash, X, Calculator } from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { apiFetch } from "@/lib/api"

const API_BASE = "/api/v1/settings/shipping-and-delivery"

interface Carrier {
  id: string
  name: string
  code: string
  is_active: boolean
}

interface ShippingRate {
  id: string
  name: string
  rate_amount: string
  min_order_amount?: string
  is_free: boolean
}

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  rates: ShippingRate[]
}

interface ShippingProfile {
  id: string
  name: string
  description: string
  is_active: boolean
  zones?: ShippingZone[]
}

interface ShippingSettings {
  routing_strategy: "primary_stock_first" | "closest_to_customer"
  allow_split_shipments: boolean
  sender_name: string
  sender_address: string
  sender_phone: string
}

interface PackageRecord {
  id: string
  name: string
  length_cm: number
  width_cm: number
  height_cm: number
  weight_kg: number
  is_default: boolean
}

export default function AdminSettingsShippingPage() {
  const [activeTab, setActiveTab] = useState<"rates" | "routing" | "packaging">("rates")

  const [settings, setSettings] = useState<ShippingSettings | null>(null)
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [profiles, setProfiles] = useState<ShippingProfile[]>([])
  const [packages, setPackages] = useState<PackageRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [routingSaving, setRoutingSaving] = useState(false)

  const [addPackageModalOpen, setAddPackageModalOpen] = useState(false)
  const [newPkgName, setNewPkgName] = useState("")
  const [newPkgL, setNewPkgL] = useState(20)
  const [newPkgW, setNewPkgW] = useState(10)
  const [newPkgH, setNewPkgH] = useState(5)
  const [newPkgWt, setNewPkgWt] = useState(0.1)

  const [packingSlipModalOpen, setPackingSlipModalOpen] = useState(false)

  const [calcModalOpen, setCalcModalOpen] = useState(false)
  const [calcSubtotal, setCalcSubtotal] = useState(1500)
  const [calcWeight, setCalcWeight] = useState(0.5)
  const [calcCountry, setCalcCountry] = useState("PK")
  const [calcResults, setCalcResults] = useState<Array<{ rate_id: number; title: string; profile_name: string; zone_name: string; amount: number; rate_type: string; is_free: boolean }>>([])
  const [calcLoading, setCalcLoading] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiFetch<ShippingSettings>(`${API_BASE}/settings`)
      setSettings(data)
    } catch (err) {
      toast.error("Could not load shipping settings.")
      console.error(err)
    }
  }, [])

  const fetchCarriers = useCallback(async () => {
    try {
      const data = await apiFetch<Carrier[]>(`${API_BASE}/carriers`)
      setCarriers(data)
    } catch (err) {
      toast.error("Could not load carriers.")
      console.error(err)
    }
  }, [])

  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const list = await apiFetch<ShippingProfile[]>(`${API_BASE}/profiles`)

      const detailed = await Promise.all(
        list.map(async (p) => {
          try {
            return await apiFetch<ShippingProfile>(`${API_BASE}/profiles/${p.id}`)
          } catch {
            return p
          }
        })
      )
      setProfiles(detailed)
    } catch (err) {
      toast.error("Could not load shipping profiles.")
      console.error(err)
    } finally {
      setProfilesLoading(false)
    }
  }, [])

  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true)
    try {
      const data = await apiFetch<PackageRecord[]>(`${API_BASE}/packages`)
      setPackages(data)
    } catch (err) {
      toast.error("Could not load packages.")
      console.error(err)
    } finally {
      setPackagesLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSettings(), fetchCarriers(), fetchProfiles(), fetchPackages()]).finally(() =>
      setLoading(false)
    )
  }, [fetchSettings, fetchCarriers, fetchProfiles, fetchPackages])

  useEffect(() => {
    if (activeTab === "rates") {
      fetchProfiles()
      fetchCarriers()
    } else if (activeTab === "packaging") {
      fetchPackages()
    }
  }, [activeTab, fetchProfiles, fetchCarriers, fetchPackages])

  const saveRouting = async (patch: Partial<ShippingSettings>) => {
    if (!settings) return
    setRoutingSaving(true)
    try {
      const updated = await apiFetch<ShippingSettings>(`${API_BASE}/settings`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      })
      setSettings(updated)
      toast.success("Shipping settings updated.")
    } catch (err) {
      toast.error("Could not save routing settings.")
      console.error(err)
    } finally {
      setRoutingSaving(false)
    }
  }

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPkgName) {
      toast.error("Please enter a package name.")
      return
    }
    try {
      await apiFetch(`${API_BASE}/packages`, {
        method: "POST",
        body: JSON.stringify({
          name: newPkgName,
          length_cm: newPkgL,
          width_cm: newPkgW,
          height_cm: newPkgH,
          weight_kg: newPkgWt,
        }),
      })
      toast.success(`Package preset "${newPkgName}" added!`)
      setAddPackageModalOpen(false)
      setNewPkgName("")
      setNewPkgL(20)
      setNewPkgW(10)
      setNewPkgH(5)
      setNewPkgWt(0.1)
      fetchPackages()
    } catch (err) {
      toast.error("Could not add package.")
      console.error(err)
    }
  }

  const handleDeletePackage = async (id: string) => {
    try {
      await apiFetch(`${API_BASE}/packages/${id}`, { method: "DELETE" })
      toast.info("Package preset removed.")
      setPackages((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      toast.error("Could not delete package.")
      console.error(err)
    }
  }

  const handleCalculateRates = async () => {
    setCalcLoading(true)
    try {
      const data = await apiFetch<Array<{ rate_id: number; title: string; profile_name: string; zone_name: string; amount: number; rate_type: string; is_free: boolean }>>("/api/v1/shipping/calculate-rates", {
        method: "POST",
        body: JSON.stringify({ subtotal: calcSubtotal, weight_kg: calcWeight, country: calcCountry }),
      })
      setCalcResults(data)
    } catch (err) {
      toast.error("Could not calculate rates.")
      console.error(err)
    } finally {
      setCalcLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <PageHeader title="Shipping and delivery" icon={<Truck className="w-5 h-5" />} />
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-center py-16">
          <span className="text-xs text-gray-500 font-semibold">Loading shipping settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader
        title="Shipping and delivery"
        icon={<Truck className="w-5 h-5" />}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex border-b border-gray-200 gap-6 text-xs font-bold px-6">
          <button
            onClick={() => setActiveTab("rates")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "rates"
                ? "border-amber-800 text-amber-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Shipping Profiles &amp; Rates</span>
          </button>

          <button
            onClick={() => setActiveTab("routing")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "routing"
                ? "border-amber-800 text-amber-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. Locations &amp; Order Routing</span>
          </button>

          <button
            onClick={() => setActiveTab("packaging")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "packaging"
                ? "border-amber-800 text-amber-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <PackageIcon className="w-4 h-4" />
            <span>3. Packages &amp; Packing Slips</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Shipping Profiles & Rates */}
      {activeTab === "rates" && (
        <div className="space-y-6 text-xs">
          {profilesLoading ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-center py-12">
              <span className="text-xs text-gray-500 font-semibold">Loading shipping profiles...</span>
            </div>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{profile.name}</h2>
                    {profile.description && (
                      <p className="text-xs text-gray-500">{profile.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 font-bold rounded-full text-xs ${
                      profile.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {profile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {profile.zones && profile.zones.length > 0 ? (
                  profile.zones.map((zone) => (
                    <div key={zone.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-900 text-sm">{zone.name}</span>
                          {zone.countries && zone.countries.length > 0 && (
                            <span className="text-gray-500 text-xs block">
                              {zone.countries.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {zone.rates && zone.rates.length > 0 ? (
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          {zone.rates.map((rate) => (
                            <div key={rate.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                              <div>
                                <span className="font-semibold text-gray-900">{rate.name}</span>
                                {rate.min_order_amount && (
                                  <span className="text-gray-500 text-xs block">
                                    Min order: Rs {rate.min_order_amount}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-gray-900">
                                {rate.is_free ? (
                                  <span className="text-emerald-700">Free</span>
                                ) : (
                                  `Rs ${rate.rate_amount}`
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">No rates configured for this zone.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-gray-400 italic">No shipping zones configured for this profile.</p>
                )}
              </div>
            ))
          )}

          {profiles.length === 0 && !profilesLoading && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs text-center py-12">
              <p className="text-xs text-gray-500">No shipping profiles found.</p>
            </div>
          )}

          {/* Carrier Integrations Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Carrier API Integrations</h2>

            {carriers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {carriers.map((carrier) => (
                  <div key={carrier.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-6 h-6 text-amber-800 shrink-0" />
                      <div>
                        <span className="font-bold text-gray-900 block">{carrier.name}</span>
                        <span className="text-gray-500 text-xs uppercase">{carrier.code}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 font-bold rounded-full text-xs ${
                        carrier.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {carrier.is_active ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">No carriers configured.</p>
            )}
          </div>

          {/* Rate Calculator Tool */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Rate Calculator</h2>
                <p className="text-xs text-gray-500">Test how shipping rates are calculated for different cart amounts and destinations.</p>
              </div>
              <button
                onClick={() => setCalcModalOpen(true)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculate Rates</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Routing */}
      {activeTab === "routing" && (
        <div className="space-y-6 text-xs">
          {/* Fulfillment Locations link */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Registered Fulfillment Locations</h2>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-800 shrink-0" />
              <p className="text-xs text-gray-700">
                Manage your warehouse and fulfillment locations under{" "}
                <a href="/settings/locations" className="font-bold text-amber-800 underline underline-offset-2">
                  Settings &gt; Locations
                </a>
                .
              </p>
            </div>
          </div>

          {/* Order Routing Strategy */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Order Routing Strategy</h2>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="radio"
                  name="routingStrat"
                  checked={settings?.routing_strategy === "primary_stock_first"}
                  onChange={() => settings && saveRouting({ routing_strategy: "primary_stock_first" })}
                  disabled={routingSaving}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Fulfill from primary stock location first (Recommended)</span>
                  <span className="text-[11px] text-gray-500">Decrements inventory from the primary warehouse first.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="radio"
                  name="routingStrat"
                  checked={settings?.routing_strategy === "closest_to_customer"}
                  onChange={() => settings && saveRouting({ routing_strategy: "closest_to_customer" })}
                  disabled={routingSaving}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Route orders to location closest to customer</span>
                  <span className="text-[11px] text-gray-500">Calculates customer proximity across regional warehouses.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Split Shipping */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Multi-Item Split Shipping Rules</h2>
                <p className="text-xs text-gray-500">
                  Controls whether multi-item orders are split into multiple tracking packages or consolidated into a single box.
                </p>
              </div>

              <input
                type="checkbox"
                checked={settings?.allow_split_shipments ?? false}
                onChange={(e) => settings && saveRouting({ allow_split_shipments: e.target.checked })}
                disabled={routingSaving}
                className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Packages, Sender Details & Packing Slips */}
      {activeTab === "packaging" && (
        <div className="space-y-6 text-xs">
          {/* Package Presets */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Saved Package Presets</h2>
                <p className="text-xs text-gray-500">Predefined container dimensions used for volumetric weight calculations.</p>
              </div>

              <button
                onClick={() => setAddPackageModalOpen(true)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add package</span>
              </button>
            </div>

            {packagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-gray-500 font-semibold">Loading packages...</span>
              </div>
            ) : packages.length > 0 ? (
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span>{pkg.name}</span>
                        {pkg.is_default && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">Store Default</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs">
                        Dimensions: {pkg.length_cm} &times; {pkg.width_cm} &times; {pkg.height_cm} cm &bull; Empty weight: {pkg.weight_kg} kg
                      </span>
                    </div>

                    {!pkg.is_default && (
                      <button onClick={() => handleDeletePackage(pkg.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400 italic">No packages configured yet.</p>
              </div>
            )}
          </div>

          {/* Sender Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Sender Return Details on Waybills</h2>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Sender Merchant Name</label>
                <input
                  type="text"
                  value={settings?.sender_name ?? ""}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, sender_name: e.target.value } : prev))}
                  onBlur={() => settings && saveRouting({ sender_name: settings.sender_name })}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Return Address</label>
                  <input
                    type="text"
                    value={settings?.sender_address ?? ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, sender_address: e.target.value } : prev))}
                    onBlur={() => settings && saveRouting({ sender_address: settings.sender_address })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Sender Phone</label>
                  <input
                    type="text"
                    value={settings?.sender_phone ?? ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, sender_phone: e.target.value } : prev))}
                    onBlur={() => settings && saveRouting({ sender_phone: settings.sender_phone })}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Packing Slip Template Preview */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Printable Packing Slip Template</h2>
                <p className="text-xs text-gray-500">Generates receipt templates listing SKU codes, variant attributes, and quantities.</p>
              </div>

              <button
                onClick={() => setPackingSlipModalOpen(true)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Preview &amp; Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Preset Modal */}
      {addPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Package Preset</h3>
              <button onClick={() => setAddPackageModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jacket Box"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Length (cm)</label>
                  <input type="number" step="0.1" value={newPkgL} onChange={(e) => setNewPkgL(parseFloat(e.target.value) || 0)} className="w-full h-9 px-2 rounded-lg bg-gray-50 border border-gray-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Width (cm)</label>
                  <input type="number" step="0.1" value={newPkgW} onChange={(e) => setNewPkgW(parseFloat(e.target.value) || 0)} className="w-full h-9 px-2 rounded-lg bg-gray-50 border border-gray-300 font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Height (cm)</label>
                  <input type="number" step="0.1" value={newPkgH} onChange={(e) => setNewPkgH(parseFloat(e.target.value) || 0)} className="w-full h-9 px-2 rounded-lg bg-gray-50 border border-gray-300 font-mono" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Empty Weight (kg)</label>
                <input type="number" step="0.01" value={newPkgWt} onChange={(e) => setNewPkgWt(parseFloat(e.target.value) || 0)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAddPackageModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">Save Package</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Template Modal */}
      {packingSlipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Packing Slip Preview</h3>
              <button onClick={() => setPackingSlipModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Document Box */}
            <div className="p-6 bg-white border border-gray-300 rounded-xl shadow-xs space-y-4 font-mono text-gray-900">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h4 className="font-bold text-sm">ELIGO LEATHER</h4>
                  <p className="text-[11px] text-gray-600">{settings?.sender_name}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs">PACKING SLIP</span>
                  <p className="text-[11px] text-gray-600">Order #1001</p>
                </div>
              </div>

              <div className="text-[11px] space-y-1">
                <span className="font-bold block">Ship To:</span>
                <p>Customer Name</p>
                <p>Customer Address</p>
              </div>

              <table className="w-full text-left text-[11px] border-t border-b py-2">
                <thead>
                  <tr className="border-b">
                    <th className="py-1">Items</th>
                    <th className="py-1">SKU</th>
                    <th className="py-1 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 font-bold">Example Product (Variant)</td>
                    <td className="py-1">SKU-001</td>
                    <td className="py-1 text-right font-bold">1</td>
                  </tr>
                </tbody>
              </table>

              <p className="text-[10px] text-gray-500 italic text-center">Thank you for shopping with Eligo Leather!</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setPackingSlipModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                Close
              </button>
              <button onClick={() => { toast.success("Packing slip sent to printer!"); setPackingSlipModalOpen(false); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer inline-flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Calculator Modal */}
      {calcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Shipping Rate Calculator</h3>
              <button onClick={() => setCalcModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Cart Subtotal (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={calcSubtotal}
                    onChange={(e) => setCalcSubtotal(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Destination Country</label>
                <select
                  value={calcCountry}
                  onChange={(e) => setCalcCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                >
                  <option value="PK">Pakistan</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="IN">India</option>
                </select>
              </div>

              <button
                onClick={handleCalculateRates}
                disabled={calcLoading}
                className="w-full py-2.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {calcLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                {calcLoading ? "Calculating..." : "Calculate Rates"}
              </button>
            </div>

            {/* Results */}
            {calcResults.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <h4 className="font-bold text-gray-900">Applicable Rates</h4>
                {calcResults.map((rate) => (
                  <div key={rate.rate_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <span className="font-bold text-gray-900 block">{rate.title}</span>
                      <span className="text-gray-500 text-[11px]">{rate.profile_name} &bull; {rate.zone_name}</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {rate.is_free ? (
                        <span className="text-emerald-700">Free</span>
                      ) : (
                        `Rs ${rate.amount.toFixed(2)}`
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {calcResults.length === 0 && !calcLoading && (
              <div className="pt-3 border-t border-gray-100 text-center text-gray-400 text-xs">
                No rates match this destination. Click Calculate to test.
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button onClick={() => setCalcModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
