import { beforeEach, describe, expect, it } from "vitest"
import {
  cartLineKey,
  isSameCartLine,
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
  type CartItem,
} from "@/modules/cart/store"

const STORAGE_KEY = "eligo_leather_cart"

function wallet(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    title: "Test Wallet",
    price: 1500,
    quantity: 1,
    color: "Black",
    image: "/wallet.jpg",
    variantId: 11,
    ...overrides,
  }
}

function readStorageRaw(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ cart: [] })
})

describe("cart line identity", () => {
  it("matches lines by product id and normalized color", () => {
    expect(isSameCartLine({ id: 1, color: "Black" }, { id: "1", color: "Black" })).toBe(true)
    expect(isSameCartLine({ id: 1, color: " Black " }, { id: 1, color: "Black" })).toBe(true)
    expect(isSameCartLine({ id: 1, color: "Black" }, { id: 2, color: "Black" })).toBe(false)
    expect(isSameCartLine({ id: 1, color: "Black" }, { id: 1, color: "Brown" })).toBe(false)
    expect(isSameCartLine({ id: 1 }, { id: 1, color: "" })).toBe(true)
  })

  it("matches variant lines only by product id plus variant id", () => {
    expect(
      isSameCartLine(
        { id: 1, variantId: 11, color: "Black" },
        { id: "1", variantId: "11", color: "Black" },
      ),
    ).toBe(true)
  })

  it("keeps variants 11 and 12 separate even with the same color", () => {
    expect(
      isSameCartLine(
        { id: 1, variantId: 11, color: "Black" },
        { id: 1, variantId: 12, color: "Black" },
      ),
    ).toBe(false)
  })

  it("never matches a legacy line with a variant line", () => {
    expect(
      isSameCartLine({ id: 1, color: "Black" }, { id: 1, variantId: 11, color: "Black" }),
    ).toBe(false)
    expect(
      isSameCartLine({ id: 1, variantId: 11, color: "Black" }, { id: 1, color: "Black" }),
    ).toBe(false)
  })

  it("derives a stable key from product id plus variant or color", () => {
    expect(cartLineKey({ id: 7, variantId: 3 })).toBe("7|v3")
    expect(cartLineKey({ id: 7, color: " Tan " })).toBe("7|cTan")
    expect(cartLineKey({ id: 7 })).toBe("7|c")
  })

  it("returns identical keys for identical identities and distinct keys otherwise", () => {
    expect(cartLineKey({ id: 7, variantId: 3 })).toBe(
      cartLineKey({ id: "7", variantId: "3" }),
    )
    expect(cartLineKey({ id: 7, color: " Tan " })).toBe(cartLineKey({ id: 7, color: "Tan" }))

    const distinctKeys = [
      cartLineKey({ id: 7, variantId: 11 }),
      cartLineKey({ id: 7, variantId: 12 }),
      cartLineKey({ id: 7, color: "Black" }),
      cartLineKey({ id: 8, variantId: 11 }),
    ]
    expect(new Set(distinctKeys).size).toBe(distinctKeys.length)
  })
})

