"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  FacebookLogo,
  InstagramLogo,
  YoutubeLogo,
  TiktokLogo,
  XLogo,
  PinterestLogo,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { useCartStore } from "@/modules/cart/store"

export interface VariantColorOption {
  name: string
  class: string
  hex: string
  variantId?: string | number
  isCanonical?: boolean
}

export interface ProductBuyBoxProps {
  id?: string | number
  title?: string
  price?: number
  originalPrice?: number
  rating?: number
  reviewText?: string
  description?: string
  colors?: VariantColorOption[]
  image?: string
  onColorSelect?: (colorName: string) => void
}

export function ProductBuyBox({
  id = 1,
  title = "Product",
  price = 0,
  originalPrice,
  rating = 0,
  reviewText = "",
  description,
  colors = [],
  image = "",
  onColorSelect,
}: ProductBuyBoxProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addToCart = useCartStore((state) => state.addToCart)

  // Description arrives sanitized from the server; derive a short
  // plain-text teaser so the collapsed preview never leaks raw markup.
  const plainDescription = description
    ? description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : ""
  const teaserLength = 180
  const needsTruncation = plainDescription.length > teaserLength

  const initialVariantId = searchParams.get("variant")
  const initialColorObj = colors.length > 0
    ? (colors.find((c) => String(c.variantId) === initialVariantId) || colors[0])
    : null

  const [selectedColor, setSelectedColor] = useState<VariantColorOption | null>(initialColorObj)
  const [quantity, setQuantity] = useState(1)
  const [showFullDesc, setShowFullDesc] = useState(false)

  const handleSelectColor = (colorObj: VariantColorOption) => {
    setSelectedColor(colorObj)
    if (onColorSelect) {
      onColorSelect(colorObj.name)
    }

    if (colorObj.variantId) {
      const newUrl = `${window.location.pathname}?variant=${colorObj.variantId}`
      window.history.replaceState(null, "", newUrl)
    } else {
      window.history.replaceState(null, "", window.location.pathname)
    }
    toast.info(`Selected Color: ${colorObj.name}`)
  }

  const handleDecreaseQty = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const handleIncreaseQty = () => {
    setQuantity(quantity + 1)
  }

  const handleAddToCart = () => {
    addToCart({
      id,
      variantId: selectedColor?.variantId,
      title,
      price,
      originalPrice,
      color: selectedColor?.name || "",
      quantity,
      image,
    })
    toast.success(`Added ${quantity}x "${title}"${selectedColor ? ` (${selectedColor.name})` : ""} to cart!`)
  }

  const handleBuyItNow = () => {
    addToCart({
      id,
      variantId: selectedColor?.variantId,
      title,
      price,
      originalPrice,
      color: selectedColor?.name || "",
      quantity,
      image,
    })
    toast.success(`Proceeding to checkout for "${title}"...`)
    router.push("/checkout")
  }

  return (
    <div className="w-full space-y-5 font-['Manrope']">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight tracking-tight">
        {title}
      </h1>

      {/* Pricing */}
      <div className="flex items-baseline gap-3">
        {price > 0 && (
          <span className="text-xl sm:text-2xl font-bold text-zinc-950">
            Rs.{price.toLocaleString()}
          </span>
        )}
        {originalPrice && originalPrice > 0 && (
          <span className="text-sm text-gray-400 line-through">
            Rs.{originalPrice.toLocaleString()}
          </span>
        )}
      </div>

      {/* Rating Stars */}
      <div className="flex items-center gap-2">
        <div className="flex items-center text-amber-500 gap-0.5 text-base font-serif tracking-widest" aria-label={`Rated ${rating} out of 5`}>
          {"★".repeat(Math.min(5, Math.max(0, Math.round(rating))))}
          {"★".repeat(Math.min(5, Math.max(0, 5 - Math.round(rating)))).replace(/★/g, "☆")}
        </div>
        <span className="text-xs text-gray-700 font-medium">{reviewText || "No reviews yet"}</span>
      </div>

      {/* Product Description */}
      {description && (
        <div className="space-y-1 text-sm text-gray-800">
          <p className="leading-relaxed whitespace-pre-line">
            {showFullDesc
              ? plainDescription
              : needsTruncation
                ? `${plainDescription.slice(0, teaserLength)}...`
                : plainDescription}
          </p>

          {needsTruncation && (
            <button
              type="button"
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 cursor-pointer pt-1 block"
            >
              {showFullDesc ? "Show Less" : "Read More"}
            </button>
          )}
        </div>
      )}

      {/* Color Swatch Variant Selector */}
      {colors.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-sm font-normal text-zinc-950">
            Color: <span className="font-bold text-amber-950">{selectedColor?.name || colors[0]?.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {colors.map((c) => {
              const isSelected = (selectedColor?.name || colors[0]?.name) === c.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectColor(c)}
                  title={c.name}
                  aria-label={`Select ${c.name}`}
                  className="w-8 h-8 rounded-[5px] transition-all relative flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                >
                  <span className={`absolute inset-0 rounded-[5px] transition-all ${
                    isSelected
                      ? "border-2 border-amber-800 ring-2 ring-amber-800/30 scale-105 shadow-xs"
                      : "border border-gray-300 hover:scale-105 opacity-90 hover:opacity-100 shadow-2xs"
                  }`} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2 pt-1">
        <div className="text-sm font-normal text-zinc-950">Quantity</div>

        <div className="inline-flex items-center border border-gray-300 rounded-[5px] overflow-hidden bg-white shadow-2xs">
          <button
            type="button"
            onClick={handleDecreaseQty}
            aria-label="Decrease quantity"
            className="w-9 h-9 flex items-center justify-center text-base font-semibold text-neutral-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            &minus;
          </button>
          <span className="w-10 text-center text-sm font-semibold text-zinc-950">
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncreaseQty}
            aria-label="Increase quantity"
            className="w-9 h-9 flex items-center justify-center text-base font-semibold text-black hover:bg-gray-100 transition-colors cursor-pointer"
          >
            &#43;
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {/* Add To Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full py-3 px-6 rounded-[5px] bg-white border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white text-sm font-semibold text-center transition-all shadow-2xs font-['Manrope'] cursor-pointer"
        >
          Add To Cart
        </button>

        {/* Buy It Now */}
        <button
          type="button"
          onClick={handleBuyItNow}
          className="w-full py-3 px-6 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] text-center transition-all shadow-xs font-['Manrope'] cursor-pointer"
        >
          Buy It Now
        </button>
      </div>

      {/* Social Media Share Icons */}
      <div className="flex items-center gap-5 pt-3 text-amber-800">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Facebook">
          <FacebookLogo weight="fill" className="w-5 h-5 text-amber-800" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Instagram">
          <InstagramLogo weight="bold" className="w-5 h-5 text-amber-800" />
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="YouTube">
          <YoutubeLogo weight="fill" className="w-5 h-5 text-amber-800" />
        </a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="TikTok">
          <TiktokLogo weight="fill" className="w-5 h-5 text-amber-800" />
        </a>
        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="X (Twitter)">
          <XLogo weight="bold" className="w-5 h-5 text-amber-800" />
        </a>
        <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Pinterest">
          <PinterestLogo weight="fill" className="w-5 h-5 text-amber-800" />
        </a>
      </div>
    </div>
  )
}
