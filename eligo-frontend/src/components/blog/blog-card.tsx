"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar } from "@phosphor-icons/react"
import type { BlogPostOut } from "@/modules/content/schema"

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr))
}

export function BlogCard({ post }: { post: BlogPostOut }) {
  const date = post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)
  const image = post.featured_image_url || post.thumbnail_url

  return (
    <article className="group min-w-0 font-['Manrope']">
      <Link href={`/blog/${post.handle}`} className="block">
        {/* Post Cover Image (empty frame when no image uploaded) */}
        <div className="relative h-72 w-full overflow-hidden rounded-[20px] bg-zinc-100 sm:h-80 lg:h-[20.833333cqw] lg:rounded-[1.041667cqw]">
          {image ? (
            <Image
              src={image}
              alt={post.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : null}
        </div>

        {/* Date & Metadata */}
        <div className="mt-[26px] flex items-center gap-[5px] text-sm font-normal leading-4 text-amber-800 lg:mt-[1.354167cqw] lg:gap-[0.260417cqw] lg:text-[0.729167cqw] lg:leading-[0.833333cqw]">
          <Calendar className="size-[11px] shrink-0 lg:size-[0.572917cqw]" />
          <span>{date}</span>
        </div>

        {/* Post Title */}
        <h3 className="mt-[11px] line-clamp-2 text-xl font-semibold leading-snug text-black transition-colors group-hover:text-amber-800 lg:mt-[0.572917cqw] lg:text-[1.041667cqw]">
          {post.title}
        </h3>

        {/* Post Excerpt */}
        {post.excerpt && (
          <p className="mt-4 line-clamp-2 text-lg font-normal leading-normal text-black lg:mt-[0.833333cqw] lg:text-[0.9375cqw]">
            {post.excerpt}
          </p>
        )}
      </Link>
    </article>
  )
}
