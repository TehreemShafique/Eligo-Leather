"use client"

import { useMemo, useState } from "react"
import { ProductGallery } from "./product-gallery"
import { ProductBuyBox } from "./product-buy-box"

const FALLBACK_COLOR_IMAGES: Record<string, string[]> = {
  Maroon: [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000",
  ],
  Blue: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?auto=format&fit=crop&q=80&w=1000",
  ],
  Orange: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=1000",
  ],
  Purple: [
    "https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000",
  ],
  Brown: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=1000",
  ],
  Stone: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?auto=format&fit=crop&q=80&w=1000",
  ],
}

interface ProductHeroClientProps {
  id?: string | number
  title: string
  price: number
  originalPrice: number
  description?: string
  productImages: string[]
}

export function ProductHeroClient({
  id,
  title,
  price,
  originalPrice,
  description,
  productImages,
}: ProductHeroClientProps) {
  const [activeColor, setActiveColor] = useState("Maroon")

  const galleryImages = useMemo(() => {
    if (activeColor === "Maroon" && productImages.length > 0) {
      return productImages
    }

    return FALLBACK_COLOR_IMAGES[activeColor] ?? FALLBACK_COLOR_IMAGES.Maroon
  }, [activeColor, productImages])

  return (
    <section className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-[55px]">
      <div className="flex min-w-0 items-center justify-center">
        <ProductGallery
          images={galleryImages}
          title={`${title} - ${activeColor}`}
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <ProductBuyBox
          id={id}
          title={title}
          price={price}
          originalPrice={originalPrice}
          description={description}
          onColorSelect={setActiveColor}
        />
      </div>
    </section>
  )
}