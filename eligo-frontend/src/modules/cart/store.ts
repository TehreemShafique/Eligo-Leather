"use client"

import { create } from "zustand"
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware"

export interface CartItem {
  id: string | number
  title: string
  price: number
  originalPrice?: number
  color?: string
  quantity: number
  image: string
}

interface CartState {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string | number, color?: string) => void
  updateQuantity: (id: string | number, quantity: number, color?: string) => void
  clearCart: () => void
}

const CART_STORAGE_KEY = "eligo_leather_cart"

const legacyCompatibleStorage: StateStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name)
    if (!value) return null

    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return JSON.stringify({ state: { cart: parsed }, version: 0 })
      }
    } catch {
      return value
    }

    return value
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}

function isSameCartItem(
  item: CartItem,
  id: string | number,
  color?: string,
) {
  return (
    String(item.id) === String(id) &&
    (item.color || "") === (color || "")
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (newItem) =>
        set((state) => {
          const existingIndex = state.cart.findIndex((item) =>
            isSameCartItem(item, newItem.id, newItem.color),
          )

          if (existingIndex === -1) {
            return { cart: [...state.cart, newItem] }
          }

          const cart = [...state.cart]
          cart[existingIndex] = {
            ...cart[existingIndex],
            quantity: cart[existingIndex].quantity + newItem.quantity,
          }
          return { cart }
        }),
      removeFromCart: (id, color) =>
        set((state) => ({
          cart: state.cart.filter((item) => !isSameCartItem(item, id, color)),
        })),
      updateQuantity: (id, quantity, color) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => !isSameCartItem(item, id, color))
              : state.cart.map((item) =>
                  isSameCartItem(item, id, color)
                    ? { ...item, quantity }
                    : item,
                ),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => legacyCompatibleStorage),
      skipHydration: true,
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
)

export const selectCartCount = (state: CartState) =>
  state.cart.reduce((total, item) => total + item.quantity, 0)

export const selectCartSubtotal = (state: CartState) =>
  state.cart.reduce((total, item) => total + item.price * item.quantity, 0)