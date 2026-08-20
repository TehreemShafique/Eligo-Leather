"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
  id: string | number
  title: string
  price: number
  originalPrice?: number
  color?: string
  quantity: number
  image: string
}

interface CartContextType {
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string | number, color?: string) => void
  updateQuantity: (id: string | number, quantity: number, color?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "eligo_leather_cart"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        setCart(JSON.parse(stored))
      }
    } catch (e) {
      console.warn("Could not load cart from localStorage", e)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Save cart to localStorage on changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
      } catch (e) {
        console.warn("Could not save cart to localStorage", e)
      }
    }
  }, [cart, isInitialized])

  const addToCart = (newItem: CartItem) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => String(item.id) === String(newItem.id) && (item.color || "") === (newItem.color || "")
      )

      if (existingIndex > -1) {
        const updated = [...prevCart]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        }
        return updated
      }

      return [...prevCart, newItem]
    })
  }

  const removeFromCart = (id: string | number, color?: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(String(item.id) === String(id) && (item.color || "") === (color || ""))
      )
    )
  }

  const updateQuantity = (id: string | number, newQty: number, color?: string) => {
    if (newQty <= 0) {
      removeFromCart(id, color)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        String(item.id) === String(id) && (item.color || "") === (color || "")
          ? { ...item, quantity: newQty }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
