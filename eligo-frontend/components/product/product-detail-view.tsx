"use client"

import { useState, useEffect } from "react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { ProductGallery } from "./product-gallery"
import { ProductBuyBox, VariantColorOption } from "./product-buy-box"
import { ProductSpecGrid } from "./product-spec-grid"
import { RelatedProducts } from "./related-products"
import { TestimonialsSection } from "@/components/home/testimonials-section"

// Color-to-Image Map Architecture
const COLOR_IMAGE_MAP: Record<string, string[]> = {
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
}

interface ProductDetailViewProps {
  product?: {
    id?: string | number
    title?: string
    price?: number
    compareAtPrice?: number
    description?: string
    material?: string
    dimensions?: string
    shipping_return_policy?: string
    meta_description?: string
    images?: string[]
  }
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const title = product?.title || "004 DYNAMO - Handmade Leather Wallet"
  const price = product?.price || 2799
  const originalPrice = product?.compareAtPrice || 4500

  // Active Color State controlling Gallery Images
  const [activeColor, setActiveColor] = useState("Maroon")
  const [galleryImages, setGalleryImages] = useState<string[]>(COLOR_IMAGE_MAP["Maroon"])

  const handleColorChange = (colorName: string) => {
    setActiveColor(colorName)
    const imagesForColor = COLOR_IMAGE_MAP[colorName] || COLOR_IMAGE_MAP["Maroon"]
    setGalleryImages(imagesForColor)
  }

  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* SEO Breadcrumbs Navigation */}
        <div className="w-full max-w-[1570px] mb-6">
          <Breadcrumbs
            items={[
              { label: "Our Products", href: "/products" },
              { label: title },
            ]}
          />
        </div>

        {/* Main Product Hero Grid (1570px wide x 780px tall Card Frame) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-transparent py-4 mb-12 w-full max-w-[1570px] min-h-[780px]">
          {/* Left Gallery (7 columns) - Dynamic image list based on selected color */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center items-center h-full">
            <ProductGallery images={galleryImages} title={`${title} - ${activeColor}`} />
          </div>

          {/* Right Buy Box (5 columns) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center h-full">
            <ProductBuyBox
              id={product?.id}
              title={title}
              price={price}
              originalPrice={originalPrice}
              description={product?.description}
              onColorSelect={handleColorChange}
            />
          </div>
        </div>

        {/* 4-Column Specification Grid (1680px x 310px Card) */}
        <div className="w-full max-w-[1680px] flex justify-center">
          <ProductSpecGrid
            description={product?.description}
            material={product?.material}
            dimension={product?.dimensions}
            shippingPolicy={product?.shipping_return_policy}
          />
        </div>

        {/* Related Products Grid */}
        <div className="w-full max-w-[1680px]">
          <RelatedProducts />
        </div>

        {/* Customer Reviews Section */}
        <div className="w-full max-w-[1680px]">
          <TestimonialsSection />
        </div>
      </div>
    </div>
  )
}
