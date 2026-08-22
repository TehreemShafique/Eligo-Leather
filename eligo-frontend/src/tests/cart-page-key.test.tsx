// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import CartPage from "@/app/cart/page"
import { selectCartCount, useCartStore } from "@/modules/cart/store"

vi.mock("next/image", async () => {
  const ReactModule = await import("react")
  // Strip Next.js-specific props that plain <img> does not understand.
  const nextOnlyProps = ["fill", "priority", "sizes", "quality", "placeholder", "loader"]
  return {
    default: (props: Record<string, unknown>) =>
      ReactModule.createElement(
        "img",
        Object.fromEntries(
          Object.entries(props).filter(([key]) => !nextOnlyProps.includes(key)),
        ),
      ),
  }
})

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ cart: [] })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("cart page list keys", () => {
  it("keys rows by deterministic identity, not by array index", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    // Three lines share one color title but have distinct final identities,
    // so every row must get its own stable key derived from cartLineKey().
    // The variant lines are added first; adding the legacy line last keeps
    // all three as separate rows (a variant add after a legacy line would
    // trigger the one-time upgrade and merge them).
    const store = useCartStore.getState()
    store.addToCart({
      id: 1,
      title: "Variant Wallet",
      price: 1600,
      quantity: 1,
      color: "Black",
      image: "/w.jpg",
      variantId: 11,
    })
    store.addToCart({
      id: 1,
      title: "Second Variant",
      price: 1700,
      quantity: 1,
      color: "Black",
      image: "/w.jpg",
      variantId: 12,
    })
    store.addToCart({
      id: 1,
      title: "Legacy Wallet",
      price: 1500,
      quantity: 1,
      color: "Black",
      image: "/w.jpg",
    })

    const view = render(<CartPage />)

    expect(screen.getAllByTitle("Remove item")).toHaveLength(3)
    expect(screen.getByText("Variant Wallet")).toBeInTheDocument()
    expect(screen.getByText("Second Variant")).toBeInTheDocument()
    expect(screen.getByText("Legacy Wallet")).toBeInTheDocument()

    // Capture the live DOM nodes of the two rows that stay put.
    const secondNode = screen.getByText("Second Variant")
    const legacyNode = screen.getByText("Legacy Wallet")

    // Removing the FIRST row proves the keying scheme: identity-only keys
    // leave the remaining keys untouched, so React preserves those exact DOM
    // nodes. An index-suffixed key (`${key}-${idx}`) would shift every
    // remaining key and force a full unmount/remount of the other rows.
    const removeButtons = screen.getAllByTitle("Remove item")
    fireEvent.click(removeButtons[0])

    expect(screen.queryByText("Variant Wallet")).not.toBeInTheDocument()
    expect(useCartStore.getState().cart).toHaveLength(2)
    expect(selectCartCount(useCartStore.getState())).toBe(2)

    expect(screen.getByText("Second Variant")).toBe(secondNode)
    expect(screen.getByText("Legacy Wallet")).toBe(legacyNode)
    expect(secondNode.isConnected).toBe(true)
    expect(legacyNode.isConnected).toBe(true)

    // Identity keys are unique, so React never logs duplicate-key errors.
    const duplicateKeyErrors = consoleErrorSpy.mock.calls.filter((call) =>
      String(call[0]).includes("same key"),
    )
    expect(duplicateKeyErrors).toHaveLength(0)

    view.unmount()
  })
})
