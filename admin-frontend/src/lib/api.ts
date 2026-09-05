export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("eligo_admin_token")
}

export function setAuthToken(token: string) {
  localStorage.setItem("eligo_admin_token", token)
}

export function clearAuthToken() {
  localStorage.removeItem("eligo_admin_token")
  localStorage.removeItem("eligo_admin_user")
}

export function getStoredUser() {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("eligo_admin_user")
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setStoredUser(user: Record<string, unknown>) {
  localStorage.setItem("eligo_admin_user", JSON.stringify(user))
}

let fetchPatched = false

export function patchFetch() {
  if (fetchPatched || typeof window === "undefined") return
  fetchPatched = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url

    const isBackend =
      url.startsWith(API_BASE) ||
      url.startsWith("http://localhost:8000") ||
      url.startsWith("http://127.0.0.1:8000") ||
      url.startsWith("/api/")
    const isLogin = url.includes("/auth/login")

    if (isBackend && !isLogin) {
      const token = getAuthToken()
      if (token) {
        const headers = new Headers(init?.headers)
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`)
        }
        init = { ...init, headers }
      }
    }

    const res = await originalFetch(input, init)

    if (isBackend && !isLogin && (res.status === 401 || res.status === 403)) {
      clearAuthToken()
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    return res
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 || res.status === 403) {
    clearAuthToken()
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; token_type: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setAuthToken(data.access_token)
  return data
}

export interface StoredUser {
  id: number
  email: string
  full_name: string | null
  is_admin: boolean
  is_active: boolean
  user_type?: string
  role_id?: number | null
  domain?: string | null
  created_at: string
}

export async function pinLogin(code: string, email: string) {
  const data = await apiFetch<{ access_token: string; token_type: string }>("/api/v1/auth/pin-login", {
    method: "POST",
    body: JSON.stringify({ code, email }),
  })
  setAuthToken(data.access_token)
  return data
}

export async function fetchCurrentUser() {
  const data = await apiFetch<StoredUser>("/api/v1/auth/me")
  setStoredUser({ ...data })
  return data
}
