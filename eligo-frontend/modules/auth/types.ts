import type { components } from "@/types/api-types"

export type Token = components["schemas"]["Token"]
export type UserOut = components["schemas"]["User_out"]
export type LoginRequest = components["schemas"]["LoginRequest"]
export type UserCreate = components["schemas"]["UserCreate"]

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated"
