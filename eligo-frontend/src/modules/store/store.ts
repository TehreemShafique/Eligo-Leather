"use client"

import { create } from "zustand"
import { DEFAULT_STOREFRONT_CONFIG, fetchStorefrontConfig } from "./api"
import type { StorefrontConfig } from "./types"

export type StorefrontStatus = "idle" | "loading" | "ready" | "error"

type StorefrontState = {
  config: StorefrontConfig
  status: StorefrontStatus
  hydrate: () => Promise<void>
  setConfig: (config: StorefrontConfig) => void
}

export const useStorefrontStore = create<StorefrontState>((set) => ({
  config: DEFAULT_STOREFRONT_CONFIG,
  status: "idle",
  hydrate: async () => {
    set({ status: "loading" })
    try {
      const config = await fetchStorefrontConfig()
      set({ config, status: "ready" })
    } catch {
      set({ status: "error" })
    }
  },
  setConfig: (config) => set({ config, status: "ready" }),
}))

export function selectStoreName(state: StorefrontState) {
  return state.config.storeName
}