describe("cart actions", () => {
  it("adds a new item to an empty cart", () => {
    useCartStore.getState().addToCart(wallet())
    expect(useCartStore.getState().cart).toEqual([wallet()])
  })

  it("re-adding the same line sums quantities instead of duplicating", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ quantity: 1 }))
    store.addToCart(wallet({ quantity: 2 }))
    expect(useCartStore.getState().cart).toHaveLength(1)
    expect(useCartStore.getState().cart[0].quantity).toBe(3)
  })

  it("keeps the same product with another color as a separate line", () => {
    const store = useCartStore.getState()
    // Legacy-style lines without variantId are separated purely by color.
    store.addToCart(wallet({ color: "Black", variantId: undefined }))
    store.addToCart(wallet({ color: "Brown", variantId: undefined }))
    expect(useCartStore.getState().cart).toHaveLength(2)
  })

  it("targets a single variant line when several share a color title", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ variantId: 11, color: "Black", price: 1500 }))
    store.addToCart(wallet({ variantId: 12, color: "Black", price: 1600 }))
    store.updateQuantity(wallet({ variantId: 12 }), 4)
    const lines = useCartStore.getState().cart
    expect(lines).toHaveLength(2)
    expect(lines.find((item) => item.variantId === 12)?.quantity).toBe(4)
    expect(lines.find((item) => item.variantId === 11)?.quantity).toBe(1)
  })

  it("keeps two variants with the same color title as separate lines", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ variantId: 11, color: "Black", price: 1500 }))
    store.addToCart(wallet({ variantId: 12, color: "Black", price: 1600 }))
    expect(useCartStore.getState().cart).toHaveLength(2)
    expect(selectCartSubtotal(useCartStore.getState())).toBe(3100)
  })

  it("upgrades a matching legacy line exactly once when adding a variant", () => {
    const store = useCartStore.getState()
    // Legacy line saved before variant tracking existed.
    store.addToCart(wallet({ quantity: 2, variantId: undefined }))
    store.addToCart(wallet({ variantId: 11, quantity: 1 }))

    const cart = useCartStore.getState().cart
    expect(cart).toHaveLength(1)
    expect(cart[0]).toEqual(
      wallet({ quantity: 3, variantId: 11, color: "Black" }),
    )
  })

  it("creates a separate line when another variant is added afterward", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ quantity: 2, variantId: undefined }))
    store.addToCart(wallet({ variantId: 11, quantity: 1 }))
    store.addToCart(wallet({ variantId: 12, price: 1600, quantity: 1 }))

    const cart = useCartStore.getState().cart
    expect(cart).toHaveLength(2)
    expect(cart.find((item) => item.variantId === 11)?.quantity).toBe(3)
    expect(cart.find((item) => item.variantId === 12)?.quantity).toBe(1)
    // Upgraded line: 3 x 1500. Separate line: 1 x 1600.
    expect(selectCartSubtotal(useCartStore.getState())).toBe(6100)
  })

  it("re-adding variant 11 merges only with variant 11", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ variantId: 11 }))
    store.addToCart(wallet({ variantId: 12 }))
    store.addToCart(wallet({ variantId: 11, quantity: 2 }))

    const lines = useCartStore.getState().cart
    expect(lines).toHaveLength(2)
    expect(lines.find((item) => item.variantId === 11)?.quantity).toBe(3)
    expect(lines.find((item) => item.variantId === 12)?.quantity).toBe(1)
  })

  it("updating a legacy line does not target a variant line", () => {
    const store = useCartStore.getState()
    // Variant line first: adding the legacy line afterwards cannot trigger
    // the one-time upgrade (that only runs for variant adds), so both lines
    // coexist with the same product and color title.
    store.addToCart(wallet({ variantId: 11 }))
    store.addToCart(wallet({ color: "Black", variantId: undefined }))

    const before = useCartStore.getState().cart
    expect(before).toHaveLength(2)

    store.updateQuantity(wallet({ color: "Black", variantId: undefined }), 4)

    const lines = useCartStore.getState().cart
    expect(lines).toHaveLength(2)
    expect(lines.find((item) => item.variantId === undefined)?.quantity).toBe(4)
    expect(lines.find((item) => item.variantId === 11)?.quantity).toBe(1)
  })

  it("removing a legacy line does not remove a variant line", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ variantId: 11, quantity: 3 }))
    store.addToCart(wallet({ color: "Black", variantId: undefined, quantity: 2 }))

    const before = useCartStore.getState().cart
    expect(before).toHaveLength(2)

    store.removeFromCart(wallet({ color: "Black", variantId: undefined }))

    const lines = useCartStore.getState().cart
    expect(lines).toHaveLength(1)
    expect(lines[0].variantId).toBe(11)
    expect(lines[0].quantity).toBe(3)
  })

  it("increases and decreases quantities via updateQuantity", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ quantity: 2 }))
    const line = wallet()
    store.updateQuantity(line, 5)
    expect(useCartStore.getState().cart[0].quantity).toBe(5)
    store.updateQuantity(line, 2)
    expect(useCartStore.getState().cart[0].quantity).toBe(2)
  })

  it("removes the matching line when quantity reaches zero", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ variantId: undefined }))
    store.addToCart(wallet({ color: "Brown", variantId: undefined }))
    store.updateQuantity(wallet({ variantId: undefined }), 0)
    const remaining = useCartStore.getState().cart
    expect(remaining).toHaveLength(1)
    expect(remaining[0].color).toBe("Brown")
  })

  it("removes only the targeted line", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ variantId: undefined }))
    store.addToCart(wallet({ color: "Brown", variantId: undefined }))
    store.removeFromCart(wallet({ variantId: undefined }))
    expect(useCartStore.getState().cart).toHaveLength(1)
    expect(useCartStore.getState().cart[0].color).toBe("Brown")
  })

  it("clears the whole cart", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet())
    store.clearCart()
    expect(useCartStore.getState().cart).toEqual([])
  })

  it("wipes the persisted cart when cleared", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet())
    expect(readStorageRaw()).not.toBeNull()

    store.clearCart()

    expect(useCartStore.getState().cart).toEqual([])
    expect(readStorageRaw()).toBeNull()
  })
})

