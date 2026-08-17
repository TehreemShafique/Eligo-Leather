import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const candidates = [1, total, current - 1, current, current + 1]
  const sorted = [...new Set(candidates)]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const items: (number | "…")[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) items.push("…")
    items.push(p)
    prev = p
  }
  return items
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <CaretLeft className="size-4" weight="bold" />
      </Button>

      {getPageItems(page, pageCount).map((item, index) =>
        item === "…" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="px-1.5 text-xs text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? "primary" : "ghost"}
            size="icon"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <CaretRight className="size-4" weight="bold" />
      </Button>
    </nav>
  )
}
