"use client"

import { useEffect, useState } from "react"

interface ActiveSchema {
  id: number
  name: string
  schema_type: string
  target_pages: string
  schema_json: string
  is_active: boolean
}

function matchesPattern(pathname: string, pattern: string): boolean {
  const patterns = pattern.split(",").map((p) => p.trim())
  return patterns.some((p) => {
    if (p === "/*" || p === "/") return true
    if (p.endsWith("/*")) {
      const prefix = p.slice(0, -2)
      return pathname === prefix || pathname.startsWith(prefix + "/")
    }
    if (p.endsWith("*")) {
      const prefix = p.slice(0, -1)
      return pathname.startsWith(prefix)
    }
    return pathname === p
  })
}

export function SchemaInjector() {
  const [schemas, setSchemas] = useState<ActiveSchema[]>([])

  useEffect(() => {
    const userId = "1"
    fetch(`http://localhost:8000/api/v1/store/${userId}/schemas`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ActiveSchema[]) => {
        if (Array.isArray(data)) setSchemas(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (schemas.length === 0) return

    const pathname = window.location.pathname

    schemas.forEach((schema) => {
      if (!schema.is_active) return
      if (!matchesPattern(pathname, schema.target_pages)) return
      if (!schema.schema_json || !schema.schema_json.includes("application/ld+json")) return

      const existing = document.getElementById(`store-schema-${schema.id}`)
      if (existing) return

      const wrapper = document.createElement("div")
      wrapper.innerHTML = schema.schema_json
      const scriptEl = wrapper.querySelector("script[type='application/ld+json']")
      if (scriptEl) {
        scriptEl.id = `store-schema-${schema.id}`
        document.head.appendChild(scriptEl)
      }
    })
  }, [schemas])

  return null
}
