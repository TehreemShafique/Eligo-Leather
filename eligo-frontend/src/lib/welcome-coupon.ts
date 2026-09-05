"use client"

/**
 * Small client-side store for the first-time visitor welcome coupon reference.
 *
 * The backend is authoritative for discount validity, amount and one-time
 * redemption. We only persist the *code reference* (never an amount) so the
 * customer does not have to remember/re-type it at checkout, and auto-fill +
 * auto-apply it. The stored visitor id guards against a stale coupon leaking
 * across visitors.
 */

const WELCOME_COUPON_KEY = "eligo_welcome_coupon"

interface StoredWelcomeCoupon {
  code: string
  visitor_id: string
}

export function saveWelcomeCoupon(code: string, visitorId: string | null): void {
  if (!code || !visitorId) return
  try {
    const value: StoredWelcomeCoupon = { code, visitor_id: visitorId }
    window.localStorage.setItem(WELCOME_COUPON_KEY, JSON.stringify(value))
  } catch {
    // Storage may be unavailable or full; dropping persistence must never break
    // the popup or checkout flow.
  }
}

/**
 * Returns the saved welcome coupon code only when it belongs to the given
 * visitor (guard against a stale reference leaking across visitors).
 */
export function loadWelcomeCoupon(visitorId: string | null): string | null {
  if (!visitorId) return null
  try {
    const raw = window.localStorage.getItem(WELCOME_COUPON_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredWelcomeCoupon>
    if (
      parsed &&
      typeof parsed.code === "string" &&
      parsed.code.trim().length > 0 &&
      parsed.visitor_id === visitorId
    ) {
      return parsed.code
    }
    return null
  } catch {
    return null
  }
}

export function clearWelcomeCoupon(): void {
  try {
    window.localStorage.removeItem(WELCOME_COUPON_KEY)
  } catch {
    // Best-effort cleanup.
  }
}
