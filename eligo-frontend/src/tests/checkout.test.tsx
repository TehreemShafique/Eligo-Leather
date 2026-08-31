import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CheckoutPage from "@/app/checkout/page"
import { ApiError, api } from "@/lib/api-client"

vi.mock("@/lib/api-client", () => {
  class MockApiError extends Error {
    status: number
    detail: unknown
    constructor(status: number, detail: unknown) {
      super(typeof detail === "string" ? detail : "Request failed")
      this.name = "ApiError"
      this.status = status
      this.detail = detail
    }
  }
  return {
    ApiError: MockApiError,
    api: { post: vi.fn() },
    getApiErrorMessage: (error: unknown) =>
      error instanceof Error ? error.message : "Something went wrong",
  }
})

const { clearCartMock, cartStoreFixture } = vi.hoisted(() => {
  const clearCartMock = vi.fn()
  const cartStoreFixture = {
    cart: [
      { id: 1, title: "Test Wallet", price: 1500, quantity: 1, color: "Black", image: "/wallet.jpg", variantId: 11 },
      { id: 2, title: "Test Belt", price: 1000, quantity: 2, image: "/belt.jpg" },
    ],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: clearCartMock,
  }
  return { clearCartMock, cartStoreFixture }
})

// Selector-aware mock: every call receives a selector and must resolve it
// against the fixture instead of handing back the whole store.
vi.mock("@/modules/cart/store", () => ({
  selectCart: (state: typeof cartStoreFixture) => state.cart,
  selectCartCount: (state: typeof cartStoreFixture) =>
    state.cart.reduce((total, item) => total + item.quantity, 0),
  selectCartSubtotal: (state: typeof cartStoreFixture) =>
    state.cart.reduce((total, item) => total + item.price * item.quantity, 0),
  useCartStore: (selector: (state: typeof cartStoreFixture) => unknown) =>
    selector(cartStoreFixture),
}))

vi.mock("next/image", async () => {
  const ReactModule = await import("react")
  return {
    default: (props: Record<string, unknown>) => ReactModule.createElement("img", props),
  }
})

const postMock = vi.mocked(api.post)

// The page fetches the server-authoritative shipping calculation on mount.
// Free-shipping (cost 0) keeps the order payload independent of the carrier fee.
const SHIPPING_CALC = {
  currency: "PKR",
  subtotal: 3500,
  shipping_charge: 250,
  free_shipping_threshold: 4000,
  shipping_cost: 0,
  is_free_shipping: true,
  amount_to_free_shipping: null,
}

const ORDER_PATH = "/orders/create-order"

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("First name *"), "Ali")
  await user.type(screen.getByPlaceholderText("Last name *"), "Raza")
  await user.type(screen.getByPlaceholderText("House, street and area *"), "House 1, Street 2")
  await user.type(screen.getByPlaceholderText("City *"), "Islamabad")
  await user.type(screen.getByPlaceholderText("Phone number *"), "0300 1234567")
}

function getPlaceOrderButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: /placing order\.\.\.|place order/i,
  }) as HTMLButtonElement
}

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  vi.clearAllMocks()
})

