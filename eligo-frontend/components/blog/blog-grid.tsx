"use client"

import { useState, useEffect } from "react"
import { BlogCard, BlogPostItem } from "./blog-card"

const DEFAULT_BLOG_POSTS: BlogPostItem[] = Array.from({ length: 9 }, (_, idx) => ({
  id: idx + 1,
  slug: idx === 0 ? "luxury-leather-glasses-case" : `blog-post-${idx + 1}`,
  title:
    idx === 0
      ? "Luxury Leather Glasses Case: A Touch of Elegance for Everyday Use"
      : "Premium Black Leather Wallet for Timeless Everyday Style",
  date: "Feb 4, 2026",
  excerpt:
    "A sleek black leather wallet made for everyday use. Its clean design, durable finish, and compact shape keep your cash and essential cards organized while aging gracefully.",
  image:
    idx % 3 === 0
      ? "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600"
      : idx % 3 === 1
      ? "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600"
      : "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
}))

export function BlogGrid({ initialPosts = DEFAULT_BLOG_POSTS }: { initialPosts?: BlogPostItem[] }) {
  const [dbPosts, setDbPosts] = useState<BlogPostItem[] | null>(null)
  const [visibleCount, setVisibleCount] = useState(6)

  useEffect(() => {
    let isMounted = true
    const fetchDbBlogs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/blog-posts/")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            const mapped: BlogPostItem[] = data.map((p: any) => ({
              id: p.id,
              slug: p.handle || `blog-post-${p.id}`,
              title: p.title,
              excerpt: p.excerpt || (p.body ? p.body.replace(/<[^>]+>/g, '').slice(0, 140) + '...' : p.title),
              image: p.featured_image_url || p.thumbnail_url || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
              date: p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Feb 4, 2026"
            }))
            setDbPosts(mapped)
          }
        }
      } catch (err) {
        console.log("Blog posts DB API offline, using default sample posts.")
      }
    }
    fetchDbBlogs()
    return () => {
      isMounted = false
    }
  }, [])

  const postsList = dbPosts && dbPosts.length > 0 ? dbPosts : (initialPosts.length > 0 ? initialPosts : DEFAULT_BLOG_POSTS)

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, postsList.length))
  }

  return (
    <section className="py-12 font-['Manrope']">
      {/* Section Title */}
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl font-bold text-black tracking-tight">
          Latest insights and trends
        </h2>
        <p className="mt-2 text-gray-600 text-base">
          Discover stories, leather care guides, and styling tips from Eligo Leather craftsmen.
        </p>
      </div>

      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {postsList.slice(0, visibleCount).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < postsList.length && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] transition-colors shadow-md font-['Manrope'] cursor-pointer"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  )
}
