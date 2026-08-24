"use client"

import { API_BASE } from "@/lib/api"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { CreditCard, Plus, PencilSimple, X, Check, Gift, CurrencyCircleDollar, WarningCircle } from "@phosphor-icons/react"
import { PageHeader } from "@/components/layout/page-header"

const PAYMENT_API = `${API_BASE}/api/v1/settings/payment`

interface PaymentMethod {
  id: string
  name: string
  additional_details: string
  payment_instructions: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PaymentSettings {
  id: string
  gift_cards_expire: boolean
  gift_card_validity_years: number
  payment_capture_method: "automatically_at_checkout" | "automatically_on_fulfillment" | "manual"
  updated_at: string
}

export default function AdminSettingsPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [settings, setSettings] = useState<PaymentSettings | null>(null)

  const [editCodModalOpen, setEditCodModalOpen] = useState(false)
  const [addManualModalOpen, setAddManualModalOpen] = useState(false)
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false)
  const [captureMethodModalOpen, setCaptureMethodModalOpen] = useState(false)

  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [editDetails, setEditDetails] = useState("")
  const [editInstructions, setEditInstructions] = useState("")

  const [newMethodName, setNewMethodName] = useState("")
  const [newMethodDetails, setNewMethodDetails] = useState("")
  const [newMethodInstructions, setNewMethodInstructions] = useState("")

  const [giftCardNeverExpire, setGiftCardNeverExpire] = useState(true)
  const [giftCardValidityYears, setGiftCardValidityYears] = useState(1)

  const [captureMethod, setCaptureMethod] = useState<"automatically_at_checkout" | "automatically_on_fulfillment" | "manual">("manual")

  const [savingMethod, setSavingMethod] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [methodsRes, settingsRes] = await Promise.all([
        fetch(`${PAYMENT_API}/methods`),
        fetch(`${PAYMENT_API}/settings`),
      ])

      if (!methodsRes.ok) throw new Error("Failed to fetch payment methods")
      if (!settingsRes.ok) throw new Error("Failed to fetch payment settings")

      const methodsData = await methodsRes.json()
      const settingsData = await settingsRes.json()

      setPaymentMethods(methodsData)
      setSettings(settingsData)
      setGiftCardNeverExpire(!settingsData.gift_cards_expire)
      setGiftCardValidityYears(settingsData.gift_card_validity_years)
      setCaptureMethod(settingsData.payment_capture_method)
    } catch (err) {
      toast.error("Failed to load payment settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddManualMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMethodName.trim()) {
      toast.error("Please enter a payment method name.")
      return
    }
    setSavingMethod(true)
    try {
      const res = await fetch(`${PAYMENT_API}/methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMethodName.trim(),
          additional_details: newMethodDetails.trim() || undefined,
          payment_instructions: newMethodInstructions.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to create payment method")
      const created = await res.json()
      setPaymentMethods((prev) => [...prev, created])
      toast.success(`Payment method "${created.name}" added successfully!`)
      setAddManualModalOpen(false)
      setNewMethodName("")
      setNewMethodDetails("")
      setNewMethodInstructions("")
    } catch (err) {
      toast.error("Failed to add payment method. Please try again.")
    } finally {
      setSavingMethod(false)
    }
  }

  const handleDeactivateCod = () => {
    setPaymentMethods((prev) =>
      prev.map((m) =>
        m.name.toLowerCase().includes("cash on delivery") || m.name.toLowerCase() === "cod"
          ? { ...m, is_active: false }
          : m
      )
    )
    setEditCodModalOpen(false)
    toast.error("Cash on Delivery (COD) has been deactivated locally.")
  }

  const handleSaveGiftCardSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch(`${PAYMENT_API}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift_cards_expire: !giftCardNeverExpire,
          gift_card_validity_years: giftCardValidityYears,
        }),
      })
      if (!res.ok) throw new Error("Failed to update gift card settings")
      const updated = await res.json()
      setSettings(updated)
      toast.success("Gift card expiration settings saved!")
      setGiftCardModalOpen(false)
    } catch (err) {
      toast.error("Failed to save gift card settings. Please try again.")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveCaptureMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch(`${PAYMENT_API}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_capture_method: captureMethod }),
      })
      if (!res.ok) throw new Error("Failed to update capture method")
      const updated = await res.json()
      setSettings(updated)
      toast.success("Payment capture method updated successfully!")
      setCaptureMethodModalOpen(false)
    } catch (err) {
      toast.error("Failed to save capture method. Please try again.")
    } finally {
      setSavingSettings(false)
    }
  }

  const openEditCodModal = (method: PaymentMethod) => {
    setEditingMethod(method)
    setEditDetails(method.additional_details || "")
    setEditInstructions(method.payment_instructions || "")
    setEditCodModalOpen(true)
  }

  const codMethod = paymentMethods.find(
    (m) => m.name.toLowerCase().includes("cash on delivery") || m.name.toLowerCase() === "cod"
  )

  if (loading) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <PageHeader title="Payments" icon={<CreditCard className="w-5 h-5" />} />
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading payment settings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader title="Payments" icon={<CreditCard className="w-5 h-5" />} />

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

          {paymentMethods.length === 0 ? (
            <div className="p-8 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
              <WarningCircle className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="font-bold text-gray-700 text-sm">No payment methods found</p>
              <p className="text-gray-500 text-xs">Add a manual payment method to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{method.name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          method.is_active ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {method.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {method.additional_details && (
                      <p className="text-gray-500 text-xs">{method.additional_details}</p>
                    )}
                  </div>

                  <button
                    onClick={() => openEditCodModal(method)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-amber-800 hover:bg-gray-100 transition-colors shadow-2xs"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
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
                  {settings?.gift_cards_expire === false
                    ? "Gift cards never expire"
                    : `Gift cards expire in ${settings?.gift_card_validity_years ?? 1} year(s)`}
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
                  {settings?.payment_capture_method?.replace(/_/g, " ") ?? "Manual"}
                </span>
                <span className="text-gray-500 text-xs">
                  {settings?.payment_capture_method === "manual"
                    ? "Authorizes payment at checkout and leaves funds pending authorization until manually captured from order details."
                    : settings?.payment_capture_method === "automatically_at_checkout"
                    ? "Captures payment immediately when an order is placed."
                    : "Authorizes funds at checkout and captures payment when order is fulfilled."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* A. Edit Payment Method Modal */}
      {editCodModalOpen && editingMethod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit {editingMethod.name}</h3>
              <button onClick={() => setEditCodModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success(`Payment method "${editingMethod.name}" updated locally.`)
                setEditCodModalOpen(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Additional details</label>
                <textarea
                  rows={3}
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  placeholder="e.g. Free Shipping On Above 2000/ Order"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 font-medium"
                />
                <p className="text-[11px] text-gray-500 mt-1">Displays notices to customers during checkout selection.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Payment instructions</label>
                <textarea
                  rows={3}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
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
                  Deactivate {editingMethod.name}
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
                <button
                  type="submit"
                  disabled={savingMethod}
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingMethod ? "Saving..." : "Save Method"}
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
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSettings ? "Saving..." : "Save"}
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
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold hover:bg-amber-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSettings ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