describe("CheckoutPage guest order submission", () => {
  it("shows the real backend order number and clears the cart exactly once on success", async () => {
    const user = userEvent.setup()
    postMock
      .mockResolvedValueOnce(SHIPPING_CALC)
      .mockResolvedValueOnce({
        status: "success",
        message: "Order #1341 created successfully in database!",
        order_id: 1341,
        order_number: "#1341",
      })

    render(<CheckoutPage />)
    await fillValidForm(user)
    await user.click(getPlaceOrderButton())

    await waitFor(() => {
      expect(screen.getByText(/thank you for your order/i)).toBeInTheDocument()
    })

    expect(screen.getByText("#1341")).toBeInTheDocument()
    expect(clearCartMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledTimes(2)

    const [, payload] = postMock.mock.calls[1]
    expect(payload).toMatchObject({
      channel: "Online Store",
      currency: "PKR",
      subtotal: 3500,
      shipping_cost: 0,
      tax: 0,
      total_price: 3500,
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      delivery_status: "pending",
    })
    const items = (payload as { items: Array<Record<string, unknown>> }).items
    expect(items[0]).toEqual({
      product_id: 1,
      variant_id: 11,
      product_name: "Test Wallet",
      variant_title: "Black",
      quantity: 1,
      unit_price: 1500,
      total_price: 1500,
    })
    expect(items[1]).toEqual({
      product_id: 2,
      variant_id: undefined,
      product_name: "Test Belt",
      variant_title: "Standard",
      quantity: 2,
      unit_price: 1000,
      total_price: 2000,
    })
    // No fake client-side order id may be sent.
    expect(payload).not.toHaveProperty("order_id")
    expect(JSON.stringify(payload)).not.toContain("ORD-")

    // The location is the street address only: customer name and phone must
    // never be embedded in the shipping address string.
    const typedPayload = payload as Record<string, unknown>
    expect(typedPayload).toMatchObject({
      shipping_address: "House 1, Street 2, Islamabad, Pakistan",
    })
    const shippingAddress = String(typedPayload.shipping_address)
    expect(shippingAddress).not.toContain("Ali")
    expect(shippingAddress).not.toContain("0300")
  })

  it("restores a previously placed order confirmation so it is never lost after navigation", async () => {
    postMock.mockResolvedValueOnce(SHIPPING_CALC)
    window.sessionStorage.setItem(
      "eligo_last_order",
      JSON.stringify({ orderNumber: "#2048", placedAt: Date.now() }),
    )
    render(<CheckoutPage />)

    expect(await screen.findByText(/order placed successfully/i)).toBeInTheDocument()
    expect(screen.getByText("#2048")).toBeInTheDocument()
    const orderCalls = postMock.mock.calls.filter(([path]) => path === ORDER_PATH)
    expect(orderCalls).toHaveLength(0)
  })

  it("applies a valid admin promo code to the subtotal and forwards it with the order", async () => {
    const user = userEvent.setup()
    postMock
      .mockResolvedValueOnce(SHIPPING_CALC)
      .mockResolvedValueOnce({
        valid: true,
        code: "SAVE10",
        discount_type: "percentage",
        discount_percentage: 10,
        discount_amount: 350,
        discounted_subtotal: 3150,
        message: "10% discount applied with code SAVE10! You saved Rs. 350.00.",
      })
      .mockResolvedValueOnce({ status: "success", order_id: 2222, order_number: "#1344" })

    render(<CheckoutPage />)
    await fillValidForm(user)
    await user.type(screen.getByPlaceholderText(/discount code/i), "SAVE10")
    await user.click(screen.getByRole("button", { name: /apply/i }))

    await waitFor(() => {
      expect(screen.getByText("-Rs.350")).toBeInTheDocument()
    })

    await user.click(getPlaceOrderButton())
    await waitFor(() => {
      expect(screen.getByText(/thank you for your order/i)).toBeInTheDocument()
    })

    const orderCall = postMock.mock.calls.find(([path]) => path === ORDER_PATH)
    expect(orderCall).toBeDefined()
    const payload = orderCall![1] as Record<string, unknown>
    expect(payload).toMatchObject({
      subtotal: 3150,
      shipping_cost: 0,
      total_price: 3150,
      discount_code: "SAVE10",
    })
  })

  it("rejects an unknown promo code without applying a discount", async () => {
    const user = userEvent.setup()
    postMock
      .mockResolvedValueOnce(SHIPPING_CALC)
      .mockResolvedValueOnce({
        valid: false,
        code: "NOPE",
        discount_type: null,
        discount_percentage: null,
        discount_amount: 0,
        discounted_subtotal: 3500,
        message: "Discount code 'NOPE' is not valid.",
      })

    render(<CheckoutPage />)
    await fillValidForm(user)
    await user.type(screen.getByPlaceholderText(/discount code/i), "NOPE")
    await user.click(screen.getByRole("button", { name: /apply/i }))

    await waitFor(() => {
      expect(
        postMock.mock.calls.some(([path, body]) => {
          const b = body as { code?: string }
          return path === "/discounts/public/verify-coupon" && b?.code === "NOPE"
        }),
      ).toBe(true)
    })
    // No discount applied, no order placed.
    expect(screen.queryByText(/^-Rs\./)).not.toBeInTheDocument()
    const orderCalls = postMock.mock.calls.filter(([path]) => path === ORDER_PATH)
    expect(orderCalls).toHaveLength(0)
  })

  it("shows failure, preserves form and cart, and re-enables submission when the request is rejected", async () => {
    const user = userEvent.setup()
    postMock
      .mockResolvedValueOnce(SHIPPING_CALC)
      .mockRejectedValueOnce(new ApiError(500, "Database unavailable"))

    render(<CheckoutPage />)
    await fillValidForm(user)
    await user.click(getPlaceOrderButton())

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/order not placed/i)
    expect(alert).toHaveTextContent(/database unavailable/i)

    expect(screen.queryByText(/thank you for your order/i)).not.toBeInTheDocument()
    expect(clearCartMock).not.toHaveBeenCalled()

    const firstName = screen.getByPlaceholderText("First name *") as HTMLInputElement
    expect(firstName).toHaveValue("Ali")

    const button = getPlaceOrderButton()
    expect(button).toBeEnabled()

    postMock.mockResolvedValueOnce({ status: "success", order_id: 9, order_number: "#1342" })
    await user.click(button)
    await waitFor(() => {
      expect(screen.getByText(/thank you for your order/i)).toBeInTheDocument()
    })
    expect(screen.getByText("#1342")).toBeInTheDocument()
    expect(postMock).toHaveBeenCalledTimes(3)
  })

  it("treats a malformed HTTP 200 response as failure and keeps the cart", async () => {
    const user = userEvent.setup()
    postMock
      .mockResolvedValueOnce(SHIPPING_CALC)
      .mockResolvedValueOnce({ unexpected: true })

    render(<CheckoutPage />)
    await fillValidForm(user)
    await user.click(getPlaceOrderButton())

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/order not placed/i)
    expect(screen.queryByText(/thank you for your order/i)).not.toBeInTheDocument()
    expect(clearCartMock).not.toHaveBeenCalled()
  })

  it("blocks rapid duplicate submissions so the API is called only once", async () => {
    const user = userEvent.setup()
    postMock.mockImplementation((path: string) =>
      path === "/shipping/calculate"
        ? Promise.resolve(SHIPPING_CALC)
        : new Promise(() => {}),
    )

    render(<CheckoutPage />)
    await fillValidForm(user)

    const form = document.querySelector("form")
    expect(form).not.toBeNull()

    fireEvent.submit(form as HTMLFormElement)
    fireEvent.submit(form as HTMLFormElement)

    const orderCalls = postMock.mock.calls.filter(([path]) => path === ORDER_PATH)
    expect(orderCalls).toHaveLength(1)
    expect(getPlaceOrderButton()).toBeDisabled()
  })

  it("rejects an invalid optional email without calling the API", async () => {
    const user = userEvent.setup()
    postMock.mockResolvedValue(SHIPPING_CALC)
    render(<CheckoutPage />)

    await fillValidForm(user)
    await user.type(screen.getByPlaceholderText("Email address (optional)"), "not-an-email")
    await user.click(getPlaceOrderButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter a valid email address/i)
    const orderCalls = postMock.mock.calls.filter(([path]) => path === ORDER_PATH)
    expect(orderCalls).toHaveLength(0)
    expect(screen.queryByText(/thank you for your order/i)).not.toBeInTheDocument()
  })

  it("does not collect a separate billing address while backend support is absent", () => {
    render(<CheckoutPage />)

    expect(screen.queryByText(/use a different billing address/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/billing/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: /billing/i })).not.toBeInTheDocument()
  })
})
