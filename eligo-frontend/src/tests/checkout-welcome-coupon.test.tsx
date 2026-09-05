import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import CheckoutPage from "@/app/checkout/page"
import { api } from "@/lib/api-client"
import { useCartStore } from "@/modules/cart/store"
import { toast } from "sonner"

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

vi.mock("next/image", async () => {
  const ReactModule = await import("react")
  return {
    default: (props: Record<string, unknown>) => ReactModule.createElement("img", props),
  }
})

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const postMock = vi.mocked(api.post)
const toastError = vi.mocked(toast.error)
const toastSuccess = vi.mocked(toast.success)

const CART_KEY = "eligo_leather_cart"
const WELCOME_KEY = "eligo_welcome_coupon"
const VISITOR_COOKIE = "eligo_visitor_id"
const WELCOME_CODE = "WELCOME1"
const VISITOR = "visitor-test-1"
const VERIFY_PATH = "/discounts/public/verify-coupon"

const SHIPPING_CALC = {
  currency: "PKR",
  subtotal: 3000,
  shipping_charge: 250,
  free_shipping_threshold: 4000,
  shipping_cost: 0,
  is_free_shipping: true,
  amount_to_free_shipping: null,
}

const WALLET_LINE = {
  id: 1,
  title: "Test Wallet",
  price: 1500,
  quantity: 2,
  color: "Black",
  image: "/wallet.jpg",
  variantId: 11,
}

