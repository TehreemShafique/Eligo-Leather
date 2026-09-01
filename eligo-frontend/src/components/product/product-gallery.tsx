"use client"

import Image from "next/image"

interface ProductGalleryProps {
  images?: string[]
  title?: string
}

export function ProductGallery({
  images = [],
  title = "Product",
}: ProductGalleryProps) {
  const mainImage = images.length > 0 ? images[0] : ""

  if (!mainImage) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <div className="relative w-full aspect-square max-w-[720px] bg-gray-100 rounded-[20px] border border-amber-800/40 overflow-hidden flex items-center justify-center">
          <span className="text-gray-400 text-sm">No images available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="relative w-full aspect-square max-w-[720px] bg-white rounded-[20px] border border-amber-800/40 overflow-hidden shadow-xs">
        <Image
          src={mainImage}
          alt={title}
          fill
          priority
          className="object-cover object-center"
        />
      </div>
    </div>
  )
}
