"use client"

import { create } from "zustand"
import { fetchMe, login as loginApi, logout as logoutApi, register as registerApi } from "./api"
import type { AuthStatus, LoginRequest, UserCreate, UserOut } from "./types"

type AuthState = {
  user: UserOut | null
  status: AuthStatus
  welcomeDiscountPercentage: number | null
  hydrate: () => Promise<void>
  login: (input: LoginRequest) => Promise<UserOut>
  register: (input: UserCreate) => Promise<UserOut>
  logout: () => void
  setUser: (user: UserOut) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  welcomeDiscountPercentage: null,

  hydrate: async () => {
    if (get().status === "authenticated") return
    try {
      const user = await fetchMe()
      set({ user, status: "authenticated" })
    } catch {
      set({ user: null, status: "unauthenticated" })
    }
  },

  login: async (input) => {
    const token = await loginApi(input)
    set({
      welcomeDiscountPercentage: token.show_welcome_discount
        ? token.welcome_discount_percentage ?? null
        : null,
    })
    const user = await fetchMe()
    set({ user, status: "authenticated" })
    return user
  },

  register: async (input) => {
    const user = await registerApi(input)
    await get().login({ email: input.email, password: input.password })
    return user
  },

  logout: () => {
    logoutApi()
    set({ user: null, status: "unauthenticated", welcomeDiscountPercentage: null })
  },

  setUser: (user) => set({ user, status: "authenticated" }),
}))
