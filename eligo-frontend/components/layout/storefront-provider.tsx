"use client"

import { useEffect } from "react"
import { useStorefrontStore } from "@/modules/store/store"

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useStorefrontStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return <>{children}</>
}
