"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import ScratchWelcomePopup from "@/components/ScratchWelcomePopup"

const VISITOR_COOKIE = "eligo_visitor_id"
// Persistent: the same anonymous visitor keeps their id across normal visits.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

interface WelcomeEligibilityResponse {
  eligible: boolean
  discount_percentage: number | null
  coupon_code: string | null
  is_active: boolean | null
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null
}

function writeVisitorCookie(value: string) {
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// Module-level guard: the eligibility check must run at most once per page
// load, never again because of unrelated re-renders or StrictMode remounts.
let eligibilityCheckStarted = false

export default function WelcomeDiscountProvider() {
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [eligibility, setEligibility] = useState<boolean | null>(null)
  const [discountPercentage, setDiscountPercentage] = useState(5)
  const [couponCode, setCouponCode] = useState("")
  const [popupOpen, setPopupOpen] = useState(false)

  useEffect(() => {
    if (eligibilityCheckStarted) return
    eligibilityCheckStarted = true

    // 1. Reuse the persistent visitor id or create + store a fresh one.
    const existing = readCookie(VISITOR_COOKIE)
    const visitor = existing || generateVisitorId()
    if (!existing) writeVisitorCookie(visitor)

    // 2. Ask the backend — it alone decides eligibility for this visitor.
    const runEligibilityCheck = async () => {
      try {
        setVisitorId(visitor)
        const res = await api.post<WelcomeEligibilityResponse, { visitor_id: string }>(
          "/discounts/public/welcome-check",
          { visitor_id: visitor },
          { auth: false },
        )
        setDiscountPercentage(res.discount_percentage ?? 5)
        // The code is always generated server-side for eligible visitors and
        // never fabricated in the browser.
        setCouponCode(res.coupon_code || "")
        setEligibility(res.eligible === true && Boolean(res.coupon_code))
        if (res.eligible) {
          // Delay the open so the popup never flashes in mid-render.
          setTimeout(() => setPopupOpen(true), 400)
        }
      } catch {
        // Safety: an eligibility API failure must never show the popup.
        // Intentional behind a warn log — no technical detail is shown to
        // the customer.
        console.warn("Welcome discount eligibility check could not be completed.")
        setEligibility(false)
      }
    }
    void runEligibilityCheck()
  }, [])

  // showWelcomePopup = eligo_visitor_id exists AND backend eligible === true.
  const showWelcomePopup = visitorId !== null && eligibility === true

  return (
    <>
      {showWelcomePopup && (
        <ScratchWelcomePopup
          discountPercentage={discountPercentage}
          couponCode={couponCode}
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  )
}