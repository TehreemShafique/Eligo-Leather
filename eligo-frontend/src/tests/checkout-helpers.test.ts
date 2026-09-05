import { describe, expect, it } from "vitest"
import {
  buildGuestOrderPayload,
  parseOrderResponse,
  type CheckoutFormValues,
  type CheckoutTotals,
} from "@/app/checkout/checkout-helpers"
import type { CartItem } from "@/modules/cart/store"

const validForm: CheckoutFormValues = {
  email: "",
  emailNews: false,
  country: "Pakistan",
  firstName: "Ali",
  lastName: "Raza",
  address: "House 1, Street 2",
  city: "Islamabad",
  postalCode: "44000",
  phone: "0300 1234567",
  saveInfo: false,
  shippingMethod: "standard",
  paymentMethod: "cod",
  discountCode: "",
}

const cart: CartItem[] = [
  { id: 1, title: "Test Wallet", price: 1500, quantity: 1, image: "/wallet.jpg" },
]

const totals: CheckoutTotals = { subtotal: 1500, shippingCost: 0, total: 1500 }

describe("parseOrderResponse", () => {
  it("accepts a success response with an order number", () => {
    expect(
      parseOrderResponse({ status: "success", order_id: 1341, order_number: "#1341" }),
    ).toEqual({ ok: true, orderNumber: "#1341" })
  })

  it("falls back to the order id when the order number is missing", () => {
    expect(parseOrderResponse({ status: "success", order_id: 42 })).toEqual({
      ok: true,
      orderNumber: "#42",
    })
  })

  it("rejects a zero order id", () => {
    expect(parseOrderResponse({ status: "success", order_id: 0 })).toEqual({ ok: false })
  })

  it("rejects a negative order id", () => {
    expect(parseOrderResponse({ status: "success", order_id: -3 })).toEqual({ ok: false })
  })

  it("rejects a non-integer order id", () => {
    expect(parseOrderResponse({ status: "success", order_id: 2.5 })).toEqual({ ok: false })
  })

  it("rejects responses without any order identifier", () => {
    expect(parseOrderResponse({ status: "success" })).toEqual({ ok: false })
  })

  it("rejects malformed payloads and non-success statuses", () => {
    expect(parseOrderResponse({ unexpected: true })).toEqual({ ok: false })
    expect(parseOrderResponse({ status: "error", order_id: 5 })).toEqual({ ok: false })
  })
})

describe("buildGuestOrderPayload contract guard", () => {
  it("sends exactly the fields the current backend endpoint accepts", () => {
    const payload = buildGuestOrderPayload(validForm, cart, totals)

    expect(Object.keys(payload).sort()).toEqual(
      [
        "channel",
        "city",
        "country",
        "currency",
        "destination",
        "email",
        "first_name",
        "items",
        "last_name",
        "note",
        "payment_status",
        "delivery_status",
        "fulfillment_status",
        "phone",
        "postal_code",
        "shipping_address",
        "shipping_cost",
        "subtotal",
        "tax",
        "total_price",
      ].sort(),
    )
  })

  it("never emits unsupported fields such as order ids or billing addresses", () => {
    const payload = buildGuestOrderPayload(validForm, cart, totals)
    const serialized = JSON.stringify(payload)

    expect(payload).not.toHaveProperty("order_id")
    expect(payload).not.toHaveProperty("billing_address")
    // The shipping address is the street address only: customer name and
    // phone travel in their own structured fields and must not appear here.
    expect(payload.shipping_address).toBe(
      "House 1, Street 2, Islamabad, 44000, Pakistan",
    )
    expect(payload.shipping_address).not.toContain("Ali")
    expect(payload.shipping_address).not.toContain("0300")
    expect(serialized).not.toContain("billing")
  })

  it("emits discount_code only when a discount was applied", () => {
    const withDiscount = buildGuestOrderPayload(validForm, cart, totals, "SAVE10")
    expect(withDiscount).toMatchObject({ discount_code: "SAVE10" })

    const withoutDiscount = buildGuestOrderPayload(validForm, cart, totals, "")
    expect(withoutDiscount).not.toHaveProperty("discount_code")
  })
})
