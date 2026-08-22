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

const { clearCartMock } = vi.hoisted(() => ({ clearCartMock: vi.fn() }))

vi.mock("@/context/cart-context", () => ({
  useCart: () => ({
    cart: [
      { id: 1, title: "Test Wallet", price: 1500, quantity: 1, color: "Black", image: "/wallet.jpg" },
      { id: 2, title: "Test Belt", price: 1000, quantity: 2, image: "/belt.jpg" },
    ],
    cartCount: 3,
    cartSubtotal: 3500,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: clearCartMock,
  }),
}))

vi.mock("next/image", async () => {
  const ReactModule = await import("react")
  return {
    default: (props: Record<string, unknown>) => ReactModule.createElement("img", props),
  }
})

const postMock = vi.mocked(api.post)

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
  vi.clearAllMocks()
})

describe("CheckoutPage guest order submission", () => {
  it("shows the real backend order number and clears the cart exactly once on success", async () => {
    const user = userEvent.setup()
    postMock.mockResolvedValueOnce({
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
    expect(postMock).toHaveBeenCalledTimes(1)

    const [, payload] = postMock.mock.calls[0]
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
      product_name: "Test Wallet",
      variant_title: "Black",
      quantity: 1,
      unit_price: 1500,
      total_price: 1500,
    })
    expect(items[1]).toEqual({
      product_name: "Test Belt",
      variant_title: "Standard",
      quantity: 2,
      unit_price: 1000,
      total_price: 2000,
    })
    // No fake client-side order id may be sent.
    expect(payload).not.toHaveProperty("order_id")
    expect(JSON.stringify(payload)).not.toContain("ORD-")
  })

  it("shows failure, preserves form and cart, and re-enables submission when the request is rejected", async () => {
    const user = userEvent.setup()
    postMock.mockRejectedValueOnce(new ApiError(500, "Database unavailable"))

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
    expect(postMock).toHaveBeenCalledTimes(2)
  })

  it("treats a malformed HTTP 200 response as failure and keeps the cart", async () => {
    const user = userEvent.setup()
    postMock.mockResolvedValueOnce({ unexpected: true })

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
    postMock.mockImplementation(() => new Promise(() => {}))

    render(<CheckoutPage />)
    await fillValidForm(user)

    const form = document.querySelector("form")
    expect(form).not.toBeNull()

    fireEvent.submit(form as HTMLFormElement)
    fireEvent.submit(form as HTMLFormElement)

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(getPlaceOrderButton()).toBeDisabled()
  })

  it("rejects an invalid optional email without calling the API", async () => {
    const user = userEvent.setup()
    render(<CheckoutPage />)

    await fillValidForm(user)
    await user.type(screen.getByPlaceholderText("Email address (optional)"), "not-an-email")
    await user.click(getPlaceOrderButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter a valid email address/i)
    expect(postMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/thank you for your order/i)).not.toBeInTheDocument()
  })

  it("does not collect a separate billing address while backend support is absent", () => {
    render(<CheckoutPage />)

    expect(screen.queryByText(/use a different billing address/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/billing/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: /billing/i })).not.toBeInTheDocument()
  })
})
