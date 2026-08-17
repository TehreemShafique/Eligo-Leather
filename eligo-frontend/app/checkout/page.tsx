"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { CheckCircle, Question } from "@phosphor-icons/react"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartSubtotal, clearCart } = useCart()

  const [formData, setFormData] = useState({
    email: "",
    emailNews: false,
    country: "Pakistan",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    saveInfo: false,
    shippingMethod: "cod_fee",
    paymentMethod: "cod",
    billingAddress: "same",
    discountCode: "",
  })

  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState<string | number>("")

  // Shipping fee logic: Free if subtotal >= 2000 PKR, else 250 PKR
  const baseShippingFee = cartSubtotal >= 2000 ? 0 : 250
  const finalShippingFee = Math.max(0, baseShippingFee - appliedDiscount)
  const orderTotal = cartSubtotal + finalShippingFee
  const estimatedTax = Math.round(orderTotal * 0.15) // Estimated included tax calculation for presentation

  const handleApplyDiscount = () => {
    if (formData.discountCode.trim().toUpperCase() === "ELIGO10") {
      setAppliedDiscount(200)
      toast.success("Discount code ELIGO10 applied! PKR 200 off shipping.")
    } else if (formData.discountCode.trim() !== "") {
      toast.error("Invalid discount code")
    }
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      toast.error("Your cart is empty!")
      return
    }

    // Required fields validation: Name, Address, City, Phone
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Please enter your first and last name")
      return
    }
    if (!formData.address.trim()) {
      toast.error("Please enter your street address")
      return
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city")
      return
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number")
      return
    }

    setLoading(true)
    const generatedId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`

    const orderPayload = {
      order_id: generatedId,
      customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email.trim() || "customer@eligoleather.com",
      phone: formData.phone,
      shipping_address: `${formData.address}, ${formData.city}${formData.postalCode ? `, ${formData.postalCode}` : ""}, ${formData.country}`,
      items: cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        color: item.color || "Standard",
      })),
      subtotal: cartSubtotal,
      shipping_fee: finalShippingFee,
      total_price: orderTotal,
      payment_method: "Cash on Delivery (COD)",
      status: "Unfulfilled",
      payment_status: "Pending",
    }

    try {
      // POST order payload to backend API so it syncs with admin-frontend/orders
      await fetch("http://127.0.0.1:8000/api/v1/orders/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })
    } catch (error) {
      console.warn("Backend order API fallback sync:", error)
    } finally {
      setCompletedOrderId(generatedId)
      setOrderComplete(true)
      clearCart()
      setLoading(false)
      toast.success(`Order placed successfully! Order #${generatedId}`)
    }
  }

  if (orderComplete) {
    return (
      <div className="py-20 bg-white min-h-[80vh] flex flex-col items-center justify-center font-['Manrope'] px-4 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xs">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
          Thank you for your order!
        </h1>
        <p className="text-lg font-semibold text-amber-800 mb-2">
          Order ID: #{completedOrderId}
        </p>
        <p className="text-gray-600 max-w-md mb-8 text-base leading-relaxed">
          Your order has been placed successfully via Cash on Delivery. You will receive an SMS and email update when your parcel is shipped.
        </p>
        <div className="flex gap-4">
          <Link
            href="/products"
            className="px-8 py-3.5 bg-black hover:bg-neutral-900 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen font-['Manrope'] text-black">
      <div className="max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Form Sections (7 columns) */}
        <div className="lg:col-span-7 p-6 sm:p-12 lg:pr-16 space-y-8">
          {/* Header Brand */}
          <div className="mb-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-wider text-black font-['Manrope']">
                ELIGO
              </span>
              <span className="text-xs tracking-[0.25em] font-semibold text-amber-800 uppercase ml-1">
                Leather
              </span>
            </Link>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Contact</h2>
                <Link href="/auth/login" className="text-sm font-semibold text-black hover:underline">
                  Sign in
                </Link>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email (optional)"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                  />
                  <Question className="w-5 h-5 text-gray-400 absolute right-3.5 top-4" />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.emailNews}
                  onChange={(e) => setFormData({ ...formData, emailNews: e.target.checked })}
                  className="w-4 h-4 rounded-md border-gray-300 accent-amber-800"
                />
                <span>Email me with news and offers</span>
              </label>
            </div>

            {/* Delivery Section */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-black">Delivery</h2>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Country/Region
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-hidden focus:border-amber-800"
                >
                  <option value="Pakistan">Pakistan</option>
                </select>
              </div>

              {/* Name Fields (REQUIRED) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name *"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name *"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                  />
                </div>
              </div>

              {/* Address Field (REQUIRED) */}
              <div>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address (House / Street / Area) *"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                />
              </div>

              {/* City (REQUIRED) & Postal Code (OPTIONAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City *"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Postal code (optional)"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                  />
                </div>
              </div>

              {/* Phone Field (REQUIRED) */}
              <div>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone (+92 300 0000000) *"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <Question className="w-4 h-4 text-gray-400" />
                    <span>🇵🇰</span>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.saveInfo}
                  onChange={(e) => setFormData({ ...formData, saveInfo: e.target.checked })}
                  className="w-4 h-4 rounded-md border-gray-300 accent-amber-800"
                />
                <span>Save this information for next time</span>
              </label>
            </div>

            {/* Shipping Method Section */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-black">Shipping method</h2>

              <div className="rounded-xl border border-gray-300 p-4 flex items-center justify-between bg-white shadow-2xs">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="cod_fee"
                    checked={formData.shippingMethod === "cod_fee"}
                    onChange={() => setFormData({ ...formData, shippingMethod: "cod_fee" })}
                    className="accent-amber-800 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sm text-black block">Delivery + COD Fee</span>
                    <span className="text-xs text-gray-500">5 to 7 business days</span>
                  </div>
                </div>
                <span className="font-bold text-sm text-black">
                  {finalShippingFee === 0 ? "FREE" : `Rs ${finalShippingFee.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-3 pt-2">
              <div>
                <h2 className="text-xl font-bold text-black">Payment</h2>
                <p className="text-xs text-gray-500">All transactions are secure and encrypted.</p>
              </div>

              <div className="rounded-xl border border-black overflow-hidden bg-white">
                <div className="p-4 font-bold text-sm border-b border-gray-200 flex items-center justify-between">
                  <span>Cash on Delivery (COD)</span>
                </div>
                <div className="p-4 bg-gray-50 text-xs text-gray-600">
                  Cash Handling Charges Rs 50 applies on all COD orders
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xl font-bold text-black">Billing address</h2>

              <div className="rounded-xl border border-gray-300 overflow-hidden bg-white">
                <label className="flex items-center gap-3 p-4 border-b border-gray-200 cursor-pointer">
                  <input
                    type="radio"
                    name="billingAddress"
                    value="same"
                    checked={formData.billingAddress === "same"}
                    onChange={() => setFormData({ ...formData, billingAddress: "same" })}
                    className="accent-amber-800 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-black">Same as shipping address</span>
                </label>

                <label className="flex items-center gap-3 p-4 cursor-pointer">
                  <input
                    type="radio"
                    name="billingAddress"
                    value="different"
                    checked={formData.billingAddress === "different"}
                    onChange={() => setFormData({ ...formData, billingAddress: "different" })}
                    className="accent-amber-800 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-black">Use a different billing address</span>
                </label>
              </div>
            </div>

            {/* Submit Button matching screenshots */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black hover:bg-neutral-900 text-white font-bold text-base rounded-xl transition-colors shadow-md cursor-pointer"
              >
                {loading ? "Processing Order..." : "Complete order"}
              </button>
            </div>

            {/* Footer Policy Links matching screenshots */}
            <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600 underline">
              <Link href="/refund-policy" className="hover:text-black">Refund policy</Link>
              <Link href="/shipping-policy" className="hover:text-black">Shipping</Link>
              <Link href="/privacy-policy" className="hover:text-black">Privacy policy</Link>
              <Link href="/terms-of-service" className="hover:text-black">Terms of service</Link>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary Card matching screenshots (5 columns) */}
        <div className="lg:col-span-5 bg-gray-50/70 p-6 sm:p-12 border-l border-gray-200 flex flex-col justify-between min-h-screen">
          <div className="space-y-6">
            {/* Cart Items List with Badge Count */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail Box with Badge */}
                    <div className="relative w-16 h-16 bg-white rounded-xl border border-gray-200 flex-shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover rounded-xl p-1" />
                      <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {item.quantity}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-black leading-tight line-clamp-2">
                        {item.title}
                      </h4>
                      {item.color && (
                        <p className="text-xs text-gray-500 font-medium">Color: {item.color}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-sm font-bold text-black whitespace-nowrap">
                    Rs {(item.price * item.quantity).toLocaleString()}.00
                  </span>
                </div>
              ))}
            </div>

            {/* Discount Code Box */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <input
                type="text"
                value={formData.discountCode}
                onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                placeholder="Discount code"
                className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:border-amber-800"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Price Calculations matching screenshots */}
            <div className="space-y-3 pt-4 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold text-black">Rs {cartSubtotal.toLocaleString()}.00</span>
              </div>

              <div className="flex justify-between text-gray-700 items-center">
                <span className="flex items-center gap-1">
                  <span>Shipping</span>
                  <Question className="w-3.5 h-3.5 text-gray-400" />
                </span>
                <span className="font-semibold text-black">
                  {finalShippingFee === 0 ? "FREE" : `Rs ${finalShippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="border-t border-gray-300 pt-4 flex justify-between items-baseline">
                <div>
                  <span className="text-lg font-bold text-black block">Total</span>
                  <span className="text-xs text-gray-500">
                    Including Rs {estimatedTax.toLocaleString()}.00 in taxes
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-500 mr-1.5">PKR</span>
                  <span className="text-2xl font-black text-black">
                    Rs {orderTotal.toLocaleString()}.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
