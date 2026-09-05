"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle,
  LockKey,
  Question,
  ShieldCheck,
  ShoppingBag,
  SpinnerIcon,
  Trash,
  Truck,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useCartStore, selectCart, selectCartSubtotal, type CartItem } from "@/modules/cart/store"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { api, ApiError, getApiErrorMessage } from "@/lib/api-client"
import { clearWelcomeCoupon, loadWelcomeCoupon } from "@/lib/welcome-coupon"
import { useNavigationLock } from "@/lib/use-navigation-lock"
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

const LAST_ORDER_KEY = "eligo_last_order"

const VISITOR_COOKIE = "eligo_visitor_id"

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null
}

/**
 * Stable string fingerprint of the meaningful cart contents, so a changed
 * product / variant / quantity / price always triggers coupon revalidation —
 * even when the subtotal stays the same (e.g. a same-price product swap).
 * Self-contained line identity (product id + variant/color) so the page does
 * not couple to the cart store's other exports.
 */
function cartContentsFingerprint(cart: CartItem[]): string {
  return cart
    .map(
      (item) =>
        `${String(item.id)}|${
          item.variantId != null ? String(item.variantId) : ""
        }|${(item.color ?? "").trim()}|${item.quantity}|${Number(item.price)}`,
    )
    .sort()
    .join("::")
}

function resolveSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error)
  }
  return "We could not reach the store to place your order. Please check your connection and try again."
}

interface ShippingCalculation {
  currency: string
  subtotal: number
  shipping_charge: number
  free_shipping_threshold: number
  shipping_cost: number
  is_free_shipping: boolean
  amount_to_free_shipping: number | null
}

