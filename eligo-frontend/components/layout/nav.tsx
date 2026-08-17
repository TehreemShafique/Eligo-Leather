"use client"

import Link from "next/link"
import { useStorefrontStore } from "@/modules/store/store"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

export function Nav({ className }: NavProps) {
  const nav = useStorefrontStore((state) => state.config.nav)

  return (
    <nav className={cn("flex items-center gap-6", className)} aria-label="Main navigation">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-xs font-medium uppercase tracking-widest text-brand-black transition-colors hover:text-brand-brown"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
