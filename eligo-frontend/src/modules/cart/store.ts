"use client"

import { create } from "zustand"
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware"

export interface CartItem {
  id: string | number
  /** Selected variant ID from the PDP, when the product has variants. */
  variantId?: string | number
  title: string
  price: number
  originalPrice?: number
  color?: string
  quantity: number
  image: string
}

/** Minimal shape needed to identify one cart line. */
export interface CartLineRef {
  id: string | number
  variantId?: string | number
  color?: string
}

interface CartState {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (line: CartLineRef) => void
  updateQuantity: (line: CartLineRef, quantity: number) => void
  clearCart: () => void
}

const CART_STORAGE_KEY = "eligo_leather_cart"
const CART_PERSIST_VERSION = 0

function normalizeColor(color: string | undefined): string {
  return (color ?? "").trim()
}

/**
 * Deterministic cart-line identity:
 * 1. Product IDs must match.
 * 2. If either line carries a `variantId`, both must carry one and those IDs
 *    must match. A variant line never matches a legacy line through a color
 *    fallback.
 * 3. Only two legacy lines (no `variantId` on either side) compare by
 *    normalized color.
 */
export function isSameCartLine(a: CartLineRef, b: CartLineRef): boolean {
  if (String(a.id) !== String(b.id)) return false
  if (a.variantId !== undefined || b.variantId !== undefined) {
    return (
      a.variantId !== undefined &&
      b.variantId !== undefined &&
      String(a.variantId) === String(b.variantId)
    )
  }
  return normalizeColor(a.color) === normalizeColor(b.color)
}

/** Stable React list key derived from the same identity rule. */
export function cartLineKey(item: CartLineRef): string {
  const variantPart =
    item.variantId !== undefined
      ? `v${String(item.variantId)}`
      : `c${normalizeColor(item.color)}`
  return `${String(item.id)}|${variantPart}`
}

function isValidPersistedItemId(value: unknown): value is string | number {
  if (typeof value === "string") return value.trim().length > 0
  return typeof value === "number" && Number.isFinite(value)
}

function isValidNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

/**
 * Rebuilds a trusted `CartItem` from untrusted persisted data.
 * Returns null when a required field is missing or malformed so the entry
 * never reaches cart calculations. Invalid *optional* fields are stripped
 * and the otherwise-safe item is preserved.
 */
function toTrustedCartItem(value: unknown): CartItem | null {
  if (typeof value !== "object" || value === null) return null
  const raw = value as Record<string, unknown>

  if (!isValidPersistedItemId(raw.id)) return null
  if (typeof raw.title !== "string" || raw.title.trim().length === 0) return null
  if (typeof raw.image !== "string") return null
  if (!isValidNonNegativeNumber(raw.price)) return null
  if (
    typeof raw.quantity !== "number" ||
    !Number.isInteger(raw.quantity) ||
    raw.quantity <= 0
  ) {
    return null
  }

  const item: CartItem = {
    id: raw.id,
    title: raw.title,
    price: raw.price,
    quantity: raw.quantity,
    image: raw.image,
  }
  if (isValidNonNegativeNumber(raw.originalPrice)) {
    item.originalPrice = raw.originalPrice
  }
  if (typeof raw.color === "string" && normalizeColor(raw.color)) {
    item.color = raw.color
  }
  if (
    (typeof raw.variantId === "string" && raw.variantId.trim().length > 0) ||
    (typeof raw.variantId === "number" && Number.isFinite(raw.variantId))
  ) {
    item.variantId = raw.variantId as string | number
  }
  return item
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  const items: CartItem[] = []
  for (const entry of value) {
    const item = toTrustedCartItem(entry)
    if (!item) continue
    // Persisted data may contain duplicate lines sharing one final
    // deterministic identity (e.g. two legacy lines with the same product
    // and color). Combine them so `cartLineKey` stays unique as a React key.
    // Separate variant IDs can never collide: identity requires both lines
    // to carry the same variantId, so distinct variants are never merged.
    const existingIndex = items.findIndex((existing) =>
      isSameCartLine(existing, item),
    )
    if (existingIndex === -1) {
      items.push(item)
      continue
    }
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + item.quantity,
    }
  }
  return items
}

