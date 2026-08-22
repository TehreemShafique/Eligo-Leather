"use client"

import { useEffect } from "react"
import { useCartStore } from "./store"

/**
 * Client-only bridge that loads the persisted cart after mounting.
 *
 * The store is created with `skipHydration: true`, so server output and the
 * first client render both see the same empty initial state (no hydration
 * mismatch); persisted data appears only once this effect runs on the client.
 * Calling `rehydrate()` is idempotent, so a Strict Mode double-invocation of
 * the effect is harmless.
 */
export function CartStoreHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate()
  }, [])

  return null
}
