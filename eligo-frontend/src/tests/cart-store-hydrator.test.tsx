// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StrictMode } from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { CartStoreHydrator } from "@/modules/cart/cart-store-hydrator"
import { selectCartCount, useCartStore } from "@/modules/cart/store"

// Scope: these tests use jsdom client rendering only (Testing Library +
// react-dom client render in development mode). They prove the pre-mount /
// post-mount ordering of persisted data and Strict Mode double-effect
// safety. They do NOT exercise real server rendering or hydrateRoot, so no
// full SSR hydration coverage is claimed here.

const STORAGE_KEY = "eligo_leather_cart"

function CartCountProbe() {
  const count = useCartStore(selectCartCount)
  return <span data-testid="cart-count">{count}</span>
}

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ cart: [] })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("CartStoreHydrator", () => {
  it("keeps persisted data out of state before mounting, then rehydrates after mount without warnings", async () => {
    // Persisted cart exists BEFORE any React rendering happens.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          cart: [
            { id: 1, title: "Wallet", price: 1500, quantity: 3, image: "/w.jpg" },
            { id: 2, title: "Belt", price: 1000, quantity: 4, image: "/b.jpg" },
          ],
        },
        version: 0,
      }),
    )

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    // 1) Without the hydrator mounted, persisted data stays out of the store:
    //    skipHydration keeps the initial (empty) state.
    let view = render(<CartCountProbe />)
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0")
    view.unmount()

    // 2) Mounting the hydrator runs the rehydration effect after mount.
    view = render(
      <>
        <CartCountProbe />
        <CartStoreHydrator />
      </>,
    )
    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("7")
    })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    view.unmount()
  })

  it("is safe when React Strict Mode double-invokes the hydration effect", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { cart: [{ id: 5, title: "Bag", price: 900, quantity: 2, image: "/bag.jpg" }] }, version: 0 }),
    )

    // Strict Mode (development builds) mounts, unmounts and remounts the
    // tree, running the hydration effect more than once. The final state
    // must contain exactly one copy of the persisted line.
    render(
      <StrictMode>
        <CartCountProbe />
        <CartStoreHydrator />
      </StrictMode>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("cart-count")).toHaveTextContent("2")
    })
    expect(useCartStore.getState().cart).toEqual([
      { id: 5, title: "Bag", price: 900, quantity: 2, image: "/bag.jpg" },
    ])
  })
})
