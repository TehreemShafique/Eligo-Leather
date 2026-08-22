import { z } from "zod"
import type { CartItem } from "@/context/cart-context"

export interface CheckoutFormValues {
  email: string
  emailNews: boolean
  country: string
  firstName: string
  lastName: string
  address: string
  city: string
  postalCode: string
  phone: string
  saveInfo: boolean
  shippingMethod: string
  paymentMethod: string
  discountCode: string
}

export const defaultCheckoutFormValues: CheckoutFormValues = {
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
  shippingMethod: "standard",
  paymentMethod: "cod",
  discountCode: "",
}

export type CheckoutFieldKey =
  | "email"
  | "firstName"
  | "lastName"
  | "address"
  | "city"
  | "phone"

export type CheckoutErrorKey = CheckoutFieldKey | "cart" | "totals"

export type CheckoutFieldErrors = Partial<Record<CheckoutErrorKey, string>>

/** Display order used to focus the first invalid field. */
export const CHECKOUT_FIELD_ORDER: CheckoutFieldKey[] = [
  "email",
  "firstName",
  "lastName",
  "address",
  "city",
  "phone",
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Documented Pakistani mobile formats after normalization:
 * `03XXXXXXXXX` and `+923XXXXXXXXX` (spaces/hyphens allowed before normalizing).
 */
const PAKISTAN_MOBILE_PATTERN = /^(?:\+92|0)3\d{9}$/

export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[\s()\u2013\u2014-]/g, "")
}

export function isValidPakistanMobileNumber(normalized: string): boolean {
  return PAKISTAN_MOBILE_PATTERN.test(normalized)
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function isFinitePositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

export interface CheckoutTotals {
  subtotal: number
  shippingCost: number
  total: number
}

export function validateCheckoutFields(
  form: CheckoutFormValues,
  cart: CartItem[],
  totals: CheckoutTotals,
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {}

  if (cart.length === 0) {
    errors.cart = "Your cart is empty."
  } else {
    for (const item of cart) {
      if (!isPositiveInteger(item.quantity)) {
        errors.cart = "One of your cart items has an invalid quantity. Please review your cart."
        break
      }
      if (!isFinitePositiveNumber(item.price)) {
        errors.cart = "One of your cart items has an invalid price. Please review your cart."
        break
      }
    }
  }

  if (!form.firstName.trim()) errors.firstName = "First name is required."
  if (!form.lastName.trim()) errors.lastName = "Last name is required."
  if (!form.address.trim()) errors.address = "Delivery address is required."
  if (!form.city.trim()) errors.city = "City is required."

  const trimmedPhone = form.phone.trim()
  if (!trimmedPhone) {
    errors.phone = "Phone number is required."
  } else if (!isValidPakistanMobileNumber(normalizePhoneNumber(trimmedPhone))) {
    errors.phone = "Enter a valid Pakistani mobile number, e.g. 03001234567 or +923001234567."
  }

  const trimmedEmail = form.email.trim()
  if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address or leave this field empty."
  }

  if (!isFinitePositiveNumber(totals.subtotal)) {
    errors.totals = "The order subtotal could not be calculated. Please review your cart."
  } else if (!Number.isFinite(totals.shippingCost) || totals.shippingCost < 0) {
    errors.totals = "The shipping cost could not be calculated. Please review your order."
  } else if (!isFinitePositiveNumber(totals.total)) {
    errors.totals = "The order total could not be calculated. Please review your cart."
  }

  return errors
}

/**
 * Response contract of the public guest-order endpoint
 * (`POST /api/v1/orders/create-order`). Kept in one place so it can be
 * replaced when the backend ships a structured guest-order contract.
 */
const orderApiResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  order_id: z.number().int().positive().optional(),
  order_number: z.string().optional(),
})

export type OrderApiResponse = z.infer<typeof orderApiResponseSchema>

export type ParsedOrderResponse =
  | { ok: true; orderNumber: string }
  | { ok: false }

/**
 * A response counts as successful only when it parses against the schema,
 * reports `status === "success"` AND carries a real order identifier.
 * Malformed HTTP 200 bodies therefore resolve to `{ ok: false }`.
 */
export function parseOrderResponse(payload: unknown): ParsedOrderResponse {
  const result = orderApiResponseSchema.safeParse(payload)
  if (!result.success) return { ok: false }

  const data = result.data
  if (data.status !== "success") return { ok: false }

  const trimmedOrderNumber =
    typeof data.order_number === "string" ? data.order_number.trim() : ""
  if (trimmedOrderNumber) {
    return { ok: true, orderNumber: trimmedOrderNumber }
  }

  if (typeof data.order_id === "number" && Number.isFinite(data.order_id)) {
    return { ok: true, orderNumber: `#${data.order_id}` }
  }

  return { ok: false }
}

export interface GuestOrderItemPayload {
  product_name: string
  variant_title: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface GuestOrderPayload {
  channel: string
  currency: string
  subtotal: number
  shipping_cost: number
  tax: number
  total_price: number
  payment_status: "pending"
  fulfillment_status: "unfulfilled"
  delivery_status: "pending"
  shipping_address: string
  note: string
  destination: string
  items: GuestOrderItemPayload[]
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Builds the guest-order request payload using the field names the current
 * public endpoint actually accepts. The backend has no structured guest
 * name/email/phone columns yet, so the customer name and phone travel inside
 * `shipping_address` and an optional email inside `note`. No fallback email
 * is ever invented. Replace this helper once the structured contract exists.
 */
export function buildGuestOrderPayload(
  form: CheckoutFormValues,
  cart: CartItem[],
  totals: CheckoutTotals,
): GuestOrderPayload {
  const customerName = `${form.firstName.trim()} ${form.lastName.trim()}`
    .replace(/\s+/g, " ")
    .trim()
  const phone = normalizePhoneNumber(form.phone.trim())
  const country = form.country.trim() || "Pakistan"

  const shippingAddressParts = [
    form.address.trim(),
    form.city.trim(),
    form.postalCode.trim(),
    country,
  ].filter(Boolean)

  const contactEmail = form.email.trim()

  return {
    channel: "Online Store",
    currency: "PKR",
    subtotal: round2(totals.subtotal),
    shipping_cost: round2(totals.shippingCost),
    tax: 0,
    total_price: round2(totals.total),
    payment_status: "pending",
    fulfillment_status: "unfulfilled",
    delivery_status: "pending",
    shipping_address: `${customerName} | Phone: ${phone} | ${shippingAddressParts.join(", ")}`,
    note: contactEmail ? `Contact email: ${contactEmail}` : "",
    destination: country,
    items: cart.map((item) => ({
      product_name: item.title,
      variant_title: item.color && item.color.trim() ? item.color.trim() : "Standard",
      quantity: item.quantity,
      unit_price: round2(item.price),
      total_price: round2(item.price * item.quantity),
    })),
  }
}
