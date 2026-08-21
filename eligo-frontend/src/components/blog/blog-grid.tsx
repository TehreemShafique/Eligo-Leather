"use client"

import { useState } from "react"
import { BlogCard } from "./blog-card"
import type { BlogPostOut } from "@/modules/content/schema"

export function BlogGrid({ initialPosts = [] }: { initialPosts?: BlogPostOut[] }) {
  const [visibleCount, setVisibleCount] = useState(9)

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, initialPosts.length))
  }

  if (initialPosts.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1920px] bg-slate-50 px-4 pb-24 pt-12 font-['Manrope'] sm:px-6 lg:px-[6.25cqw] lg:pb-[6.666667cqw] lg:pt-[4.166667cqw]">
        <div className="mb-10 text-center lg:mb-[2.083333cqw]">
          <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl lg:text-[2.5cqw] lg:leading-[3.645833cqw]">
            Latest insights and trends
          </h2>
        </div>
        <p className="text-center text-gray-500 text-lg">No blog posts available yet. Check back soon!</p>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[1920px] bg-slate-50 px-4 pb-24 pt-12 font-['Manrope'] [container-type:inline-size] sm:px-6 lg:px-[6.25cqw] lg:pb-[6.666667cqw] lg:pt-[4.166667cqw]">
      {/* Section Title */}
      <div className="mb-10 text-center lg:mb-[2.083333cqw]">
        <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl lg:text-[2.5cqw] lg:leading-[3.645833cqw]">
          Latest insights and trends
        </h2>
      </div>

      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-[2.083333cqw] lg:gap-y-[2.708333cqw]">
        {initialPosts.slice(0, visibleCount).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < initialPosts.length && (
        <div className="mt-14 flex justify-center lg:mt-[3.125cqw]">
          <button
            onClick={handleLoadMore}
            className="w-32 cursor-pointer rounded-[5px] bg-amber-800 px-7 py-2.5 font-['Manrope'] text-sm font-semibold leading-5 text-white transition-colors hover:bg-amber-900"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  )
}
