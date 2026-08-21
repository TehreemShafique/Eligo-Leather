"use client"

import { useMemo, useState } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "@/components/common/toast"
import { Button } from "@/components/ui/button"
import type { VariantOut as ProductVariant } from "@/modules/catalog/schema"

export type VariantSelectorProps = {
  variants: ProductVariant[]
  className?: string
}

function isSoldOut(variant: ProductVariant): boolean {
  return variant.inventory_tracked && variant.inventory_quantity <= 0 && !variant.continue_selling_out_of_stock
}

export function VariantSelector({ variants, className }: VariantSelectorProps) {
  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.is_active),
    [variants],
  )

  const [selectedId, setSelectedId] = useState<number | null>(() => activeVariants[0]?.id ?? null)
  const [quantity, setQuantity] = useState(1)

  const selected = activeVariants.find((variant) => variant.id === selectedId) ?? activeVariants[0] ?? null

  const soldOut = selected ? isSoldOut(selected) : true
  const compareAt = selected?.compare_at_price ? Number(selected.compare_at_price) : null
  const price = selected ? Number(selected.price) : null
  const onSale = compareAt !== null && price !== null && compareAt > price

  function handleAddToCart() {
    if (!selected) return
    toast.info("Cart is coming soon — this product will be added in the next phase.")
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-medium text-brand-black">
          {price !== null ? formatCurrency(price) : "—"}
        </span>
        {onSale ? (
          <span className="text-sm text-muted-foreground line-through">{formatCurrency(compareAt)}</span>
        ) : null}
        {selected ? (
          <span
            className={cn(
              "ml-auto text-[10px] font-medium uppercase tracking-widest",
              soldOut ? "text-destructive" : "text-brand-brown",
            )}
          >
            {soldOut ? "Sold out" : `In stock · ${selected.inventory_quantity}`}
          </span>
        ) : null}
      </div>

      {activeVariants.length > 1 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Options
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Variant options">
            {activeVariants.map((variant) => {
              const isSelected = variant.id === selected?.id
              const soldOutVariant = isSoldOut(variant)
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={soldOutVariant}
                  onClick={() => {
                    setSelectedId(variant.id)
                    setQuantity(1)
                  }}
                  className={cn(
                    "border px-4 py-2 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-brand-brown bg-brand-brown text-brand-white"
                      : "border-brand-black/20 text-brand-black hover:border-brand-brown",
                    soldOutVariant && "cursor-not-allowed opacity-40",
                  )}
                >
                  {variant.title}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-stretch gap-3">
        <div className="flex items-center border border-brand-black/20">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 text-brand-black transition-colors hover:text-brand-brown disabled:opacity-40"
          >
            −
          </button>
          <span className="w-8 text-center text-xs font-medium text-brand-black" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= (selected?.inventory_quantity ?? 1)}
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 text-brand-black transition-colors hover:text-brand-brown disabled:opacity-40"
          >
            +
          </button>
        </div>

        <Button
          type="button"
          variant="primary"
          className="flex-1"
          disabled={!selected || soldOut}
          onClick={handleAddToCart}
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </Button>
      </div>
    </div>
  )
}
