"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ShoppingBagOpen,
  DotsThreeOutline,
  PencilSimple,
  Copy,
  Eye,
  X,
  Check,
  Globe,
  Lock,
  Tag,
  ShieldCheck,
  Sliders,
  Sparkle,
  Minus,
  Plus,
  ArrowRight,
  Info,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsCheckoutPage() {
  // Config Name & Action Dropdown States
  const [configName, setConfigName] = useState("My Store configuration")
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [tempConfigName, setTempConfigName] = useState(configName)

  // Interactive Live Storefront Checkout Preview Modal
  const [liveCheckoutModalOpen, setLiveCheckoutModalOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "signin" | "checkout">("checkout")
  const [cartQuantity, setCartQuantity] = useState(1)
  const [itemPrice] = useState(2899)
  const [discountCode, setDiscountCode] = useState("")

  // Checkout Settings States
  const [contactMethod, setContactMethod] = useState<"phone_or_email" | "email">("phone_or_email")
  const [showOrderTrackingLink, setShowOrderTrackingLink] = useState(false)
  const [requireLogin, setRequireLogin] = useState(false)

  // Form Field Requirements
  const [fullNameField, setFullNameField] = useState("required")
  const [companyNameField, setCompanyNameField] = useState("don_t_include")
  const [addressLine2Field, setAddressLine2Field] = useState("optional")
  const [shippingPhoneField, setShippingPhoneField] = useState("required")

  // Marketing Opt-In & Tipping
  const [emailOptin, setEmailOptin] = useState("checkout_and_signin")
  const [smsOptin, setSmsOptin] = useState("don_t_show")
  const [showTipping, setShowTipping] = useState(false)
  const [checkoutLanguage, setCheckoutLanguage] = useState("English")

  // Address Collection & Cart Limits
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [billingRule, setBillingRule] = useState<"allow_different" | "require_match">("allow_different")
  const [validateShippingAddress, setValidateShippingAddress] = useState(false)
  const [useShippingAsBillingDefault, setUseShippingAsBillingDefault] = useState(true)

  // Cart Limit Modal & Settings
  const [cartLimitModalOpen, setCartLimitModalOpen] = useState(false)
  const [enableCartLimit, setEnableCartLimit] = useState(true)
  const [cartItemLimit, setCartItemLimit] = useState(50)

  // Fraud Rules Modal & Settings
  const [fraudModalOpen, setFraudModalOpen] = useState(false)

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfigName(tempConfigName)
    setRenameModalOpen(false)
    toast.success(`Checkout configuration renamed to "${tempConfigName}"!`)
  }

  const handleDuplicateConfig = () => {
    toast.success(`Configuration "${configName}" duplicated as "My Store configuration Copy"!`)
    setActionDropdownOpen(false)
  }

  const handleCompleteOrder = () => {
    toast.success("Order completed successfully! Inventory deducted.")
    setLiveCheckoutModalOpen(false)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header & Configurations Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Checkout Experience</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Checkout
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Customize checkout forms, customer login rules, cart item limits, marketing consent, and fraud validation rules.
          </p>
        </div>
      </div>

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
              <p className="text-gray-500 text-xs">Saved 30 Apr at 4:03 am &bull; Default store rules</p>
            </div>

            <div className="flex items-center gap-3 relative">
              <button
                onClick={() => setLiveCheckoutModalOpen(true)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>View Live Checkout</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setActionDropdownOpen(!actionDropdownOpen)}
                  className="p-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-gray-800 font-bold"
                >
                  <DotsThreeOutline className="w-4 h-4" />
                </button>

                {actionDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-2 space-y-1 font-semibold text-gray-700">
                    <button
                      onClick={() => {
                        setLiveCheckoutModalOpen(true)
                        setActionDropdownOpen(false)
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-800" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => {
                        setTempConfigName(configName)
                        setRenameModalOpen(true)
                        setActionDropdownOpen(false)
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <PencilSimple className="w-3.5 h-3.5 text-gray-500" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={handleDuplicateConfig}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded-lg flex items-center gap-2"
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

        {/* 4. Address Rules, Cart Limits & Fraud Rules Buttons */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Advanced Rules &amp; Fraud Validation</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setAddressModalOpen(true)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-left font-bold text-gray-900 transition-colors"
            >
              Address Collection Rules &rarr;
            </button>

            <button
              onClick={() => setCartLimitModalOpen(true)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-left font-bold text-gray-900 transition-colors"
            >
              Add-to-Cart Item Limit &rarr;
            </button>

            <button
              onClick={() => setFraudModalOpen(true)}
              className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 text-left font-bold text-amber-900 transition-colors"
            >
              CWILL Fraud Validation &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* A. Rename Configuration Popup Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Rename Configuration</h3>
              <button onClick={() => setRenameModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
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
                <button type="button" onClick={() => setRenameModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">
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

      {/* B. Live Interactive Storefront Checkout Modal (View Option) */}
      {liveCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-xs font-sans flex flex-col max-h-[92vh]">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm">Eligo Leather Storefront Checkout</span>
                <span className="px-2.5 py-0.5 bg-amber-800 text-white rounded-full text-[10px] font-bold">Live Simulation</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCheckoutStep(checkoutStep === "cart" ? "checkout" : "cart")}
                  className="text-xs underline text-amber-200"
                >
                  Toggle Cart / Checkout
                </button>
                <button onClick={() => setLiveCheckoutModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
              {checkoutStep === "cart" ? (
                /* Shopping Cart View */
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs max-w-xl mx-auto space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Shopping Cart</h2>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">ESSENCE - Premium Leather Belt</div>
                      <div className="text-gray-500 text-xs">Dark Brown / 34</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg bg-gray-50 px-2 py-1 gap-2">
                        <button onClick={() => setCartQuantity(Math.max(1, cartQuantity - 1))} className="p-0.5 text-gray-600"><Minus className="w-3 h-3" /></button>
                        <span className="font-bold text-xs">{cartQuantity}</span>
                        <button onClick={() => setCartQuantity(cartQuantity + 1)} className="p-0.5 text-gray-600"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-gray-900">Rs {(itemPrice * cartQuantity).toLocaleString()}.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setCheckoutStep("signin")}
                      className="text-amber-800 font-semibold hover:underline"
                    >
                      Continue Shopping / Sign In
                    </button>
                    <button
                      onClick={() => setCheckoutStep("checkout")}
                      className="px-6 py-2.5 bg-amber-800 text-white font-bold rounded-xl shadow-md"
                    >
                      Check out
                    </button>
                  </div>
                </div>
              ) : checkoutStep === "signin" ? (
                /* Optional Sign-In Bypass Modal */
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs max-w-md mx-auto space-y-4">
                  <h2 className="text-base font-bold text-gray-900">Sign In to Eligo Store</h2>
                  <p className="text-gray-500 text-xs">Sign in with your email or bypass authentication to continue as guest.</p>
                  <input type="email" placeholder="customer@example.com" className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                  <div className="flex justify-between gap-3 pt-2">
                    <button onClick={() => setCheckoutStep("checkout")} className="px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-xl">
                      Bypass &amp; Guest Checkout
                    </button>
                    <button onClick={() => setCheckoutStep("checkout")} className="px-5 py-2 bg-amber-800 text-white font-bold rounded-xl">
                      Sign In &amp; Continue
                    </button>
                  </div>
                </div>
              ) : (
                /* Final Checkout Page View */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Checkout Details</h2>

                    <div>
                      <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Contact Email / Phone</label>
                      <input type="text" defaultValue="sajidwatto155@gmail.com" className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                      <label className="flex items-center gap-2 cursor-pointer mt-1 text-gray-700">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-amber-800" />
                        <span>Email me with news and offers</span>
                      </label>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Delivery Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" className="p-2.5 bg-amber-50 border border-amber-800 text-amber-900 font-bold rounded-xl text-center">Ship (Pakistan)</button>
                        <button type="button" className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-xl text-center">Pickup</button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Shipping Method</label>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold text-gray-900 flex justify-between">
                        <span>Free Standard Courier</span>
                        <span className="text-emerald-700">FREE</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Payment Method</label>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1">
                        <span className="font-bold text-amber-900 block">Cash on Delivery (COD)</span>
                        <span className="text-amber-800 text-[11px] block">Free Shipping On Above 2000/ Order. Pay cash upon delivery.</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Billing Address</label>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="billAddr" defaultChecked /><span className="font-semibold">Same as shipping address</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="billAddr" /><span className="font-semibold">Use a different billing address</span></label>
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteOrder}
                      className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl shadow-md text-sm mt-4 cursor-pointer"
                    >
                      Complete Order (Submit)
                    </button>
                  </div>

                  {/* Order Summary Column */}
                  <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Order Summary</h2>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900">ESSENCE - Premium Leather Belt</div>
                        <div className="text-gray-500 text-[11px]">Dark Brown / 34 &bull; Qty: {cartQuantity}</div>
                      </div>
                      <span className="font-bold text-gray-900">Rs {(itemPrice * cartQuantity).toLocaleString()}.00</span>
                    </div>

                    <div className="flex gap-2">
                      <input type="text" placeholder="Discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="w-full h-9 px-3 rounded-xl bg-gray-50 border border-gray-300 font-semibold" />
                      <button onClick={() => toast.success("Discount code applied!")} className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-xl font-bold">Apply</button>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-gray-700"><span>Subtotal</span><span className="font-bold">Rs {(itemPrice * cartQuantity).toLocaleString()}.00</span></div>
                      <div className="flex justify-between text-gray-700"><span>Shipping</span><span className="font-bold text-emerald-700">FREE</span></div>
                      <div className="flex justify-between text-gray-900 font-bold text-sm pt-2 border-t border-gray-100"><span>Total</span><span className="text-amber-800">PKR Rs {(itemPrice * cartQuantity).toLocaleString()}.00</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* C. Address Collection Rules Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Address Collection Rules</h3>
              <button onClick={() => setAddressModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
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
              <button onClick={() => setAddressModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">Cancel</button>
              <button onClick={() => { toast.success("Address rules saved!"); setAddressModalOpen(false); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* D. Add-to-Cart Limit Popup Modal */}
      {cartLimitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add-to-Cart Limit</h3>
              <button onClick={() => setCartLimitModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-500">Set a maximum quantity per item that can be added to a cart. Protects your available inventory quantities from being revealed when higher than this limit.</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer font-bold text-gray-900">
                <span>Enable Add-to-cart Limit</span>
                <input type="checkbox" checked={enableCartLimit} onChange={(e) => setEnableCartLimit(e.target.checked)} className="w-4 h-4 text-amber-800 rounded" />
              </label>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Limit (Recommended: 50)</label>
                <input type="number" min={1} value={cartItemLimit} onChange={(e) => setCartItemLimit(parseInt(e.target.value) || 50)} className="w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-300 font-mono font-bold text-gray-900 text-sm" />
                <p className="text-[11px] text-gray-500 mt-1">Your store&apos;s recommended limit is 50.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setCartLimitModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold">Cancel</button>
              <button onClick={() => { toast.success(`Cart limit set to ${cartItemLimit}!`); setCartLimitModalOpen(false); }} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold">Save Limit</button>
            </div>
          </div>
        </div>
      )}

      {/* E. CWILL Fraud Order Validation Popup Modal */}
      {fraudModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-800" />
                <h3 className="text-base font-bold text-gray-900">CWILL (PARCEL PANEL) Fraud Order Validation</h3>
              </div>
              <button onClick={() => setFraudModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-amber-900">
              <span className="font-bold text-sm block">Active Risk Validation Extension</span>
              <p className="text-xs">
                CWILL Parcel Panel validates customer checkout details against high-risk order patterns, disposable emails, and suspicious shipping addresses.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button onClick={() => setFraudModalOpen(false)} className="px-5 py-2 bg-amber-800 text-white rounded-xl font-semibold">
                Close Validation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
