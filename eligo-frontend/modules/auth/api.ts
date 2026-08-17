import { authApi, authStorage } from "@/lib/auth"
import type { LoginRequest, Token, UserCreate, UserOut } from "./types"

export async function login(input: LoginRequest): Promise<Token> {
  return authApi.login(input)
}

export async function register(input: UserCreate): Promise<UserOut> {
  return authApi.register(input)
}

export async function fetchMe(): Promise<UserOut> {
  return authApi.me()
}

export function logout(): void {
  authApi.logout()
}

export function getAuthToken(): string | null {
  return authStorage.getToken()
}

export function hasAuthToken(): boolean {
  return Boolean(authStorage.getToken())
}
