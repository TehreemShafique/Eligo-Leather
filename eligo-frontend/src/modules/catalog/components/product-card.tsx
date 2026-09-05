import Image from "next/image"
import Link from "next/link"
import { getProductSlug } from "@/modules/catalog/types"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import type { ProductListOut } from "@/modules/catalog/schema"

export type ProductCardProps = {
  product: ProductListOut
  className?: string
}

function ProductPrice({ product }: { product: ProductListOut }) {
  if (!product.price) {
    return <span className="text-xs text-muted-foreground">Price on request</span>
  }

  const price = Number(product.price)
  const compareAt = product.compare_at_price ? Number(product.compare_at_price) : null
  const onSale = compareAt !== null && compareAt > price

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm font-medium text-brand-black">{formatCurrency(price)}</span>
      {onSale ? (
        <span className="text-xs text-muted-foreground line-through">
          {formatCurrency(compareAt)}
        </span>
      ) : null}
    </div>
  )
}

export function ProductCard({ product, className }: ProductCardProps) {
  const slug = getProductSlug(product)

  return (
    <Link
      href={`/${slug}`}
      className={cn(
        "group flex flex-col overflow-hidden bg-card ring-1 ring-foreground/10 transition-colors duration-150 hover:ring-brand-brown/50",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-brand-black/5">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-brand-black/30">
            <span className="text-[10px] font-medium uppercase tracking-widest">No image</span>
          </div>
        )}
        <Badge
          variant="outline"
          className="absolute top-3 left-3 bg-brand-white/90 text-brand-black backdrop-blur-sm"
        >
          {product.category}
        </Badge>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-medium text-brand-black transition-colors group-hover:text-brand-brown">
          {product.title}
        </h3>
        <ProductPrice product={product} />
      </div>
    </Link>
  )
}
