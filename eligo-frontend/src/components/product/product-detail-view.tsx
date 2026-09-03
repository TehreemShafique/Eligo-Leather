"use client"

import { useState, useEffect } from "react"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { ProductGallery } from "./product-gallery"
import { ProductBuyBox } from "./product-buy-box"
import { ProductSpecGrid } from "./product-spec-grid"
import { RelatedProducts } from "./related-products"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { fetchReviewSummary } from "@/modules/reviews/api"
import type { ProductOut, ProductListOut } from "@/modules/catalog/schema"

const COLOR_HEX_MAP: Record<string, string> = {
  maroon: "#6B2A2A",
  brown: "#5C240E",
  tan: "#C88A58",
  black: "#1a1a1a",
  blue: "#2563eb",
  green: "#16a34a",
  red: "#dc2626",
  orange: "#ea580c",
  purple: "#9333ea",
  pink: "#ec4899",
  white: "#f5f5f5",
  grey: "#6b7280",
  gray: "#6b7280",
  navy: "#1e3a5f",
  cognac: "#9A6B45",
  chocolate: "#3E2723",
  oxblood: "#4A0000",
  vintage: "#8B6914",
}

function getColorHex(name: string): string {
  const normalized = name.toLowerCase().trim()
  if (COLOR_HEX_MAP[normalized]) return COLOR_HEX_MAP[normalized]
  const hash = normalized.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const hue = hash % 360
  return `hsl(${hue}, 45%, 35%)`
}

interface ProductDetailViewProps {
  product: ProductOut
  relatedProducts?: ProductListOut[]
}

export function ProductDetailView({ product, relatedProducts = [] }: ProductDetailViewProps) {
  const title = product.title
  const firstVariant = product.variants?.[0]
  const price = firstVariant?.price ? parseFloat(firstVariant.price) : 0
  const originalPrice = firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : undefined

  const sortedImages = [...(product.images || [])].sort((a, b) => a.position - b.position)
  const imageUrls = sortedImages.map((img) => img.url)

  const activeVariants = (product.variants || []).filter((v) => v.is_active)
  const colors = activeVariants.map((v) => ({
    name: v.title,
    class: `bg-[${getColorHex(v.title)}]`,
    hex: getColorHex(v.title),
    variantId: v.id,
    isCanonical: v.id === firstVariant?.id,
  }))

  const [activeColor, setActiveColor] = useState(colors[0]?.name || "")
  const [galleryImages] = useState<string[]>(imageUrls.length > 0 ? imageUrls : [])

  // Real average rating + count computed from approved reviews in the backend.
  const [reviewRating, setReviewRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState<number>(0)
  useEffect(() => {
    let active = true
    fetchReviewSummary(product.id).then((summary) => {
      if (!active || !summary || summary.review_count <= 0) return
      setReviewRating(summary.average_rating)
      setReviewCount(summary.review_count)
    })
    return () => {
      active = false
    }
  }, [product.id])

  const ratingStars = reviewRating != null ? reviewRating : 0
  const reviewText =
    reviewCount > 0
      ? `${ratingStars.toFixed(1)} (${reviewCount.toLocaleString()} Review${reviewCount === 1 ? "" : "s"})`
      : "No reviews yet"

  const handleColorChange = (colorName: string) => {
    setActiveColor(colorName)
  }

  const mainImage = galleryImages.length > 0 ? galleryImages[0] : ""

  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* SEO Breadcrumbs Navigation */}
        <div className="w-full max-w-[1570px] mb-6">
          <PageBreadcrumb positioned={false}
            items={[
              { label: "Our Products", href: "/products" },
              { label: title },
            ]}
          />
        </div>

        {/* Main Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-transparent py-4 mb-12 w-full max-w-[1570px] min-h-[780px]">
          {/* Left Gallery */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center items-center h-full">
            <ProductGallery images={galleryImages} title={`${title} - ${activeColor}`} />
          </div>

          {/* Right Buy Box */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center h-full">
            <ProductBuyBox
              id={product.id}
              title={title}
              price={price}
              originalPrice={originalPrice}
              rating={reviewRating ?? 0}
              reviewText={reviewText}
              description={product.description || undefined}
              colors={colors.length > 0 ? colors : undefined}
              image={mainImage}
              onColorSelect={handleColorChange}
            />
          </div>
        </div>

        {/* 4-Column Specification Grid */}
        <div className="w-full max-w-[1680px] flex justify-center">
          <ProductSpecGrid
            description={product.description || undefined}
            material={product.material || undefined}
            dimension={product.dimensions || undefined}
            shippingPolicy={product.shipping_return_policy || undefined}
          />
        </div>

        {/* Related Products Grid */}
        <div className="w-full max-w-[1680px]">
          <RelatedProducts products={relatedProducts} currentProductId={product.id} />
        </div>

        {/* Customer Reviews Section */}
        <div className="w-full max-w-[1680px]">
          <TestimonialsSection productId={product.id} />
        </div>
      </div>
    </div>
  )
}
