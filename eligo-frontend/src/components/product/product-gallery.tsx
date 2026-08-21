"use client"

import { useState } from "react"
import Image from "next/image"

interface ProductGalleryProps {
  images?: string[]
  title?: string
}

export function ProductGallery({
  images = [],
  title = "Product",
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const validImages = images.length > 0 ? images : []
  const mainImage = validImages[selectedIndex] || validImages[0]

  if (validImages.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <div className="relative w-full aspect-square max-w-[720px] bg-gray-100 rounded-[20px] border border-amber-800/40 overflow-hidden flex items-center justify-center">
          <span className="text-gray-400 text-sm">No images available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      {/* Main Image */}
      <div className="relative w-full aspect-square max-w-[720px] bg-white rounded-[20px] border border-amber-800/40 overflow-hidden shadow-xs">
        <Image
          src={mainImage}
          alt={title}
          fill
          priority
          unoptimized
          className="object-cover object-center transition-opacity duration-300"
        />
      </div>

      {/* Thumbnail Strip — only shown when multiple images */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-3 max-w-[720px] w-full overflow-x-auto pb-1">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative shrink-0 w-20 h-20 rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${
                idx === selectedIndex
                  ? "border-amber-800 ring-2 ring-amber-800/30"
                  : "border-gray-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${title} - Image ${idx + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
