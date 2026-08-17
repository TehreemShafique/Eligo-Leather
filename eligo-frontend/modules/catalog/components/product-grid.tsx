import { ProductCard } from "@/modules/catalog/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { cn } from "@/lib/utils"
import type { ProductListOut } from "@/modules/catalog/schema"

export type ProductGridProps = {
  products: ProductListOut[]
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription = "Products added in the admin panel will appear here automatically.",
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className="ring-1 ring-foreground/10"
      />
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col overflow-hidden ring-1 ring-foreground/10">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4 rounded-none" />
            <Skeleton className="h-4 w-1/3 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  )
}
