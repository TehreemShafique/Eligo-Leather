"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ProductImageOut } from "@/modules/catalog/schema"

export type GalleryProps = {
  images: ProductImageOut[]
  title: string
  className?: string
}

export function Gallery({ images, title, className }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-brand-black/5 text-brand-black/30",
          className,
        )}
      >
        <span className="text-[10px] font-medium uppercase tracking-widest">No image</span>
      </div>
    )
  }

  const sorted = [...images].sort((a, b) => a.position - b.position)
  const active = sorted[Math.min(activeIndex, sorted.length - 1)]

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-square overflow-hidden bg-brand-black/5">
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt_text ?? title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {sorted.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4" role="tablist" aria-label="Product images">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden bg-brand-black/5 ring-1 transition-colors",
                index === activeIndex
                  ? "ring-brand-brown"
                  : "ring-foreground/10 hover:ring-foreground/30",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text ?? `${title} thumbnail ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