export default function CheckoutPage() {
  const cart = useCartStore(selectCart)
  const cartSubtotal = useCartStore(selectCartSubtotal)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const clearCart = useCartStore((state) => state.clearCart)
  const [formData, setFormData] = useState<CheckoutFormValues>(defaultCheckoutFormValues)
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [appliedDiscountCode, setAppliedDiscountCode] = useState("")
  // Monotonic bump issued every time a verification RESPONSE is actually
  // processed (valid, invalid, or error). Guarantees a fresh render so the
  // stale-window ("Recalculating…") state is left even when the revalidated
  // discount amount is identical to the previous one — `setAppliedDiscount`
  // alone would bail out on an equal number and the ref-based staleness check
  // would then never be re-evaluated.
  const [, setDiscountRefreshTick] = useState(0)
  const [loading, setLoading] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    try {
      const saved = window.sessionStorage.getItem(LAST_ORDER_KEY)
      const { orderNumber } = saved ? (JSON.parse(saved) as { orderNumber?: string }) : {}
      return orderNumber || ""
    } catch {
      return ""
    }
  })
  const [orderComplete, setOrderComplete] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      const saved = window.sessionStorage.getItem(LAST_ORDER_KEY)
      const { orderNumber } = saved ? (JSON.parse(saved) as { orderNumber?: string }) : {}
      return Boolean(orderNumber)
    } catch {
      return false
    }
  })
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Server-authoritative shipping configuration (charge + free threshold).
  const [shippingCalc, setShippingCalc] = useState<ShippingCalculation | null>(null)

  // Synchronous lock so rapid double clicks cannot fire a second request.
  const pendingRef = useRef(false)
  const inputRefs = useRef<Partial<Record<CheckoutFieldKey, HTMLElement | null>>>({})

  // Auto-apply (saved welcome coupon) bookkeeping. Refs keep the latest
  // callback/state reachable so the auto-apply effect can run only when the
  // cart fingerprint changes, without stale closures or re-running every
  // render. autoAppliedRef guarantees exactly one initial verification.
  const applyCodeRef = useRef<((rawCode: string, opts?: { silent?: boolean }) => Promise<void>) | null>(null)
  const appliedCodeRef = useRef("")
  const autoAppliedRef = useRef(false)
  // Tracks whether the AUTOMATIC welcome-coupon flow is still the active flow
  // (holds the saved welcome code). This is deliberately kept separate from
  // appliedCodeRef (which reflects the LAST verification RESULT): during the
  // first automatic verification appliedCodeRef is still empty, so keying the
  // queue/revalidation on it would drop a cart change made mid-flight. The
  // auto flow is stopped (cleared) the moment a different coupon is applied
  // manually, so the auto-flow can never overwrite a manual coupon.
  const activeAutoWelcomeRef = useRef("")

  // Concurrency + sequencing for coupon verification. Refs are used for the
  // in-flight flag so it can be read/written synchronously inside async
  // callbacks (React state updates are async and could be stale mid-flight).
  // A monotonic sequence discards stale responses, and a single pending-code
  // ref coalesces rapid cart changes into one follow-up revalidation that
  // always uses the LATEST cart. validatedFingerprint remembers WHICH cart
  // the currently displayed discount was verified for: after a quantity /
  // contents change the old amount is hidden until the revalidation response
  // lands, so the UI never shows "new subtotal + old discount (or total)".
  const discountLoadingRef = useRef(false)
  const verifySeqRef = useRef(0)
  const pendingRevalidateRef = useRef<string | null>(null)
  const [validatedFingerprint, setValidatedFingerprint] = useState("")

  const placeOrderInProgress = loading || orderComplete
  useNavigationLock(placeOrderInProgress, { warnOnUnload: loading })

  useEffect(() => {
    let cancelled = false
    api
      .post<ShippingCalculation, { subtotal: number }>(
        "/shipping/calculate",
        { subtotal: cartSubtotal },
        { auth: false },
      )
      .then((data) => {
        if (!cancelled) setShippingCalc(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [cartSubtotal])

  const baseShippingFee = shippingCalc?.shipping_cost ?? 0
  const finalShippingFee = Math.max(0, baseShippingFee)
  // Discounts reduce the merchandise subtotal, never the shipping fee.
  // A discount is only used when it is still valid for the CURRENT cart: after
  // a quantity/contents change the amount is stale until the revalidation
  // response lands, so during that window it is hidden and the subtotal/total
  // are computed WITHOUT it — never "new subtotal + old discount/total".
  const discountIsStale =
    validatedFingerprint !== "" &&
    validatedFingerprint !== cartContentsFingerprint(cart) &&
    (appliedDiscount > 0 || appliedDiscountCode !== "")
  const displayDiscount = discountIsStale ? 0 : appliedDiscount
  const discountedSubtotal = Math.max(0, cartSubtotal - displayDiscount)
  const orderTotal = discountedSubtotal + finalShippingFee
  const amountToFreeShipping =
    shippingCalc && !shippingCalc.is_free_shipping && shippingCalc.amount_to_free_shipping != null
      ? Math.ceil(shippingCalc.amount_to_free_shipping)
      : null

  const updateField = <K extends keyof CheckoutFormValues>(
    field: K,
    value: CheckoutFormValues[K],
  ) => setFormData((current) => ({ ...current, [field]: value }))

  // Read the cart's fingerprint for "is this discount still current?" checks.
  // With the real Zustand store this reads the live cart SYNCHRONOUSLY (so a
  // verification resolving before a passive effect flush still sees the newest
  // quantity). Some test harnesses stub the store with a static fixture that
  // has no getState — fall back to the rendered cart in that case (which is
  // identical because the fixture never changes during the test).
  const liveCartFingerprint = useCallback(() => {
    const store = useCartStore as unknown as { getState?: () => { cart: CartItem[] } }
    const cartForFingerprint = store.getState ? store.getState().cart : cart
    return cartContentsFingerprint(cartForFingerprint)
  }, [cart])

  interface VerifyCouponResponse {
  valid: boolean
  code: string
  discount_type: string | null
  discount_percentage: number | null
  discount_amount: number
  discounted_subtotal: number
  message: string
}

const applyCode = useCallback(async (
  rawCode: string,
  { silent = false }: { silent?: boolean } = {},
) => {
  const code = rawCode.trim().toUpperCase()
  if (!code) {
    if (!silent) toast.error("Please enter a discount code.")
    return
  }
  if (discountLoadingRef.current) {
    // A verification is already in flight. A silent revalidation of the
    // currently-active discount code that reaches here is remembered so it
    // re-runs against the latest cart as soon as the current request finishes
    // — otherwise a cart change during an in-flight request would never be
    // re-verified and the displayed discount could go stale. Keyed off the
    // active flow (auto-welcome OR last accepted code) so the very first
    // in-flight welcome verification is also covered.
    if (silent) {
      const active = activeAutoWelcomeRef.current || appliedCodeRef.current
      if (active && code === active) {
        pendingRevalidateRef.current = code
      }
    }
    return
  }

  // A manual coupon (different from the saved welcome code) stops the
  // automatic welcome flow so it can never overwrite the manual coupon.
  const visitorId = readCookie(VISITOR_COOKIE) || undefined
  const manualSaved = loadWelcomeCoupon(readCookie(VISITOR_COOKIE)) || null
  if (!silent && manualSaved && code !== manualSaved) {
    activeAutoWelcomeRef.current = ""
  }

  discountLoadingRef.current = true
  const seq = ++verifySeqRef.current
  // Snapshot the cart this verification was dispatched for, and whether the
  // request belongs to the active automatic welcome flow. If the cart changes
  // while the request is in flight, its response is stale and must not update
  // the visible discount (or show toasts) — the queued revalidation in
  // `finally` re-verifies against the latest cart instead.
  const startFingerprint = cartContentsFingerprint(cart)
  // True when this verification (welcome OR manual) was dispatched for a cart
  // older than the one currently in the store (the cart changed mid-flight).
  // The current cart is read SYNCHRONOUSLY from the Zustand store at response
  // time — not from a passively-updated ref — so a verification that resolves
  // before React's effect flush still sees the live cart. A stale response
  // must never update the visible discount because it belongs to a
  // superseded cart — the revalidation queued in `finally` re-verifies the
  // LATEST cart instead.
  const isStale = () =>
    startFingerprint !== "" &&
    startFingerprint !== liveCartFingerprint()
  try {
    // Send the actual cart line detail (product/variant/total) so the
    // preview is consistent with the server-side order-creation pricing:
    // a discount scoped to specific products/variants is only shown as valid
    // when it really applies to the items in this cart.
    const items = cart.map((item) => ({
      product_id: Number(item.id),
      variant_id: item.variantId != null ? Number(item.variantId) : undefined,
      total_price: Number((item.price * item.quantity).toFixed(2)),
    }))
    const result = await api.post<VerifyCouponResponse, { code: string; subtotal: number; items: typeof items; visitor_id?: string }>(
      "/discounts/public/verify-coupon",
      { code, subtotal: cartSubtotal, items, ...(visitorId ? { visitor_id: visitorId } : {}) },
      { auth: false },
    )
    // A newer verification (higher sequence) has already been issued, so this
    // response is for a superseded cart state — never let it overwrite state.
    if (seq !== verifySeqRef.current) return
    // A verification whose cart changed while it was in flight is STALE: never
    // update the visible discount or show toasts for it (e.g. "invalid" for the
    // old cart) — an older response must never clobber discount state computed
    // for a newer quantity. Applies to welcome AND manual codes.
    if (isStale()) return
    // Accepted response: this discount is now valid for the LIVE current cart.
    // Recording the fingerprint here (with the state update) is what lets the
    // render pass below detect a subsequent quantity change as "stale" until
    // the follow-up revalidation response lands.
    setValidatedFingerprint(liveCartFingerprint())
    setDiscountRefreshTick((t) => t + 1)
    if (result.valid) {
      setAppliedDiscount(result.discount_amount)
      setAppliedDiscountCode(result.code || code)
      appliedCodeRef.current = result.code || code
      if (!silent) toast.success(result.message || `${code} applied.`)
    } else {
      setAppliedDiscount(0)
      setAppliedDiscountCode("")
      appliedCodeRef.current = ""
      if (!silent) toast.error(result.message || "That discount code is not valid.")
    }
  } catch {
    if (!isStale() && seq === verifySeqRef.current) {
      setValidatedFingerprint(liveCartFingerprint())
      setAppliedDiscount(0)
      setAppliedDiscountCode("")
      appliedCodeRef.current = ""
      if (!silent) toast.error("Could not verify the discount code right now. Please try again.")
    }
  } finally {
    discountLoadingRef.current = false
    // If a silent revalidation was queued while a request was in flight, run it
    // now for the LATEST cart so the shown discount always matches the cart.
    // Keyed off the active flow (auto-welcome OR last accepted manual code) and
    // guarded so a code that was invalidated is not re-verified afterwards.
    const queued = pendingRevalidateRef.current
    if (queued) {
      pendingRevalidateRef.current = null
      const active = activeAutoWelcomeRef.current || appliedCodeRef.current
      if (active && queued === active) {
        void applyCodeRef.current?.(queued, { silent: true })
      }
    }
  }
}, [cart, cartSubtotal, liveCartFingerprint])

const handleApplyDiscount = () => {
  void applyCode(formData.discountCode)
}

  // Keep the latest applyCode reachable for the auto-apply effect below so
  // that effect can run only on cart changes without stale closures.
  useEffect(() => {
    applyCodeRef.current = applyCode
  }, [applyCode])

  // Auto-apply the saved welcome coupon once on mount, and re-verify the
  // CURRENTLY ACTIVE discount code (welcome OR manual) on every cart-content
  // change so the shown discount always tracks the latest quantity. Runs again
  // whenever the cart fingerprint changes; autoAppliedRef guarantees exactly
  // one initial welcome verification. Silent revalidation covers both flows:
  //  - auto-welcome: re-verify the saved welcome code while its flow is active
  //  - manual code: re-verify the last accepted non-welcome code (previously
  //    this was never refreshed after a quantity change and could stay stale)
  const fingerprint = cartContentsFingerprint(cart)
  useEffect(() => {
    const visitor = readCookie(VISITOR_COOKIE)
    const saved = loadWelcomeCoupon(visitor) || null
    if (cart.length === 0) return
    if (!autoAppliedRef.current) {
      autoAppliedRef.current = true
      // The automatic welcome flow is now active. Setting this separately from
      // appliedCodeRef means a cart change during the very first (still
      // in-flight) verification still triggers a revalidation of the LATEST
      // cart — even though appliedCodeRef has not been populated yet.
      activeAutoWelcomeRef.current = saved || ""
      if (saved && !appliedCodeRef.current) {
        setFormData((current) => ({ ...current, discountCode: saved }))
        void applyCodeRef.current?.(saved, {})
      }
      return
    }
    const active = activeAutoWelcomeRef.current || appliedCodeRef.current
    if (!active) return
    void applyCodeRef.current?.(active, { silent: true })
  }, [fingerprint, cart.length])


  const fieldAriaProps = (key: CheckoutFieldKey) => ({
    "aria-invalid": fieldErrors[key] ? ("true" as const) : undefined,
    "aria-describedby": fieldErrors[key] ? `checkout-error-${key}` : undefined,
  })

  const handleSubmitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading || pendingRef.current) return
    // Never place an order before the authoritative shipping amount arrived.
    if (!shippingCalc) {
      setSubmitError("One moment — we are still calculating your shipping cost.")
      return
    }

    const totals = {
      subtotal: discountedSubtotal,
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

    const payload = buildGuestOrderPayload(
      formData,
      cart,
      totals,
      appliedDiscountCode,
      readCookie(VISITOR_COOKIE) || "",
    )

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
      try {
        window.sessionStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({ orderNumber: parsed.orderNumber, placedAt: Date.now() }),
        )
      } catch {
        // Best-effort persistence; the in-memory confirmation still shows.
      }
      clearCart()
      // A successful order means the first-time welcome offer is spent; drop
      // the saved coupon reference so it is not auto-filled next time. (The
      // backend authoritatively consumes/expires the welcome coupon server-side
      // in the same transaction as the order.)
      clearWelcomeCoupon()
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
            ✅ Order placed successfully
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">
            Thank you for your order
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            Your Cash on Delivery order has been received. Our team will contact you to confirm it before processing.
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-[10px] bg-slate-50 px-4 py-3 text-sm">
            Order reference: <strong className="text-amber-800">{completedOrderId}</strong>
          </div>
          <Link
            href="/products"
            data-allow-navigation
            onClick={() => {
              try {
                window.sessionStorage.removeItem(LAST_ORDER_KEY)
              } catch {}
            }}
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
                <strong className="text-sm text-amber-800">{shippingCalc ? (finalShippingFee ? `Rs.${finalShippingFee}` : "Free") : "…"}</strong>
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
            <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              {cart.map((item) => (
                <div key={`${item.id}-${item.color || "default"}`} className="flex items-center gap-3">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-neutral-200 bg-slate-50">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                    <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">{item.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="line-clamp-2 block text-sm leading-5">{item.title}</strong>
                    {item.color ? <span className="mt-1 block text-xs text-neutral-500">Color: {item.color}</span> : null}
                    <span className="mt-1.5 inline-flex items-center border border-neutral-300 rounded-[5px] overflow-hidden bg-white">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        &minus;
                      </button>
                      <span className="w-6 text-center text-xs font-semibold text-zinc-950">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-black hover:bg-gray-100"
                      >
                        &#43;
                      </button>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className="block text-sm">Rs.{(item.price * item.quantity).toLocaleString("en-PK")}</strong>
                    <button
                      type="button"
                      aria-label="Remove item"
                      title="Remove item"
                      onClick={() => removeFromCart(item)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-red-600"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </span>
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
              <div className="flex justify-between"><span className="flex items-center gap-1 text-neutral-600">Shipping <Question className="h-4 w-4" /></span><strong>{shippingCalc ? (finalShippingFee ? `Rs.${finalShippingFee.toLocaleString("en-PK")}` : "Free") : "…"}</strong></div>
              {(appliedDiscount > 0 || appliedDiscountCode) && discountIsStale ? (
                <div className="flex justify-between text-neutral-500">
                  <span className="flex items-center gap-1">Discount <SpinnerIcon className="h-3.5 w-3.5 animate-spin" /></span>
                  <strong>Recalculating…</strong>
                </div>
              ) : appliedDiscount ? (
                <div className="flex justify-between text-green-700"><span>Discount</span><strong>-Rs.{appliedDiscount.toLocaleString("en-PK")}</strong></div>
              ) : null}
              {amountToFreeShipping != null && amountToFreeShipping > 0 ? (
                <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Add Rs.{amountToFreeShipping.toLocaleString("en-PK")} more to get FREE shipping.
                </p>
              ) : null}
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
                disabled={loading || !shippingCalc}
                aria-busy={loading}
                className="mt-1 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[10px] bg-amber-800 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LockKey className="h-5 w-5" />{!shippingCalc ? "Calculating shipping…" : loading ? "Placing order..." : "Place order"}
              </button>
              <p className="text-center text-xs leading-5 text-neutral-500">By placing your order, you agree to our <Link href="/terms-of-service" className="underline">terms</Link> and <Link href="/refund-policy" className="underline">refund policy</Link>.</p>
            </div>
          </aside>
        </form>
      </div>

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-white px-10 py-8 shadow-xl">
            <SpinnerIcon className="h-10 w-10 animate-spin text-amber-800" />
            <p className="text-sm font-semibold text-neutral-700">Placing your order… do not leave this page.</p>
          </div>
        </div>
      ) : null}
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
