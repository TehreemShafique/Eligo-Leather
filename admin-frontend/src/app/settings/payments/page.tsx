"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard, Plus, PencilSimple, X, Check, Gift, CurrencyCircleDollar, WarningCircle } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsPaymentsPage() {
  // Modal visibility states
  const [editCodModalOpen, setEditCodModalOpen] = useState(false)
  const [addManualModalOpen, setAddManualModalOpen] = useState(false)
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false)
  const [captureMethodModalOpen, setCaptureMethodModalOpen] = useState(false)

  // Cash on Delivery Details
  const [codActive, setCodActive] = useState(true)
  const [codAdditionalDetails, setCodAdditionalDetails] = useState("Free Shipping On Above 2000/ Order. Pay cash upon delivery of package.")
  const [codPaymentInstructions, setCodPaymentInstructions] = useState("Please keep exact cash ready upon arrival of courier rider.")

  // New Custom Manual Payment Method State
  const [newMethodName, setNewMethodName] = useState("")
  const [newMethodDetails, setNewMethodDetails] = useState("")
  const [newMethodInstructions, setNewMethodInstructions] = useState("")

  // Gift Card Expiration State
  const [giftCardNeverExpire, setGiftCardNeverExpire] = useState(true)
  const [giftCardValidityYears, setGiftCardValidityYears] = useState(1)

  // Payment Capture Method State
  const [captureMethod, setCaptureMethod] = useState<"automatically_at_checkout" | "automatically_on_fulfillment" | "manual">("manual")

  const handleSaveCod = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Cash on Delivery (COD) settings saved successfully!")
    setEditCodModalOpen(false)
  }

  const handleDeactivateCod = () => {
    setCodActive(false)
    setEditCodModalOpen(false)
    toast.error("Cash on Delivery (COD) has been deactivated.")
  }

  const handleAddManualMethod = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMethodName) {
      toast.error("Please enter a payment method name.")
      return
    }
    toast.success(`Custom manual payment method "${newMethodName}" added!`)
    setAddManualModalOpen(false)
    setNewMethodName("")
    setNewMethodDetails("")
    setNewMethodInstructions("")
  }

  const handleSaveGiftCardSettings = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Gift card expiration parameters saved!")
    setGiftCardModalOpen(false)
  }

  const handleSaveCaptureMethod = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Payment capture method updated successfully!")
    setCaptureMethodModalOpen(false)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Payment Processing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Payments
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure Cash on Delivery (COD), custom offline payment methods, gift card expiration rules, and payment capture workflows.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* 1. Manual Payment Methods Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Manual Payment Methods</h2>
              <p className="text-xs text-gray-500">Payments made outside your online store. Orders paid manually must be approved before being fulfilled.</p>
            </div>

            <button
              onClick={() => setAddManualModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-900 inline-flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-amber-800" />
              <span>+ Manual payment method</span>
            </button>
          </div>

          {/* Cash on Delivery Row */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">Cash on Delivery (COD)</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    codActive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {codActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-gray-500 text-xs">{codAdditionalDetails}</p>
            </div>

            <button
              onClick={() => setEditCodModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-amber-800 hover:bg-gray-100 transition-colors shadow-2xs"
            >
              Edit
            </button>
          </div>
        </div>

        {/* 2. Gift Card Expiration Settings Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Gift Card Expiration Settings</h2>
              <p className="text-xs text-gray-500">Configure validity rules and expiry parameters for digital store credit vouchers.</p>
            </div>

            <button
              onClick={() => setGiftCardModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-900 shadow-2xs"
            >
              Configure Expiration
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-amber-800 shrink-0" />
              <div>
                <span className="font-bold text-gray-900 block">
                  {giftCardNeverExpire ? "Gift cards never expire" : `Gift cards expire in ${giftCardValidityYears} year(s)`}
                </span>
                <span className="text-gray-500 text-xs">Standard store credit voucher setting</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Payment Capture Method Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Payment Capture Method</h2>
              <p className="text-xs text-gray-500">Payments are authorized when an order is placed. Select how to capture payments.</p>
            </div>

            <button
              onClick={() => setCaptureMethodModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-900 shadow-2xs"
            >
              Change Capture Method
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CurrencyCircleDollar className="w-5 h-5 text-amber-800 shrink-0" />
              <div>
                <span className="font-bold text-gray-900 capitalize block">
                  {captureMethod.replace(/_/g, " ")}
                </span>
                <span className="text-gray-500 text-xs">
                  {captureMethod === "manual"
                    ? "Authorizes payment at checkout and leaves funds pending authorization until manually captured from order details."
                    : captureMethod === "automatically_at_checkout"
                    ? "Captures payment immediately when an order is placed."
                    : "Authorizes funds at checkout and captures payment when order is fulfilled."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* A. Edit Cash on Delivery Modal */}
      {editCodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Cash On Delivery (COD)</h3>
              <button onClick={() => setEditCodModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCod} className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Additional details</label>
                <textarea
                  rows={3}
                  value={codAdditionalDetails}
                  onChange={(e) => setCodAdditionalDetails(e.target.value)}
                  placeholder="e.g. Free Shipping On Above 2000/ Order"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 font-medium"
                />
                <p className="text-[11px] text-gray-500 mt-1">Displays notices to customers during checkout selection.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Payment instructions</label>
                <textarea
                  rows={3}
                  value={codPaymentInstructions}
                  onChange={(e) => setCodPaymentInstructions(e.target.value)}
                  placeholder="e.g. Please keep exact cash ready upon arrival of courier rider."
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 font-medium"
                />
                <p className="text-[11px] text-gray-500 mt-1">Shows follow-up guidelines to customers after order placement.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleDeactivateCod}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-center cursor-pointer"
                >
                  Deactivate Cash on Delivery (COD)
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setEditCodModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Add Custom Manual Payment Method Modal */}
      {addManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Manual Payment Method</h3>
              <button onClick={() => setAddManualModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualMethod} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Payment Method Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Direct Bank Transfer (Meezan Bank)"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Additional details</label>
                <textarea
                  rows={2}
                  value={newMethodDetails}
                  onChange={(e) => setNewMethodDetails(e.target.value)}
                  placeholder="Account Title, IBAN..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Payment instructions</label>
                <textarea
                  rows={2}
                  value={newMethodInstructions}
                  onChange={(e) => setNewMethodInstructions(e.target.value)}
                  placeholder="Send payment receipt screenshot to Whatsapp 0334-5399470"
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAddManualModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Gift Card Expiration Modal */}
      {giftCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Gift Card Expiration</h3>
              <button onClick={() => setGiftCardModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGiftCardSettings} className="space-y-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="giftCardExpiry"
                    checked={giftCardNeverExpire}
                    onChange={() => setGiftCardNeverExpire(true)}
                  />
                  <span className="font-bold text-gray-900">Gift cards never expire</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="giftCardExpiry"
                    checked={!giftCardNeverExpire}
                    onChange={() => setGiftCardNeverExpire(false)}
                  />
                  <span className="font-bold text-gray-900">Gift cards expire</span>
                </label>
              </div>

              {!giftCardNeverExpire && (
                <div className="pt-2 pl-6">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Validity (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={giftCardValidityYears}
                    onChange={(e) => setGiftCardValidityYears(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setGiftCardModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Payment Capture Method Modal */}
      {captureMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Payment Capture Method</h3>
              <button onClick={() => setCaptureMethodModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-500">Payments are authorized when an order is placed. Select how to capture payments.</p>

            <form onSubmit={handleSaveCaptureMethod} className="space-y-3">
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="radio"
                    name="captureMethod"
                    checked={captureMethod === "automatically_at_checkout"}
                    onChange={() => setCaptureMethod("automatically_at_checkout")}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block">Automatically at checkout</span>
                    <span className="text-[11px] text-gray-500">Captures payment immediately when an order is placed.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="radio"
                    name="captureMethod"
                    checked={captureMethod === "automatically_on_fulfillment"}
                    onChange={() => setCaptureMethod("automatically_on_fulfillment")}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block">Automatically when the entire order is fulfilled</span>
                    <span className="text-[11px] text-gray-500">Authorizes funds at checkout and captures payment when line items are shipped.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 bg-amber-50 rounded-xl border border-amber-200">
                  <input
                    type="radio"
                    name="captureMethod"
                    checked={captureMethod === "manual"}
                    onChange={() => setCaptureMethod("manual")}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-900 block">Manually</span>
                    <span className="text-[11px] text-amber-800">Authorizes payment at checkout and leaves funds pending authorization until manually captured from order details.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setCaptureMethodModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