/**
 * Read-side bridge for the storage key `eligo_leather_cart`:
 * - legacy carts were saved as a raw JSON array of items;
 * - Zustand persist saves `{ state: { cart }, version }`;
 * - anything else (invalid JSON, old shapes, garbage) resolves to an empty
 *   persisted cart instead of crashing or poisoning state.
 */
const legacyCompatibleStorage: StateStorage = {
  getItem: (name) => {
    let storedValue: string | null
    try {
      storedValue = localStorage.getItem(name)
    } catch {
      return null
    }
    if (!storedValue) return null

    try {
      const parsed: unknown = JSON.parse(storedValue)
      if (Array.isArray(parsed)) {
        return JSON.stringify({
          state: { cart: sanitizeCartItems(parsed) },
          version: CART_PERSIST_VERSION,
        })
      }
      if (parsed !== null && typeof parsed === "object" && "state" in parsed) {
        const stateValue = (parsed as { state?: unknown }).state
        const cartValue =
          stateValue !== null && typeof stateValue === "object"
            ? (stateValue as { cart?: unknown }).cart
            : undefined
        return JSON.stringify({
          state: { cart: sanitizeCartItems(cartValue) },
          version: CART_PERSIST_VERSION,
        })
      }
      // Valid JSON of an unexpected shape: treat as no saved cart.
      return null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Storage may be unavailable or full; dropping persistence must never
      // break the in-memory cart.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Same reasoning as setItem.
    }
  },
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (newItem) =>
        set((state) => {
          // 1) Exact deterministic match: same product and same variant.
          const exactIndex = state.cart.findIndex((item) =>
            isSameCartLine(item, newItem),
          )
          if (exactIndex !== -1) {
            const cart = [...state.cart]
            cart[exactIndex] = {
              ...cart[exactIndex],
              quantity: cart[exactIndex].quantity + newItem.quantity,
            }
            return { cart }
          }

          // 2) One-time legacy upgrade: a variant add may absorb ONE legacy
          // line (same product, no variantId, same normalized color). The
          // existing line keeps its data; only the variantId is added and
          // the quantities merged. This happens exclusively during
          // add-to-cart — update/remove always use isSameCartLine.
          if (newItem.variantId !== undefined) {
            const legacyIndex = state.cart.findIndex(
              (item) =>
                item.variantId === undefined &&
                String(item.id) === String(newItem.id) &&
                normalizeColor(item.color) === normalizeColor(newItem.color),
            )
            if (legacyIndex !== -1) {
              const cart = [...state.cart]
              cart[legacyIndex] = {
                ...cart[legacyIndex],
                quantity: cart[legacyIndex].quantity + newItem.quantity,
                variantId: newItem.variantId,
              }
              return { cart }
            }
          }

          // 3) No match anywhere: a brand-new line.
          return { cart: [...state.cart, newItem] }
        }),
      removeFromCart: (line) =>
        set((state) => ({
          cart: state.cart.filter((item) => !isSameCartLine(item, line)),
        })),
      updateQuantity: (line, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => !isSameCartLine(item, line))
              : state.cart.map((item) =>
                  isSameCartLine(item, line)
                    ? { ...item, quantity }
                    : item,
                ),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_PERSIST_VERSION,
      storage: createJSONStorage(() => legacyCompatibleStorage),
      skipHydration: true,
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
)

export const selectCart = (state: CartState) => state.cart

export const selectCartCount = (state: CartState) =>
  state.cart.reduce((total, item) => total + item.quantity, 0)

export const selectCartSubtotal = (state: CartState) =>
  state.cart.reduce((total, item) => total + item.price * item.quantity, 0)
