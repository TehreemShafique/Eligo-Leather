"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle,
  LockKey,
  Question,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  useCartStore,
  selectCart,
  selectCartSubtotal,
} from "@/modules/cart/store"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { api, ApiError, getApiErrorMessage } from "@/lib/api-client"
import {
  buildGuestOrderPayload,
  CHECKOUT_FIELD_ORDER,
  defaultCheckoutFormValues,
  parseOrderResponse,
  validateCheckoutFields,
  type CheckoutErrorKey,
  type CheckoutFieldErrors,
  type CheckoutFieldKey,
  type CheckoutFormValues,
  type GuestOrderPayload,
} from "./checkout-helpers"

const fieldClassName =
  "h-12 w-full rounded-[10px] border border-neutral-300 bg-white px-4 text-sm text-black outline-none transition-colors placeholder:text-neutral-400 focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10"

const ORDER_CONFIRM_ERROR =
  "We could not confirm your order with the store. Nothing has been charged — your details and cart are unchanged, so you can safely try again."

function resolveSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error)
  }
  return "We could not reach the store to place your order. Please check your connection and try again."
}

export default function CheckoutPage() {
  const cart = useCartStore(selectCart)
  const cartSubtotal = useCartStore(selectCartSubtotal)
  const clearCart = useCartStore((state) => state.clearCart)
  const [formData, setFormData] = useState<CheckoutFormValues>(defaultCheckoutFormValues)
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState("")
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Synchronous lock so rapid double clicks cannot fire a second request.
  const pendingRef = useRef(false)
  const inputRefs = useRef<Partial<Record<CheckoutFieldKey, HTMLElement | null>>>({})

  const baseShippingFee = cartSubtotal >= 2000 ? 0 : 250
  const finalShippingFee = Math.max(0, baseShippingFee - appliedDiscount)
  const orderTotal = cartSubtotal + finalShippingFee

  const updateField = <K extends keyof CheckoutFormValues>(
    field: K,
    value: CheckoutFormValues[K],
  ) => setFormData((current) => ({ ...current, [field]: value }))

  const handleApplyDiscount = () => {
    const code = formData.discountCode.trim().toUpperCase()
    if (code === "ELIGO10") {
      setAppliedDiscount(200)
      toast.success("ELIGO10 applied — Rs.200 off shipping.")
    } else if (code) {
      setAppliedDiscount(0)
      toast.error("That discount code is not valid.")
    }
  }

  const fieldAriaProps = (key: CheckoutFieldKey) => ({
    "aria-invalid": fieldErrors[key] ? ("true" as const) : undefined,
    "aria-describedby": fieldErrors[key] ? `checkout-error-${key}` : undefined,
  })

  const handleSubmitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading || pendingRef.current) return

    const totals = {
      subtotal: cartSubtotal,
      shippingCost: finalShippingFee,
      total: orderTotal,
    }
    const errors = validateCheckoutFields(formData, cart, totals)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitError(null)
      const firstInvalid = CHECKOUT_FIELD_ORDER.find((key) => Boolean(errors[key]))
      if (firstInvalid) {
        const element = inputRefs.current[firstInvalid]
        element?.focus()
        element?.scrollIntoView({ block: "center", behavior: "smooth" })
      }
      return
    }

    setFieldErrors({})
    setSubmitError(null)
    setLoading(true)
    pendingRef.current = true

    const payload = buildGuestOrderPayload(formData, cart, totals)

    try {
      const response = await api.post<unknown, GuestOrderPayload>(
        "/orders/create-order",
        payload,
        { auth: false },
      )
      const parsed = parseOrderResponse(response)
      if (!parsed.ok) {
        // Malformed or non-success response: treat truthfully as failure.
        setSubmitError(ORDER_CONFIRM_ERROR)
        return
      }
      setCompletedOrderId(parsed.orderNumber)
      setOrderComplete(true)
      clearCart()
    } catch (error) {
      setSubmitError(resolveSubmitErrorMessage(error))
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  if (orderComplete) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16 font-['Manrope'] sm:py-24">
        <div className="mx-auto max-w-2xl rounded-[20px] border border-amber-800/20 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-700">
            <CheckCircle className="h-12 w-12" weight="fill" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-amber-800">
            Order confirmed
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">
            Thank you for your order
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            Your Cash on Delivery order has been received. We will contact you when it is ready to ship.
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-[10px] bg-slate-50 px-4 py-3 text-sm">
            Order reference: <strong className="text-amber-800">{completedOrderId}</strong>
          </div>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-[10px] bg-amber-800 px-8 text-sm font-semibold text-white transition-colors hover:bg-amber-900"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    )
  }

  if (!cart.length) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16 font-['Manrope'] sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-amber-800" weight="thin" />
          <h1 className="mt-6 text-3xl font-bold text-black">Your cart is empty</h1>
          <p className="mt-3 text-neutral-600">Add a leather product to your cart before continuing to checkout.</p>
          <Link href="/products" className="mt-8 inline-flex h-12 items-center rounded-[10px] bg-amber-800 px-8 text-sm font-semibold text-white hover:bg-amber-900">
            Explore products
          </Link>
        </div>
      </main>
    )
  }

  const hasValidationErrors = Object.keys(fieldErrors).length > 0

  return (
    <main className="min-h-screen bg-slate-50 font-['Manrope'] text-black">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <PageBreadcrumb label="Checkout" />
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">Secure checkout</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight text-amber-800 sm:text-5xl">Checkout</h1>
          <p className="mt-3 max-w-2xl text-base text-neutral-600">Complete your delivery details and review your order before placing it.</p>
        </div>

        <form onSubmit={handleSubmitOrder} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] xl:gap-12">
          <div className="space-y-6">
            <CheckoutSection number="01" title="Contact information">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-neutral-600">We will use these details for order updates.</p>
                <Link href="/login" className="shrink-0 text-sm font-semibold text-amber-800 hover:underline">Sign in</Link>
              </div>
              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Email address (optional)"
                  className={`${fieldClassName}${fieldErrors.email ? " border-red-500" : ""}`}
                  {...fieldAriaProps("email")}
                  ref={(element) => { inputRefs.current.email = element }}
                />
                <FieldErrorMessage idName="email" message={fieldErrors.email} />
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600">
                <input type="checkbox" checked={formData.emailNews} onChange={(event) => updateField("emailNews", event.target.checked)} className="h-4 w-4 accent-amber-800" />
                Email me about new products and offers
              </label>
            </CheckoutSection>

            <CheckoutSection number="02" title="Delivery address">
              <select value={formData.country} onChange={(event) => updateField("country", event.target.value)} className={fieldClassName} aria-label="Country or region">
                <option value="Pakistan">Pakistan</option>
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <input value={formData.firstName} onChange={(event) => updateField("firstName", event.target.value)} placeholder="First name *" className={`${fieldClassName}${fieldErrors.firstName ? " border-red-500" : ""}`} autoComplete="given-name" {...fieldAriaProps("firstName")} ref={(element) => { inputRefs.current.firstName = element }} />
                  <FieldErrorMessage idName="firstName" message={fieldErrors.firstName} />
                </div>
                <div>
                  <input value={formData.lastName} onChange={(event) => updateField("lastName", event.target.value)} placeholder="Last name *" className={`${fieldClassName}${fieldErrors.lastName ? " border-red-500" : ""}`} autoComplete="family-name" {...fieldAriaProps("lastName")} ref={(element) => { inputRefs.current.lastName = element }} />
                  <FieldErrorMessage idName="lastName" message={fieldErrors.lastName} />
                </div>
              </div>
              <div>
                <input value={formData.address} onChange={(event) => updateField("address", event.target.value)} placeholder="House, street and area *" className={`${fieldClassName}${fieldErrors.address ? " border-red-500" : ""}`} autoComplete="street-address" {...fieldAriaProps("address")} ref={(element) => { inputRefs.current.address = element }} />
                <FieldErrorMessage idName="address" message={fieldErrors.address} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <input value={formData.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City *" className={`${fieldClassName}${fieldErrors.city ? " border-red-500" : ""}`} autoComplete="address-level2" {...fieldAriaProps("city")} ref={(element) => { inputRefs.current.city = element }} />
                  <FieldErrorMessage idName="city" message={fieldErrors.city} />
                </div>
                <input value={formData.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} placeholder="Postal code (optional)" className={fieldClassName} autoComplete="postal-code" />
              </div>
              <div>
                <input type="tel" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone number *" className={`${fieldClassName}${fieldErrors.phone ? " border-red-500" : ""}`} autoComplete="tel" inputMode="tel" {...fieldAriaProps("phone")} ref={(element) => { inputRefs.current.phone = element }} />
                <FieldErrorMessage idName="phone" message={fieldErrors.phone} />
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600">
                <input type="checkbox" checked={formData.saveInfo} onChange={(event) => updateField("saveInfo", event.target.checked)} className="h-4 w-4 accent-amber-800" />
                Save these details for next time
              </label>
            </CheckoutSection>

            <CheckoutSection number="03" title="Shipping method">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-amber-800 bg-amber-50/40 p-4">
                <span className="flex items-center gap-3">
                  <input type="radio" name="shipping" checked={formData.shippingMethod === "standard"} onChange={() => updateField("shippingMethod", "standard")} className="h-4 w-4 accent-amber-800" />
                  <Truck className="h-6 w-6 text-amber-800" />
                  <span><strong className="block text-sm">Standard delivery</strong><span className="text-xs text-neutral-500">Usually 2–4 working days</span></span>
                </span>
                <strong className="text-sm text-amber-800">{finalShippingFee ? `Rs.${finalShippingFee}` : "Free"}</strong>
              </label>
            </CheckoutSection>

            <CheckoutSection number="04" title="Payment">
              <p className="text-sm text-neutral-600">Payment is collected when your order is delivered.</p>
              <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-amber-800 bg-amber-50/40 p-4">
                <input type="radio" name="payment" checked={formData.paymentMethod === "cod"} onChange={() => updateField("paymentMethod", "cod")} className="h-4 w-4 accent-amber-800" />
                <ShieldCheck className="h-6 w-6 text-amber-800" />
                <span><strong className="block text-sm">Cash on Delivery</strong><span className="text-xs text-neutral-500">Pay securely when your parcel arrives</span></span>
              </label>
            </CheckoutSection>
          </div>

          <aside className="overflow-hidden rounded-[20px] border border-amber-800/20 bg-white shadow-sm lg:sticky lg:top-36">
            <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <h2 className="text-xl font-bold">Order summary</h2>
              <p className="mt-1 text-xs text-neutral-500">{cart.length} product{cart.length === 1 ? "" : "s"} in your order</p>
            </div>
            <div className="max-h-[360px] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              {cart.map((item) => (
                <div key={`${item.id}-${item.color || "default"}`} className="flex items-center gap-4">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-neutral-200 bg-slate-50">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                    <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">{item.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="line-clamp-2 block text-sm leading-5">{item.title}</strong>
                    {item.color ? <span className="mt-1 block text-xs text-neutral-500">Color: {item.color}</span> : null}
                  </span>
                  <strong className="shrink-0 text-sm">Rs.{(item.price * item.quantity).toLocaleString("en-PK")}</strong>
                </div>
              ))}
            </div>
            <div className="border-y border-neutral-200 bg-slate-50/70 px-5 py-5 sm:px-6">
              <div className="flex gap-3">
                <input value={formData.discountCode} onChange={(event) => updateField("discountCode", event.target.value)} placeholder="Discount code" className={fieldClassName} />
                <button type="button" onClick={handleApplyDiscount} className="h-12 rounded-[10px] border border-amber-800 px-5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-800 hover:text-white">Apply</button>
              </div>
            </div>
            <div className="space-y-3 px-5 py-5 text-sm sm:px-6">
              <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><strong>Rs.{cartSubtotal.toLocaleString("en-PK")}</strong></div>
              <div className="flex justify-between"><span className="flex items-center gap-1 text-neutral-600">Shipping <Question className="h-4 w-4" /></span><strong>{finalShippingFee ? `Rs.${finalShippingFee.toLocaleString("en-PK")}` : "Free"}</strong></div>
              {appliedDiscount ? <div className="flex justify-between text-green-700"><span>Discount</span><strong>-Rs.{appliedDiscount}</strong></div> : null}
              <div className="flex items-end justify-between border-t border-neutral-200 pt-4"><span className="text-base font-bold">Total</span><span><small className="mr-2 text-xs text-neutral-500">PKR</small><strong className="text-2xl text-amber-800">Rs.{orderTotal.toLocaleString("en-PK")}</strong></span></div>

              {hasValidationErrors ? (
                <div role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                  <strong className="block font-semibold">Please fix the highlighted fields:</strong>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {(Object.keys(fieldErrors) as CheckoutErrorKey[]).map((key) => (
                      <li key={key}>{fieldErrors[key]}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {submitError ? (
                <div role="alert" className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                  <strong className="block font-semibold">Order not placed.</strong>
                  <p className="mt-1">{submitError}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="mt-1 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[10px] bg-amber-800 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LockKey className="h-5 w-5" />{loading ? "Placing order..." : "Place order"}
              </button>
              <p className="text-center text-xs leading-5 text-neutral-500">By placing your order, you agree to our <Link href="/terms-of-service" className="underline">terms</Link> and <Link href="/refund-policy" className="underline">refund policy</Link>.</p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  )
}

function FieldErrorMessage({ idName, message }: { idName: CheckoutFieldKey; message?: string }) {
  if (!message) return null
  return (
    <p id={`checkout-error-${idName}`} className="mt-1 text-xs font-medium text-red-600">
      {message}
    </p>
  )
}

function CheckoutSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[20px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-800 text-xs font-bold text-white">{number}</span>
        <h2 className="text-xl font-bold text-black sm:text-2xl">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
