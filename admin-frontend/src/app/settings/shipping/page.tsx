"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Truck,
  Globe,
  MapPin,
  Package as PackageIcon,
  Printer,
  Plus,
  PencilSimple,
  Trash,
  Check,
  X,
  Sliders,
  ArrowsLeftRight,
  FileText,
  Sparkle,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsShippingPage() {
  const [activeTab, setActiveTab] = useState<"rates" | "routing" | "packaging">("rates")

  // TAB 1: Shipping Profiles, Zones & Rates
  const [domesticRate, setDomesticRate] = useState("250.00")
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("2000.00")
  const [internationalRate, setInternationalRate] = useState("5000.00")
  const [carrierLeopardsActive, setCarrierLeopardsActive] = useState(true)
  const [carrierTraxActive, setCarrierTraxActive] = useState(true)

  // TAB 2: Locations & Order Routing
  const [routingStrategy, setRoutingStrategy] = useState<"closest_to_customer" | "primary_stock_first">("primary_stock_first")
  const [allowSplitShipments, setAllowSplitShipments] = useState(true)

  // TAB 3: Packages, Sender Details & Packing Slips
  const [packages, setPackages] = useState([
    { id: 1, name: "Sample box (Store Default)", length: 22, width: 13.7, height: 4.2, weight: 0.0, isDefault: true },
    { id: 2, name: "Belt Box", length: 15, width: 15, height: 8, weight: 0.2, isDefault: false },
    { id: 3, name: "Wallet Box", length: 12, width: 10, height: 4, weight: 0.1, isDefault: false },
  ])
  const [addPackageModalOpen, setAddPackageModalOpen] = useState(false)
  const [newPkgName, setNewPkgName] = useState("")
  const [newPkgL, setNewPkgL] = useState(20)
  const [newPkgW, setNewPkgW] = useState(10)
  const [newPkgH, setNewPkgH] = useState(5)
  const [newPkgWt, setNewPkgWt] = useState(0.1)

  // Sender Return Details
  const [senderName, setSenderName] = useState("Eligo Leather Goods - Gulberg Warehouse")
  const [senderAddress, setSenderAddress] = useState("Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad")
  const [senderPhone, setSenderPhone] = useState("0334-5399470")

  // Packing Slip Template Modal State
  const [packingSlipModalOpen, setPackingSlipModalOpen] = useState(false)

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPkgName) {
      toast.error("Please enter a package name.")
      return
    }
    const newPkg = {
      id: Date.now(),
      name: newPkgName,
      length: newPkgL,
      width: newPkgW,
      height: newPkgH,
      weight: newPkgWt,
      isDefault: false,
    }
    setPackages([...packages, newPkg])
    setAddPackageModalOpen(false)
    setNewPkgName("")
    toast.success(`Package preset "${newPkgName}" added!`)
  }

  const handleDeletePackage = (id: number) => {
    setPackages(packages.filter((p) => p.id !== id))
    toast.info("Package preset removed.")
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header & Logistics Journey Control Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Logistics Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Shipping and delivery
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control order routing, delivery fee calculations, split shipping rules, predefined package presets, and printable packing slips.
          </p>
        </div>

        {/* 3 Core Administrative Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 text-xs font-bold">
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

      {/* TAB 1: Where do we ship & how much? (Profiles, Zones & Rates) */}
      {activeTab === "rates" && (
        <div className="space-y-6 text-xs">
          {/* General Shipping Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">General Shipping Profile</h2>
                <p className="text-xs text-gray-500">Applies rates to all products in your store catalog.</p>
              </div>

              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">
                All Products (General)
              </span>
            </div>

            {/* Domestic Zone (Pakistan) */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇵🇰</span>
                  <div>
                    <span className="font-bold text-gray-900 text-sm">Domestic Zone (Pakistan)</span>
                    <span className="text-gray-500 text-xs block">Punjab, Sindh, KPK, Balochistan, Islamabad</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Standard Flat Delivery Rate (PKR)</label>
                  <input
                    type="text"
                    value={domesticRate}
                    onChange={(e) => setDomesticRate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-gray-300 font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Free Shipping Threshold (PKR Order Total)</label>
                  <input
                    type="text"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-gray-300 font-bold text-amber-800"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Free shipping automatically unlocked for orders above Rs {freeShippingThreshold}.</p>
                </div>
              </div>
            </div>

            {/* International Zone */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-800 shrink-0" />
                <div>
                  <span className="font-bold text-gray-900 text-sm">International Zone (Rest of World)</span>
                  <span className="text-gray-500 text-xs block">United States, United Kingdom, UAE, International</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">International Shipping Rate (PKR)</label>
                <input
                  type="text"
                  value={internationalRate}
                  onChange={(e) => setInternationalRate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-gray-300 font-bold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Carrier Integrations Card (Leopards / Sonic-Trax) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Carrier API Integrations</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-amber-800 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Leopards Courier</span>
                    <span className="text-gray-500 text-xs">Live API rates &amp; waybill generation</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={carrierLeopardsActive}
                  onChange={(e) => setCarrierLeopardsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-800 rounded border-gray-300"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-amber-800 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 block">Sonic - Trax</span>
                    <span className="text-gray-500 text-xs">Live tracking &amp; courier dispatch</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={carrierTraxActive}
                  onChange={(e) => setCarrierTraxActive(e.target.checked)}
                  className="w-4 h-4 text-amber-800 rounded border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Where do items ship from? (Locations & Order Routing) */}
      {activeTab === "routing" && (
        <div className="space-y-6 text-xs">
          {/* Fulfillment Locations Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Registered Fulfillment Locations</h2>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-amber-800 shrink-0" />
                <div>
                  <span className="font-bold text-gray-900 text-sm block">Eligo Primary Warehouse (Islamabad)</span>
                  <span className="text-gray-600 text-xs block">Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad</span>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                Primary Stock Location
              </span>
            </div>
          </div>

          {/* Order Routing Rules */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Order Routing Strategy</h2>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="radio"
                  name="routingStrat"
                  checked={routingStrategy === "primary_stock_first"}
                  onChange={() => setRoutingStrategy("primary_stock_first")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Fulfill from primary stock location first (Recommended)</span>
                  <span className="text-[11px] text-gray-500">Decrements inventory matrix from the primary Islamabad warehouse.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="radio"
                  name="routingStrat"
                  checked={routingStrategy === "closest_to_customer"}
                  onChange={() => setRoutingStrategy("closest_to_customer")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Route orders to location closest to customer</span>
                  <span className="text-[11px] text-gray-500">Calculates customer proximity across regional warehouses.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Split Shipping Toggles */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Multi-Item Split Shipping Rules</h2>
                <p className="text-xs text-gray-500">Controls whether multi-item orders are split into multiple tracking packages or consolidated into a single box.</p>
              </div>

              <input
                type="checkbox"
                checked={allowSplitShipments}
                onChange={(e) => {
                  setAllowSplitShipments(e.target.checked)
                  toast.success(e.target.checked ? "Split shipping enabled!" : "Split shipping disabled.")
                }}
                className="w-5 h-5 text-amber-800 rounded border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: How is it packed and labeled? (Packages, Sender Details & Packing Slips) */}
      {activeTab === "packaging" && (
        <div className="space-y-6 text-xs">
          {/* Predefined Package Presets */}
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

            <div className="space-y-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span>{pkg.name}</span>
                      {pkg.isDefault && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">Store Default</span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">
                      Dimensions: {pkg.length} &times; {pkg.width} &times; {pkg.height} cm &bull; Empty weight: {pkg.weight} kg
                    </span>
                  </div>

                  {!pkg.isDefault && (
                    <button onClick={() => handleDeletePackage(pkg.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sender Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Sender Return Details on Waybills</h2>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Sender Merchant Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Return Address</label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Sender Phone</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
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
                <p className="text-xs text-gray-500">Generates receipt templates listing SKU codes, variant attributes (e.g. Dark Brown / 34), and quantities.</p>
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

      {/* A. Add Package Preset Modal */}
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

      {/* B. Printable Packing Slip Template Modal */}
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
                  <p className="text-[11px] text-gray-600">Gulberg Empire, Islamabad</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs">PACKING SLIP</span>
                  <p className="text-[11px] text-gray-600">Order #1001</p>
                </div>
              </div>

              <div className="text-[11px] space-y-1">
                <span className="font-bold block">Ship To:</span>
                <p>Sajid Watto</p>
                <p>Street 14, Main Boulevard, Gulberg III, Lahore, 54000, Pakistan</p>
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
                    <td className="py-1 font-bold">ESSENCE - Premium Leather Belt (Dark Brown / 34)</td>
                    <td className="py-1">SKU-EL-BELT-01</td>
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
    </div>
  )
}
