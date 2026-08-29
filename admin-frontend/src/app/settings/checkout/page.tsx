"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ShoppingBagOpen,
  DotsThreeOutline,
  PencilSimple,
  Copy,
  X,
  Sliders,
  ShieldCheck,
  Info,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { apiFetch } from "@/lib/api"
import { useFormDirty } from "@/components/unsaved-changes"

const API_PATH = "/api/v1/settings/checkout"

interface CheckoutConfig {
  id: string
  name: string
  is_active: boolean
  contact_method: string
  show_order_tracking_link: boolean
  require_login: boolean
  full_name_field: string
  company_name_field: string
  address_line2_field: string
  shipping_phone_field: string
  marketing_email_optin: string
  marketing_sms_optin: string
  show_tipping: boolean
  checkout_language: string
  billing_address_rule: string
  validate_shipping_address: boolean
  use_shipping_as_billing_default: boolean
  enable_cart_limit: boolean
  cart_item_limit: number
  checkout_rules: Record<string, unknown>
  created_at: string
  updated_at: string
}

export default function AdminSettingsCheckoutPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configId, setConfigId] = useState<string | null>(null)
  const [configName, setConfigName] = useState("My Store configuration")
  const [createdAt, setCreatedAt] = useState("")
  const [updatedAt, setUpdatedAt] = useState("")

  const [actionDropdownOpen, setActionDropdownOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [tempConfigName, setTempConfigName] = useState(configName)

  const [contactMethod, setContactMethod] = useState<"phone_or_email" | "email">("phone_or_email")
  const [showOrderTrackingLink, setShowOrderTrackingLink] = useState(false)
  const [requireLogin, setRequireLogin] = useState(false)

  const [fullNameField, setFullNameField] = useState("required")
  const [companyNameField, setCompanyNameField] = useState("don_t_include")
  const [addressLine2Field, setAddressLine2Field] = useState("optional")
  const [shippingPhoneField, setShippingPhoneField] = useState("required")

  const [emailOptin, setEmailOptin] = useState("checkout_and_signin")
  const [smsOptin, setSmsOptin] = useState("don_t_show")
  const [showTipping, setShowTipping] = useState(false)
  const [checkoutLanguage, setCheckoutLanguage] = useState("English")

  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [billingRule, setBillingRule] = useState<"allow_different" | "require_match">("allow_different")
  const [validateShippingAddress, setValidateShippingAddress] = useState(false)
  const [useShippingAsBillingDefault, setUseShippingAsBillingDefault] = useState(true)

  const [cartLimitModalOpen, setCartLimitModalOpen] = useState(false)
  const [enableCartLimit, setEnableCartLimit] = useState(true)
  const [cartItemLimit, setCartItemLimit] = useState(50)

  const [dataLoaded, setDataLoaded] = useState(false)

  const { reset } = useFormDirty(
    {
      configName,
      contactMethod,
      showOrderTrackingLink,
      requireLogin,
      fullNameField,
      companyNameField,
      addressLine2Field,
      shippingPhoneField,
      emailOptin,
      smsOptin,
      showTipping,
      checkoutLanguage,
      billingRule,
      validateShippingAddress,
      useShippingAsBillingDefault,
      enableCartLimit,
      cartItemLimit,
    },
    dataLoaded
  )

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<CheckoutConfig>(`${API_PATH}/configs/active`)

      setConfigId(data.id)
      setConfigName(data.name)
      setCreatedAt(data.created_at)
      setUpdatedAt(data.updated_at)
      setContactMethod(data.contact_method as "phone_or_email" | "email")
      setShowOrderTrackingLink(data.show_order_tracking_link)
      setRequireLogin(data.require_login)
      setFullNameField(data.full_name_field)
      setCompanyNameField(data.company_name_field)
      setAddressLine2Field(data.address_line2_field)
      setShippingPhoneField(data.shipping_phone_field)
      setEmailOptin(data.marketing_email_optin)
      setSmsOptin(data.marketing_sms_optin)
      setShowTipping(data.show_tipping)
      setCheckoutLanguage(data.checkout_language)
      setBillingRule(data.billing_address_rule as "allow_different" | "require_match")
      setValidateShippingAddress(data.validate_shipping_address)
      setUseShippingAsBillingDefault(data.use_shipping_as_billing_default)
      setEnableCartLimit(data.enable_cart_limit)
      setCartItemLimit(data.cart_item_limit)
      setDataLoaded(true)
    } catch {
      toast.error("Failed to load checkout configuration")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    if (!configId) return
    try {
      setSaving(true)
      await apiFetch(`${API_PATH}/configs/${configId}`, {
        method: "PATCH",
        body: JSON.stringify({
          contact_method: contactMethod,
          show_order_tracking_link: showOrderTrackingLink,
          require_login: requireLogin,
          full_name_field: fullNameField,
          company_name_field: companyNameField,
          address_line2_field: addressLine2Field,
          shipping_phone_field: shippingPhoneField,
          marketing_email_optin: emailOptin,
          marketing_sms_optin: smsOptin,
          show_tipping: showTipping,
          checkout_language: checkoutLanguage,
          billing_address_rule: billingRule,
          validate_shipping_address: validateShippingAddress,
          use_shipping_as_billing_default: useShippingAsBillingDefault,
          enable_cart_limit: enableCartLimit,
          cart_item_limit: cartItemLimit,
        }),
      })
      toast.success("Checkout configuration saved!")
      reset()
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configId) return
    try {
      await apiFetch(`${API_PATH}/configs/${configId}/rename`, {
        method: "POST",
        body: JSON.stringify({ name: tempConfigName }),
      })
      setConfigName(tempConfigName)
      setRenameModalOpen(false)
      toast.success(`Configuration renamed to "${tempConfigName}"`)
      reset()
    } catch {
      toast.error("Failed to rename configuration")
    }
  }

  const handleDuplicateConfig = async () => {
    if (!configId) return
    try {
      const data = await apiFetch<CheckoutConfig>(`${API_PATH}/configs/${configId}/duplicate`, { method: "POST" })
      toast.success(`Configuration duplicated as "${data.name}"`)
      setActionDropdownOpen(false)
      fetchConfig()
    } catch {
      toast.error("Failed to duplicate configuration")
    }
  }

  const formatDate = (iso: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto">
        <PageHeader title="Checkout" icon={<ShoppingBagOpen className="w-5 h-5" />} />
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">Loading checkout configuration...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      <PageHeader title="Checkout" icon={<ShoppingBagOpen className="w-5 h-5" />} />

      <div className="space-y-6 text-xs">
        {/* 1. Configurations Management Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Checkout Configurations</h2>
              <p className="text-xs text-gray-500">Manage active storefront checkout configuration sets.</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{configName}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-gray-500 text-xs">
                {updatedAt ? `Updated ${formatDate(updatedAt)}` : createdAt ? `Created ${formatDate(createdAt)}` : ""} &bull; Default store rules
              </p>
            </div>

            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button
                  onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                  className="p-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-gray-800 font-bold cursor-pointer"
                >
                  <DotsThreeOutline className="w-4 h-4" />
                </button>

                {actionDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-1 font-semibold text-gray-700">
                    <button
                      onClick={() => {
                        setTempConfigName(configName)
                        setRenameModalOpen(true)
                        setActionDropdownOpen(false)
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <PencilSimple className="w-3.5 h-3.5 text-gray-500" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={handleDuplicateConfig}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>Duplicate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Customer Contact Method & Form Fields */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Customer Contact Method &amp; Form Fields</h2>

          <div className="space-y-3">
            <span className="font-bold text-gray-900 uppercase tracking-wide block">Contact Method</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="radio"
                  name="contactMethod"
                  checked={contactMethod === "phone_or_email"}
                  onChange={() => setContactMethod("phone_or_email")}
                />
                <span className="font-bold text-gray-900">Phone number or email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="radio"
                  name="contactMethod"
                  checked={contactMethod === "email"}
                  onChange={() => setContactMethod("email")}
                />
                <span className="font-bold text-gray-900">Email</span>
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOrderTrackingLink}
                  onChange={(e) => setShowOrderTrackingLink(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span className="font-semibold text-gray-800">Show a link for customers to track their order with Shop</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireLogin}
                  onChange={(e) => setRequireLogin(e.target.checked)}
                  className="rounded border-gray-300 text-amber-800"
                />
                <span className="font-semibold text-gray-800">Require customers to sign in to their account before checkout</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Full name</label>
              <select value={fullNameField} onChange={(e) => setFullNameField(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                <option value="required">Require first and last name</option>
                <option value="optional">Require last name only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Company name</label>
              <select value={companyNameField} onChange={(e) => setCompanyNameField(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                <option value="don_t_include">Don&apos;t include</option>
                <option value="optional">Optional</option>
                <option value="required">Required</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Address line 2</label>
              <select value={addressLine2Field} onChange={(e) => setAddressLine2Field(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                <option value="optional">Optional</option>
                <option value="don_t_include">Don&apos;t include</option>
                <option value="required">Required</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Shipping phone</label>
              <select value={shippingPhoneField} onChange={(e) => setShippingPhoneField(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900">
                <option value="required">Required</option>
                <option value="optional">Optional</option>
                <option value="don_t_include">Don&apos;t include</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Marketing Opt-In & Tipping */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Marketing Opt-In &amp; Tipping</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Email Marketing Opt-in</label>
              <select value={emailOptin} onChange={(e) => setEmailOptin(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800">
                <option value="checkout_and_signin">Checkout and sign-in</option>
                <option value="checkout_only">Checkout only</option>
                <option value="signin_only">Sign-in only</option>
                <option value="don_t_show">Don&apos;t show</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">&quot;Email me with news and offers&quot;</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">SMS Marketing Opt-in</label>
              <select value={smsOptin} onChange={(e) => setSmsOptin(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-amber-800">
                <option value="don_t_show">Don&apos;t show</option>
                <option value="checkout_only">Checkout only</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">&quot;Text me with news and offers&quot;</p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 block">Tipping options at checkout</span>
              <span className="text-gray-500 text-xs">Allow customers to select from preset tips (10%, 15%, 20%) or enter custom amounts.</span>
            </div>
            <input
              type="checkbox"
              checked={showTipping}
              onChange={(e) => setShowTipping(e.target.checked)}
              className="w-4 h-4 text-amber-800 rounded border-gray-300"
            />
          </div>
        </div>

        {/* 4. Advanced Rules Buttons */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Advanced Rules</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setAddressModalOpen(true)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-left font-bold text-gray-900 transition-colors cursor-pointer"
            >
              Address Collection Rules &rarr;
            </button>

            <button
              onClick={() => setCartLimitModalOpen(true)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-left font-bold text-gray-900 transition-colors cursor-pointer"
            >
              Add-to-Cart Item Limit &rarr;
            </button>
          </div>
        </div>

        {/* 5. Live Checkout Preview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-900">Live Checkout Preview</h2>
            <a
              href="http://localhost:3000/checkout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
            >
              Open Storefront Checkout →
            </a>
          </div>
          <p className="text-xs text-gray-500">This is a visual reference showing how your storefront checkout will appear to customers with the current settings. Edit settings above to change the layout.</p>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-5 text-xs">
            {/* Contact Section Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm">Contact</h3>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">
                {contactMethod === "email" ? "Email *" : "Email (optional)"}
              </div>
              {emailOptin !== "don_t_show" && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-3.5 h-3.5 rounded border border-gray-300 bg-white" />
                  <span>Email me with news and offers</span>
                </div>
              )}
              {requireLogin && (
                <p className="text-[11px] text-amber-700 font-semibold">Customers must sign in before checkout</p>
              )}
            </div>

            {/* Delivery Fields Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm">Delivery</h3>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">Country/Region</div>
              <div className="grid grid-cols-2 gap-2">
                {fullNameField === "required" && (
                  <>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">First name *</div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">Last name *</div>
                  </>
                )}
                {fullNameField === "optional" && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">Last name *</div>
                )}
              </div>
              {companyNameField !== "don_t_include" && (
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">
                  Company name {companyNameField === "required" ? "*" : "(optional)"}
                </div>
              )}
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">Address *</div>
              {addressLine2Field !== "don_t_include" && (
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">
                  Apt, suite, etc. {addressLine2Field === "required" ? "*" : "(optional)"}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">City *</div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">Postal code</div>
              </div>
              {shippingPhoneField !== "don_t_include" && (
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">
                  Phone {shippingPhoneField === "required" ? "*" : ""}
                </div>
              )}
            </div>

            {/* Shipping Method Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm">Shipping method</h3>
              <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-gray-400">Standard Delivery</span>
                <span className="text-gray-400">Rs 250.00</span>
              </div>
            </div>

            {/* Tipping Preview */}
            {showTipping && (
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Add a tip</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {["None", "Rs 50", "Rs 100", "Rs 200"].map((label) => (
                    <div key={label} className="py-2 rounded-lg border border-gray-200 bg-white text-center text-gray-400">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Preview */}
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm">Billing address</h3>
              {billingRule === "require_match" ? (
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-400">
                  Must match shipping address
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-4 border-amber-800" />
                    <span className="text-gray-700">Same as shipping address</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-gray-300" />
                    <span className="text-gray-700">Use a different billing address</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Limit Info */}
            {enableCartLimit && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                Max {cartItemLimit} items per cart
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Rename Configuration Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Rename Configuration</h3>
              <button onClick={() => setRenameModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Configuration Title</label>
                <input
                  type="text"
                  required
                  value={tempConfigName}
                  onChange={(e) => setTempConfigName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setRenameModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">
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

      {/* Address Collection Rules Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Address Collection Rules</h3>
              <button onClick={() => setAddressModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <input type="radio" name="billingRule" checked={billingRule === "allow_different"} onChange={() => setBillingRule("allow_different")} className="mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Allow shipping and billing address to be different (Recommended)</span>
                  <span className="text-[11px] text-gray-500">Uses shipping address as billing address by default for faster checkout.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <input type="radio" name="billingRule" checked={billingRule === "require_match"} onChange={() => setBillingRule("require_match")} className="mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900 block">Require shipping and billing address to match</span>
                  <span className="text-[11px] text-gray-500">Only recommended for stores with high fraudulent order risk paired with AVS.</span>
                </div>
              </label>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input type="checkbox" checked={validateShippingAddress} onChange={(e) => setValidateShippingAddress(e.target.checked)} />
                  <span>Validate shipping address</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input type="checkbox" checked={!useShippingAsBillingDefault} onChange={(e) => setUseShippingAsBillingDefault(!e.target.checked)} />
                  <span>Don&apos;t use shipping address as billing address by default</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setAddressModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">Cancel</button>
              <button onClick={() => { toast.success("Address rules applied! Click Save to persist."); setAddressModalOpen(false); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold cursor-pointer">Apply</button>            </div>
          </div>
        </div>
      )}

      {/* Add-to-Cart Limit Modal */}
      {cartLimitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add-to-Cart Limit</h3>
              <button onClick={() => setCartLimitModalOpen(false)} className="p-1 text-gray-400 hover:text-black cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-500">Set a maximum quantity per item that can be added to a cart. Protects your available inventory quantities from being revealed when higher than this limit.</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer font-bold text-gray-900">
                <span>Enable Add-to-cart Limit</span>
                <input type="checkbox" checked={enableCartLimit} onChange={(e) => setEnableCartLimit(e.target.checked)} className="w-4 h-4 text-amber-800 rounded cursor-pointer" />
              </label>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Limit (Recommended: 50)</label>
                <input type="number" min={1} value={cartItemLimit} onChange={(e) => setCartItemLimit(parseInt(e.target.value) || 50)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono font-bold text-gray-900 text-sm" />
                <p className="text-[11px] text-gray-500 mt-1">Your store&apos;s recommended limit is 50.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setCartLimitModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold cursor-pointer">Cancel</button>
              <button onClick={() => { toast.success(`Cart limit set to ${cartItemLimit}! Click Save to persist.`); setCartLimitModalOpen(false); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold cursor-pointer">Apply Limit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
