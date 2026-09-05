"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

type UnsavedChangesContextValue = {
  setUnsavedChanges: (dirty: boolean) => void
  confirmLeave: (callback: () => void) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  setUnsavedChanges: () => {},
  confirmLeave: (_cb: () => void) => {},
})

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
}

type UseFormDirtyResult = {
  isDirty: boolean
  reset: () => void
}

/**
 * Tracks whether any of the provided form values have changed since the
 * baseline snapshot and automatically reports that to the
 * UnsavedChangesProvider.
 *
 * - `values`: the current form values. Object identity may change every
 *   render; deep-equality is used to compute the dirty flag.
 * - `loaded`: should be `false` while server data is still being fetched and
 *   flipped to `true` once it has been applied. When it flips to `true`, the
 *   freshly-loaded values are adopted as the new baseline so the form does
 *   not appear dirty immediately after loading.
 *
 * Use `reset()` after a successful save to adopt the current values as the
 * new clean baseline.
 */
export function useFormDirty(
  values: Record<string, unknown>,
  loaded = true
): UseFormDirtyResult {
  const { setUnsavedChanges } = useUnsavedChanges()
  const [baseline, setBaseline] = useState(() => values)
  const valuesRef = useRef(values)
  const prevLoadedRef = useRef(loaded)
  valuesRef.current = values

  const isDirty = Object.keys(values).some(
    (key) => JSON.stringify(values[key]) !== JSON.stringify(baseline[key])
  )

  useEffect(() => {
    setUnsavedChanges(isDirty)
    return () => setUnsavedChanges(false)
  }, [setUnsavedChanges, isDirty])

  // When server data finishes loading the first time, adopt the loaded values
  // as the clean baseline so the page does not warn about "unsaved changes"
  // immediately after a data fetch.
  useEffect(() => {
    if (loaded && !prevLoadedRef.current) {
      setBaseline(values)
    }
    prevLoadedRef.current = loaded
  }, [loaded, values])

  const reset = useCallback(() => {
    setBaseline(valuesRef.current)
    setUnsavedChanges(false)
  }, [setUnsavedChanges])

  return { isDirty, reset }
}

const DEFAULT_MESSAGE = "You have unsaved changes. Are you sure you want to leave?"

export function UnsavedChangesProvider({
  children,
  message = DEFAULT_MESSAGE,
}: {
  children: React.ReactNode
  message?: string
}) {
  const dirtyRef = useRef(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pendingNavRef = useRef<{ type: "link"; href: string } | { type: "back" } | null>(null)
  const programmaticNavRef = useRef<(() => void) | null>(null)

  const setUnsavedChanges = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
  }, [])

  // Allow programmatic navigation (e.g. router.push) to run through the guard.
  const confirmLeave = useCallback((callback: () => void) => {
    if (!dirtyRef.current) {
      callback()
      return
    }
    programmaticNavRef.current = callback
    pendingNavRef.current = null
    setConfirmOpen(true)
  }, [])

  // Block browser refresh / close / full-page navigation when dirty.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = message
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [message])

  // Block browser back / forward within the SPA when dirty.
  useEffect(() => {
    const handlePopState = () => {
      if (!dirtyRef.current) return
      // Re-push the current history entry so the user can still decide to
      // stay (going back again would leave the page).
      window.history.pushState(null, "")
      pendingNavRef.current = { type: "back" }
      setConfirmOpen(true)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Intercept in-app <Link> / <a> navigations to other internal routes.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      const anchor = (e.target as HTMLElement)?.closest?.(
        'a[href]'
      ) as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute("href") || ""
      if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return
      }
      if (href.startsWith("/")) {
        e.preventDefault()
        e.stopPropagation()
        pendingNavRef.current = { type: "link", href }
        setConfirmOpen(true)
      }
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [])

  const handleDiscard = () => {
    dirtyRef.current = false
    const nav = pendingNavRef.current
    pendingNavRef.current = null
    const programmaticNav = programmaticNavRef.current
    programmaticNavRef.current = null
    setConfirmOpen(false)
    if (programmaticNav) {
      programmaticNav()
    } else if (nav?.type === "link") {
      window.location.assign(nav.href)
    } else if (nav?.type === "back") {
      window.history.back()
    }
  }

  const handleKeepEditing = () => {
    pendingNavRef.current = null
    programmaticNavRef.current = null
    setConfirmOpen(false)
  }

  return (
    <UnsavedChangesContext.Provider value={{ setUnsavedChanges, confirmLeave }}>
      {children}

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 font-sans">
            <h3 className="text-base font-bold text-gray-900">Unsaved changes</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleKeepEditing}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  )
}