function seedWelcomeAndVisitor() {
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(VISITOR)}; path=/`
  window.localStorage.setItem(
    WELCOME_KEY,
    JSON.stringify({ code: WELCOME_CODE, visitor_id: VISITOR }),
  )
}

function seedCart() {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify({ state: { cart: [WALLET_LINE] }, version: 0 }),
  )
}

function verifyCallCount(): number {
  return postMock.mock.calls.filter(([url]) => url === VERIFY_PATH).length
}

function lastVerifyBody(): { code?: string; subtotal?: number } {
  const calls = postMock.mock.calls.filter(([url]) => url === VERIFY_PATH)
  return (calls[calls.length - 1]?.[1] ?? {}) as { code?: string; subtotal?: number }
}

beforeEach(async () => {
  // Reset cart state + stored data + mocks for a clean per-test start.
  window.localStorage.clear()
  useCartStore.setState({ cart: [] })
})

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  window.localStorage.clear()
  useCartStore.setState({ cart: [] })
  vi.clearAllMocks()
})

describe("CheckoutPage saved welcome-coupon auto-apply", () => {
  it("auto-fills and auto-applies the saved welcome coupon on mount, exactly once", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return Promise.resolve({
        valid: true,
        code: WELCOME_CODE,
        discount_type: "welcome_discount",
        discount_amount: Math.round(subtotal * 0.1),
        message: "Welcome code applied.",
      })
    })

    render(<CheckoutPage />)

    await waitFor(() => expect(verifyCallCount()).toBe(1))
    expect(lastVerifyBody().code).toBe(WELCOME_CODE)
    expect(lastVerifyBody().subtotal).toBe(3000)

    await waitFor(() =>
      expect(screen.getByPlaceholderText("Discount code")).toHaveValue(WELCOME_CODE),
    )
    // The applied discount (10% of 3000) is surfaced in the order summary.
    await waitFor(() => expect(screen.getByText("-Rs.300")).toBeInTheDocument())
    // Only one auto-verification may occur on mount.
    await new Promise((r) => setTimeout(r, 30))
    expect(verifyCallCount()).toBe(1)
  })

  it("silently revalidates the saved welcome coupon when the cart contents change", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return Promise.resolve({
        valid: true,
        code: WELCOME_CODE,
        discount_type: "welcome_discount",
        discount_amount: Math.round(subtotal * 0.1),
        message: "Welcome code applied.",
      })
    })

    render(<CheckoutPage />)
    await waitFor(() => expect(verifyCallCount()).toBe(1))

    // Change the cart (quantity 2 -> 3) while on checkout.
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
    })

    // A revalidation must be issued against the NEW cart contents.
    await waitFor(() => expect(verifyCallCount()).toBe(2))
    expect(lastVerifyBody().subtotal).toBe(4500)

    // The refreshed discount reflects the new subtotal, and it must be SILENT
    // (no error toast fired for a valid revalidation).
    await waitFor(() => expect(screen.getByText("-Rs.450")).toBeInTheDocument())
    expect(toastError).not.toHaveBeenCalled()
  })

  it("never overwrites a manually applied discount code with the saved welcome coupon", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const code = (body as { code?: string }).code
      if (code === "OTHER10") {
        return Promise.resolve({
          valid: true,
          code: "OTHER10",
          discount_type: "code",
          discount_amount: 100,
          message: "Other applied.",
        })
      }
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return Promise.resolve({
        valid: true,
        code: WELCOME_CODE,
        discount_type: "welcome_discount",
        discount_amount: Math.round(subtotal * 0.1),
        message: "Welcome code applied.",
      })
    })

    render(<CheckoutPage />)
    await waitFor(() => expect(verifyCallCount()).toBe(1))

    // Manually apply a different code via the controlled input.
    await act(async () => {
      const input = screen.getByPlaceholderText("Discount code")
      fireEvent.change(input, { target: { value: "OTHER10" } })
      screen.getByRole("button", { name: "Apply" }).click()
    })

    // The manual code is verified and applied.
    await waitFor(() => expect(verifyCallCount()).toBe(2))
    await waitFor(() => expect(screen.getByText("-Rs.100")).toBeInTheDocument())

    // Now change the cart: the ACTIVE manual code is silently revalidated
    // against the new cart (the saved welcome coupon must still never replace
    // the manual code — the revalidation is issued for OTHER10, not WELCOME1).
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
    })
    await waitFor(() => expect(verifyCallCount()).toBe(3))
    expect(lastVerifyBody().code).toBe("OTHER10")
    expect(lastVerifyBody().subtotal).toBe(4500)
    // Revalidation is silent: the fixed Rs.100 discount persists and no error
    // toast is fired for the still-valid manual code.
    await waitFor(() => expect(screen.getByText("-Rs.100")).toBeInTheDocument())
    expect(toastError).not.toHaveBeenCalled()
  })

  it("queues one revalidation so a cart change during an in-flight revalidation still ends on the LATEST cart", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    // Deferred resolvers, one per verify-coupon request in call order.
    const deferred: Array<(v: object) => void> = []
    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return new Promise<object>((resolve) => {
        deferred.push(() =>
          resolve({
            valid: true,
            code: WELCOME_CODE,
            discount_type: "welcome_discount",
            discount_amount: Math.round(subtotal * 0.1),
            message: "Welcome code applied.",
          }),
        )
      })
    })

    render(<CheckoutPage />)

    // 1) First auto-apply verification (cart A = 3000) is in flight.
    await waitFor(() => expect(verifyCallCount()).toBe(1))
    expect(lastVerifyBody().subtotal).toBe(3000)
    // Resolve it so the welcome coupon is applied (appliedCodeRef = WELCOME1).
    await act(async () => {
      deferred.shift()!({})
    })
    await waitFor(() => expect(screen.getByText("-Rs.300")).toBeInTheDocument())

    // 2) Change the cart (2 -> 3 = 4500): kicks off a silent revalidation (#2).
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
    })
    await waitFor(() => expect(verifyCallCount()).toBe(2))
    expect(lastVerifyBody().subtotal).toBe(4500)

    // 3) Change the cart AGAIN (3 -> 4 = 6000) while #2 is still in flight.
    //    The in-flight guard must NOT issue a third request yet; it queues one.
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 4)
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(verifyCallCount()).toBe(2)

    // 4) Resolve the stale (#2, cart B = 4500) request. The queued
    //    revalidation now runs against the LATEST cart (C = 6000).
    await act(async () => {
      deferred.shift()!({})
    })
    await waitFor(() => expect(verifyCallCount()).toBe(3))
    expect(lastVerifyBody().subtotal).toBe(6000)

    // 5) Resolve the cart C verification; final discount reflects cart C.
    await act(async () => {
      deferred.shift()!({})
    })
    await waitFor(() => expect(screen.getByText("-Rs.600")).toBeInTheDocument())
    expect(toastError).not.toHaveBeenCalled()
  })

  it("revalidates the LATEST cart when the cart changes during the VERY FIRST in-flight auto-apply", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    // Each verify-coupon returns a deferred promise. Passing a non-empty object
    // to the resolver overrides the (otherwise valid) default response.
    const deferred: Array<(override?: object) => void> = []
    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return new Promise<object>((resolve) => {
        deferred.push((override) =>
          resolve(
            override && Object.keys(override).length > 0
              ? override
              : {
                  valid: true,
                  code: WELCOME_CODE,
                  discount_type: "welcome_discount",
                  discount_amount: Math.round(subtotal * 0.1),
                  message: "Welcome code applied.",
                },
          ),
        )
      })
    })

    render(<CheckoutPage />)

    // 1) The FIRST automatic verification (cart A = 3000) is STILL in flight
    //    (appliedCodeRef is empty because it has not resolved yet).
    await waitFor(() => expect(verifyCallCount()).toBe(1))
    expect(lastVerifyBody().subtotal).toBe(3000)

    // 2) Customer changes the cart (2 -> 3 = 4500) before #1 resolves.
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
    })

    // 3) The in-flight guard must NOT issue a second request yet; it queues.
    await new Promise((r) => setTimeout(r, 20))
    expect(verifyCallCount()).toBe(1)

    // 4) Resolve the OLD (cart A) request.
    await act(async () => {
      deferred.shift()!()
    })

    // 5) Because the auto-welcome flow is keyed off activeAutoWelcomeRef (not
    //    the result), a NEW verification is issued against the LATEST cart B.
    await waitFor(() => expect(verifyCallCount()).toBe(2))
    expect(lastVerifyBody().subtotal).toBe(4500)

    // 6) Resolve the cart B verification; the final discount reflects cart B.
    await act(async () => {
      deferred.shift()!()
    })
    await waitFor(() => expect(screen.getByText("-Rs.450")).toBeInTheDocument())
    expect(toastError).not.toHaveBeenCalled()
  })

  it("still revalidates the latest cart even when the first old-cart auto-apply returns INVALID", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    const deferred: Array<(override?: object) => void> = []
    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return new Promise<object>((resolve) => {
        deferred.push((override) =>
          resolve(
            override && Object.keys(override).length > 0
              ? override
              : {
                  valid: true,
                  code: WELCOME_CODE,
                  discount_type: "welcome_discount",
                  discount_amount: Math.round(subtotal * 0.1),
                  message: "Welcome code applied.",
                },
          ),
        )
      })
    })

    render(<CheckoutPage />)

    // First (cart A = 3000) verification is in flight.
    await waitFor(() => expect(verifyCallCount()).toBe(1))
    expect(lastVerifyBody().subtotal).toBe(3000)

    // Change cart (2 -> 3 = 4500) while it is unresolved; only one request so far.
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(verifyCallCount()).toBe(1)

    // Resolve the OLD cart A request with INVALID. The auto-welcome flow must
    // still revalidate the latest cart (which may have different eligibility).
    await act(async () => {
      deferred.shift()!({
        valid: false,
        code: WELCOME_CODE,
        discount_type: null,
        discount_percentage: null,
        discount_amount: 0,
        discounted_subtotal: 4500,
        message: "Not valid for this cart.",
      })
    })

    // A new verification for cart B is still issued.
    await waitFor(() => expect(verifyCallCount()).toBe(2))
    expect(lastVerifyBody().subtotal).toBe(4500)

    // Resolve it; final discount reflects cart B. The STALE invalid result for
    // the old cart A must NOT have surfaced an error toast to the customer.
    await act(async () => {
      deferred.shift()!()
    })
    await waitFor(() => expect(screen.getByText("-Rs.450")).toBeInTheDocument())
    expect(toastError).not.toHaveBeenCalled()
  })

  it("treats the old verification as stale even when it resolves before a passive-effect flush", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    const deferred: Array<(override?: object) => void> = []
    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return new Promise<object>((resolve) => {
        deferred.push((override) =>
          resolve(
            override && Object.keys(override).length > 0
              ? override
              : {
                  valid: true,
                  code: WELCOME_CODE,
                  discount_type: "welcome_discount",
                  discount_amount: Math.round(subtotal * 0.1),
                  message: "Welcome code applied.",
                },
          ),
        )
      })
    })

    render(<CheckoutPage />)

    // First auto-apply verification (cart A = 3000) is in flight.
    await waitFor(() => expect(verifyCallCount()).toBe(1))
    expect(lastVerifyBody().subtotal).toBe(3000)

    // In ONE synchronous act scope: change the cart to B AND resolve the old
    // (cart A) request. This resolves before React's passive effect flush, so
    // the stale-check must read the live Zustand cart synchronously.
    await act(async () => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
      // Resolve cart A with a DISTINCTIVE result so we can prove it never gets
      // applied if it is recognised as stale.
      deferred.shift()!({
        valid: true,
        code: WELCOME_CODE,
        discount_type: "welcome_discount",
        discount_amount: 999,
        message: "Old cart result.",
      })
      await Promise.resolve()
    })

    // The stale cart-A result must NOT surface its discount or any toast.
    expect(screen.queryByText("-Rs.999")).not.toBeInTheDocument()
    expect(toastSuccess).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()

    // The auto-welcome flow still verifies against the LATEST cart (B = 4500).
    await waitFor(() => expect(verifyCallCount()).toBe(2))
    expect(lastVerifyBody().subtotal).toBe(4500)

    // Final displayed discount comes from cart B.
    await act(async () => {
      deferred.shift()!()
    })
    await waitFor(() => expect(screen.getByText("-Rs.450")).toBeInTheDocument())
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it("never shows the OLD discount/total while rapidly changing quantities (10-style stale-window check)", async () => {
    seedWelcomeAndVisitor()
    seedCart()
    await useCartStore.persist.rehydrate()

    const deferred: Array<(override?: object) => void> = []
    postMock.mockImplementation((url, body) => {
      if (url === "/shipping/calculate") return Promise.resolve(SHIPPING_CALC)
      const subtotal = Number((body as { subtotal?: number }).subtotal ?? 0)
      return new Promise<object>((resolve) => {
        deferred.push((override) =>
          resolve(
            override && Object.keys(override).length > 0
              ? override
              : {
                  valid: true,
                  code: WELCOME_CODE,
                  discount_type: "welcome_discount",
                  discount_amount: Math.round(subtotal * 0.1),
                  message: "Welcome code applied.",
                },
          ),
        )
      })
    })

    render(<CheckoutPage />)

    // 1) Reach a settled state: welcome discount Rs.300 on cart A (qty 2 = 3000).
    await waitFor(() => expect(verifyCallCount()).toBe(1))
    await act(async () => {
      deferred.shift()!()
    })
    await waitFor(() => expect(screen.getByText("-Rs.300")).toBeInTheDocument())
    expect(screen.getByText("Rs.2,700")).toBeInTheDocument()

    // 2) Rapidly change 2 -> 3 while the revalidation is STILL in flight.
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 3)
    })
    await waitFor(() => expect(verifyCallCount()).toBe(2))

    // The OLD discount and total must be gone; the UI shows a recalculating
    // placeholder and a total computed WITHOUT the stale discount.
    expect(screen.queryByText("-Rs.300")).not.toBeInTheDocument()
    expect(screen.queryByText("Rs.2,700")).not.toBeInTheDocument()
    expect(screen.queryByText("Rs.4,200")).not.toBeInTheDocument()
    expect(screen.getByText("Recalculating…")).toBeInTheDocument()
    // Lines rendered at the current quantity: cart item line, Subtotal row and
    // (while the discount is hidden) the Total row all show the same amount.
    expect(screen.getAllByText("Rs.4,500")).toHaveLength(3)

    // 3) Change 3 -> 4 while the cart-B revalidation is still in flight.
    act(() => {
      useCartStore.getState().updateQuantity({ id: 1, variantId: 11 }, 4)
    })
    // Still only one in-flight request (request #2); the second change is queued.
    await new Promise((r) => setTimeout(r, 20))
    expect(verifyCallCount()).toBe(2)
    expect(screen.getByText("Recalculating…")).toBeInTheDocument()
    expect(screen.queryByText("-Rs.300")).not.toBeInTheDocument()
    // Cart item line, Subtotal row and (hidden discount) Total row all show the
    // LATEST quantity (4 -> 6000).
    expect(screen.getAllByText("Rs.6,000")).toHaveLength(3)

    // 4) Resolve the stale cart-B (4500) request: its response must never
    //    surface (still no discount shown); the queued revalidation re-runs
    //    for the latest cart (6000).
    await act(async () => {
      deferred.shift()!()
    })
    await waitFor(() => expect(verifyCallCount()).toBe(3))
    expect(lastVerifyBody().subtotal).toBe(6000)
    expect(screen.queryByText("-Rs.450")).not.toBeInTheDocument()
    expect(screen.getByText("Recalculating…")).toBeInTheDocument()

    // 5) Resolve the cart-C (6000) verification: discount + total now match the
    //    LATEST quantity together.
    await act(async () => {
      deferred.shift()!()
    })
    await waitFor(() => expect(screen.getByText("-Rs.600")).toBeInTheDocument())
    expect(screen.queryByText("Recalculating…")).not.toBeInTheDocument()
    expect(screen.getByText("Rs.5,400")).toBeInTheDocument()
    // Cart item line + Subtotal show the current quantity; the Total now
    // reflects the applied discount.
    expect(screen.getAllByText("Rs.6,000")).toHaveLength(2)
    expect(toastError).not.toHaveBeenCalled()
  })
})
