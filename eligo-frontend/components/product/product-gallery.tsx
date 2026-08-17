"use client"

import Image from "next/image"

interface ProductGalleryProps {
  images?: string[]
  title?: string
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000",
]

export function ProductGallery({
  images = DEFAULT_IMAGES,
  title = "ARDOR - Handmade Leather Card Holder Wallet",
}: ProductGalleryProps) {
  const mainImage = images.length > 0 ? images[0] : DEFAULT_IMAGES[0]

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Main Image Container (Matches Figma: rounded-[20px] with thin amber border outline, no thumbnails below) */}
      <div className="relative w-full aspect-square max-w-[720px] bg-white rounded-[20px] border border-amber-800/40 overflow-hidden shadow-xs">
        <Image
          src={mainImage}
          alt={title}
          fill
          priority
          unoptimized
          className="object-cover object-center transition-transform duration-500 hover:scale-105"
        />
      </div>
    </div>
  )
}
