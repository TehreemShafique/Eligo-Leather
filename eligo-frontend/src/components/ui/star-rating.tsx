interface StarRatingProps {
  rating: number
  reviewCount?: number
  className?: string
  showCount?: boolean
}

export function StarRating({
  rating,
  reviewCount = 0,
  className = "",
  showCount = true,
}: StarRatingProps) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)))
  const stars = "★".repeat(filled) + "☆".repeat(5 - filled)

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="font-serif text-amber-500 tracking-[3px] whitespace-nowrap"
        aria-label={`Rated ${rating.toFixed(1)} out of 5 stars`}
      >
        {stars}
      </span>
      {showCount && (
        <span className="text-neutral-400">
          {reviewCount} Review{reviewCount === 1 ? "" : "s"}
        </span>
      )}
    </span>
  )
}