describe("derived values", () => {
  it("computes subtotal as sum of price times quantity", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ price: 1500, quantity: 1 }))
    store.addToCart(wallet({ id: 2, price: 1000, quantity: 2, color: undefined, variantId: undefined }))
    expect(selectCartSubtotal(useCartStore.getState())).toBe(3500)
  })

  it("computes total count as sum of quantities", () => {
    const store = useCartStore.getState()
    store.addToCart(wallet({ quantity: 1 }))
    store.addToCart(wallet({ id: 2, quantity: 2, color: undefined, variantId: undefined }))
    expect(selectCartCount(useCartStore.getState())).toBe(3)
  })
})

describe("persistence", () => {
  it("writes the zustand wrapped shape under eligo_leather_cart", async () => {
    useCartStore.getState().addToCart(wallet({ variantId: 11 }))
    await Promise.resolve()

    const raw = readStorageRaw()
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string) as {
      state?: { cart?: unknown }
      version?: number
    }
    expect(parsed.version).toBe(0)
    expect(Array.isArray(parsed.state?.cart)).toBe(true)
    expect(parsed.state?.cart).toEqual([wallet({ variantId: 11 })])
  })

  it("persists and rehydrates variantId through the wrapped format", async () => {
    useCartStore.getState().addToCart(wallet({ variantId: "abc-42" }))
    const savedRaw = readStorageRaw()
    expect(savedRaw).toContain("abc-42")

    // Simulate a fresh session: empty state, then restore the saved payload
    // (setState itself rewrites storage, so the snapshot must be put back).
    useCartStore.setState({ cart: [] })
    localStorage.setItem(STORAGE_KEY, savedRaw as string)
    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().cart).toEqual([wallet({ variantId: "abc-42" })])
  })
})

describe("rehydration of saved data", () => {
  it("loads current wrapped-format data", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { cart: [wallet()] }, version: 0 }),
    )
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([wallet()])
  })

  it("migrates legacy raw-array carts into application state", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([wallet()]))
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([wallet()])
  })

  it("produces an empty cart when storage is missing", async () => {
    localStorage.removeItem(STORAGE_KEY)
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([])
  })

  it("produces an empty cart for invalid JSON", async () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json")
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([])
  })

  it("produces an empty cart for unexpected object shapes", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: [], foo: "bar" }))
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([])
  })

  it("rejects malformed persisted items while preserving safe ones", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        wallet(),
        { id: 2, title: "", price: 100, quantity: 1, image: "/x.jpg" },
        { id: 3, title: "Bad price", price: -5, quantity: 1, image: "/x.jpg" },
        { id: 4, title: "Bad qty", price: 10, quantity: 0, image: "/x.jpg" },
        { id: 5, title: "Fractional qty", price: 10, quantity: 1.5, image: "/x.jpg" },
        null,
        "garbage",
        { title: "No id", price: 10, quantity: 1, image: "/x.jpg" },
      ]),
    )
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([wallet()])
  })

  it("combines duplicate persisted lines that share one final identity", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 1, title: "Wallet", price: 1500, quantity: 1, image: "/w.jpg", color: "Black" },
        { id: 1, title: "Wallet", price: 1500, quantity: 2, image: "/w.jpg", color: "Black" },
      ]),
    )
    await useCartStore.persist.rehydrate()
    expect(useCartStore.getState().cart).toEqual([
      { id: 1, title: "Wallet", price: 1500, quantity: 3, image: "/w.jpg", color: "Black" },
    ])
  })

  it("never combines persisted lines with different variant ids", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([wallet({ variantId: 11 }), wallet({ variantId: 12 })]),
    )
    await useCartStore.persist.rehydrate()

    const cart = useCartStore.getState().cart
    expect(cart).toHaveLength(2)
    expect(selectCartCount(useCartStore.getState())).toBe(2)
  })

  it("drops invalid optional fields but keeps otherwise safe items", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 9, title: "Belt", price: 800, quantity: 1, image: "/b.jpg", originalPrice: -1 },
        { id: 10, title: "Bag", price: 900, quantity: 2, image: "/bag.jpg", color: "Tan", variantId: true },
      ]),
    )
    await useCartStore.persist.rehydrate()
    const cart = useCartStore.getState().cart
    expect(cart).toHaveLength(2)
    expect(cart[0]).not.toHaveProperty("originalPrice")
    expect(cart[0]).not.toHaveProperty("color")
    expect(cart[1]).not.toHaveProperty("variantId")
    expect(cart[1].color).toBe("Tan")
    expect(selectCartSubtotal(useCartStore.getState())).toBe(2600)
  })
})
