"use client"

import { useEffect } from "react"

export const ALLOW_NAVIGATION_ATTR = "data-allow-navigation"

/**
 * Temporarily blocks the user from leaving the page (header/footer links,
 * browser back/forward, and refresh) while `locked` is true.
 *
 * Anchors that are inside an element carrying `[data-allow-navigation]` are
 * exempt so an explicit acknowledgement (e.g. "Continue shopping") can leave
 * the page flows freely.
 */
export function useNavigationLock(
  locked: boolean,
  options: { warnOnUnload?: boolean } = {},
) {
  const { warnOnUnload = false } = options

  useEffect(() => {
    if (!locked) return

    const isAllowed = (source: Element | null): boolean =>
      Boolean(source?.closest(`[${ALLOW_NAVIGATION_ATTR}]`))

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest?.("a[href]") ?? null
      if (!anchor || isAllowed(anchor)) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const onKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return
      const target = event.target as Element | null
      const anchor = target?.closest?.("a[href]") ?? null
      if (!anchor || isAllowed(anchor)) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const onPopState = (event: PopStateEvent) => {
      event.preventDefault?.()
      window.history.pushState(null, "", window.location.href)
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    document.addEventListener("click", onClickCapture, true)
    document.addEventListener("keydown", onKeyDownCapture, true)
    window.addEventListener("popstate", onPopState)
    if (warnOnUnload) window.addEventListener("beforeunload", onBeforeUnload)

    // Keep a fresh history entry so the back button cannot leave the page.
    window.history.pushState(null, "", window.location.href)

    return () => {
      document.removeEventListener("click", onClickCapture, true)
      document.removeEventListener("keydown", onKeyDownCapture, true)
      window.removeEventListener("popstate", onPopState)
      if (warnOnUnload) window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [locked, warnOnUnload])
}