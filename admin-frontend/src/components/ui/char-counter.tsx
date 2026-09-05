"use client"

// Counts visible characters in a string that may contain HTML tags (e.g. output
// from a rich-text editor). Strips tags/entities so the counter reflects what a
// search engine would actually index.
export function countVisibleChars(value: string): number {
  if (!value) return 0
  const stripped = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return stripped.trim().length
}

export function CharCounter({
  value,
  limit,
  className = "",
}: {
  value: string
  limit: number
  className?: string
}) {
  const count = countVisibleChars(value)
  const over = count > limit
  return (
    <span
      className={`text-[10px] font-semibold tabular-nums ${
        over ? "text-red-600" : "text-gray-400"
      } ${className}`}
    >
      {count}/{limit}
    </span>
  )
}
