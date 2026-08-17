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
import { useCart } from "@/context/cart-context"

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
  onColorSelect?: (colorName: string) => void
}

const DEFAULT_COLORS: VariantColorOption[] = [
  { name: "Maroon", class: "bg-[#6B2A2A]", hex: "#6B2A2A", variantId: "45929680404670", isCanonical: true },
  { name: "Brown", class: "bg-[#5C240E]", hex: "#5C240E", variantId: "45929680404692", isCanonical: false },
  { name: "Tan", class: "bg-[#C88A58]", hex: "#C88A58", variantId: "45929680404693", isCanonical: false },
]

export function ProductBuyBox({
  id = 1,
  title = "ARDOR - Handmade Leather Card Holder Wallet",
  price = 1699,
  originalPrice = 5199,
  rating = 4.8,
  reviewText = "4.8 (1500+ Happy Customers)",
  description = "ARDOR is the ultimate blend of style and functionality to manage your essential cards.\n➢ Card Holder\n➢ 2 Card Slots",
  colors = DEFAULT_COLORS,
  onColorSelect,
}: ProductBuyBoxProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart } = useCart()

  // Initialize selected color from searchParams variant if present
  const initialVariantId = searchParams.get("variant")
  const initialColorObj = colors.find((c) => String(c.variantId) === initialVariantId) || colors[0]

  const [selectedColor, setSelectedColor] = useState<VariantColorOption>(initialColorObj)
  const [quantity, setQuantity] = useState(1)
  const [showFullDesc, setShowFullDesc] = useState(false)

  const handleSelectColor = (colorObj: VariantColorOption) => {
    setSelectedColor(colorObj)
    if (onColorSelect) {
      onColorSelect(colorObj.name)
    }

    if (colorObj.isCanonical || !colorObj.variantId) {
      window.history.replaceState(null, "", window.location.pathname)
      toast.info(`Selected Color: ${colorObj.name}`)
    } else {
      const newUrl = `${window.location.pathname}?variant=${colorObj.variantId}`
      window.history.replaceState(null, "", newUrl)
      toast.success(`Switched to ${colorObj.name} (Variant #${colorObj.variantId})`)
    }
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
      title,
      price,
      originalPrice,
      color: selectedColor.name,
      quantity,
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    })
    toast.success(`Added ${quantity}x "${title}" (${selectedColor.name}) to cart!`)
  }

  const handleBuyItNow = () => {
    addToCart({
      id,
      title,
      price,
      originalPrice,
      color: selectedColor.name,
      quantity,
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    })
    toast.success(`Proceeding to checkout for "${title}"...`)
    router.push("/checkout")
  }

  return (
    <div className="w-full space-y-5 font-['Manrope']">
      {/* Title matching Figma */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight tracking-tight">
        {title}
      </h1>

      {/* Pricing matching Figma */}
      <div className="flex items-baseline gap-3">
        <span className="text-xl sm:text-2xl font-bold text-zinc-950">
          Rs.{price.toLocaleString()}
        </span>
        {originalPrice && (
          <span className="text-sm text-gray-400 line-through">
            Rs.{originalPrice.toLocaleString()}
          </span>
        )}
      </div>

      {/* Rating Stars matching Figma */}
      <div className="flex items-center gap-2">
        <div className="flex items-center text-amber-500 gap-0.5 text-base font-serif tracking-widest">
          ★★★★☆
        </div>
        <span className="text-xs text-gray-700 font-medium">{reviewText}</span>
      </div>

      {/* Product Description with Clean Inline Read More Text */}
      <div className="space-y-1 text-sm text-gray-800">
        <p className="leading-relaxed whitespace-pre-line">
          {description}
        </p>

        {showFullDesc && (
          <p className="leading-relaxed text-gray-700 pt-1 animate-in fade-in duration-200">
            Crafted meticulously from 100% full-grain vintage leather, the {title} provides compact luxury. Its dual card slots keep your daily credit cards and ID secure without adding bulk to your pocket.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowFullDesc(!showFullDesc)}
          className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 cursor-pointer pt-1 block"
        >
          {showFullDesc ? "Show Less" : "Read More"}
        </button>
      </div>

      {/* Color Swatch Variant Selector (Squares with Rounded Borders matching Figma) */}
      <div className="space-y-2 pt-1">
        <div className="text-sm font-normal text-zinc-950">
          Color: <span className="font-bold text-amber-950">{selectedColor.name}</span>
        </div>

        {/* Squares with Rounded Borders */}
        <div className="flex items-center gap-2.5">
          {colors.map((c) => {
            const isSelected = selectedColor.name === c.name
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSelectColor(c)}
                title={c.name}
                aria-label={`Select ${c.name}`}
                className={`w-8 h-8 rounded-[5px] ${c.class} transition-all relative flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? "border-2 border-amber-800 ring-2 ring-amber-800/30 scale-105 shadow-xs"
                    : "border border-gray-300 hover:scale-105 opacity-90 hover:opacity-100 shadow-2xs"
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Quantity Selector matching Figma */}
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

      {/* Action Buttons matching Figma */}
      <div className="space-y-2.5 pt-2">
        {/* Add To Cart: White with Amber Border */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full py-3 px-6 rounded-[5px] bg-white border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white text-sm font-semibold text-center transition-all shadow-2xs font-['Manrope'] cursor-pointer"
        >
          Add To Cart
        </button>

        {/* Buy It Now: Solid Amber Brown */}
        <button
          type="button"
          onClick={handleBuyItNow}
          className="w-full py-3 px-6 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] text-center transition-all shadow-xs font-['Manrope'] cursor-pointer"
        >
          Buy It Now
        </button>
      </div>

      {/* Social Media Share Icons Row matching Figma (Facebook, Instagram, YouTube, TikTok, X, Pinterest) */}
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
