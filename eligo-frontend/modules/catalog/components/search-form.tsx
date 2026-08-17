"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SearchFormProps = {
  defaultValue?: string
  className?: string
  autoFocus?: boolean
}

export function SearchForm({ defaultValue = "", className, autoFocus }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", className)}
      role="search"
    >
      <div className="relative flex-1">
        <MagnifyingGlass
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          weight="bold"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          autoFocus={autoFocus}
          className="pl-9 pr-9"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-brand-brown"
          >
            <X className="size-4" weight="bold" />
          </button>
        ) : null}
      </div>
      <Button type="submit" variant="primary">
        Search
      </Button>
    </form>
  )
}
