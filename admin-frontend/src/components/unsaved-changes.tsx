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
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  setUnsavedChanges: () => {},
})

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext)
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

  const setUnsavedChanges = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
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
    setConfirmOpen(false)
    if (nav?.type === "link") {
      window.location.assign(nav.href)
    } else if (nav?.type === "back") {
      window.history.back()
    }
  }

  const handleKeepEditing = () => {
    pendingNavRef.current = null
    setConfirmOpen(false)
  }

  return (
    <UnsavedChangesContext.Provider value={{ setUnsavedChanges }}>
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
