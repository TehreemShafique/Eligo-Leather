"use client"

import Image from "next/image"
import { Calendar } from "@phosphor-icons/react"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FaqSection, type FAQItem } from "@/components/home/faq-section"
import { BlogCommentForm } from "./blog-comment-form"
import type { BlogPostOut } from "@/modules/content/schema"

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr))
}

export interface BlogFaq {
  question: string
  answer: string
}

export function BlogDetailContent({
  post,
  faqs,
}: {
  post: BlogPostOut
  faqs?: BlogFaq[]
}) {
  const title = post.title
  const date = post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)
  const image = post.featured_image_url || post.thumbnail_url || "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=1200"
  const body = post.body || ""

  // Admin-authored FAQs for this post reuse the shared FAQ section design.
  const faqItems: FAQItem[] | null = faqs && faqs.length > 0
    ? faqs.map((faq) => ({
        ...faq,
        icon: "/images/homepage/17_rectangle_1699.webp",
      }))
    : null

  return (
    <article className="min-h-screen bg-slate-50 font-['Manrope']">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-6 sm:px-6 lg:px-0 lg:pb-[4.166667vw]">
        {/* SEO Breadcrumbs */}
        <div className="mb-8">
          <PageBreadcrumb positioned={false}
            items={[
              { label: "Blog", href: "/blog" },
              { label: title },
            ]}
          />
        </div>

        {/* Banner Cover Image */}
        <div className="relative aspect-[24/13] w-full overflow-hidden rounded-[20px] bg-zinc-100">
          <Image src={image} alt={title} fill priority unoptimized className="object-cover" />
        </div>

        {/* Date & Title */}
        <div className="mt-5">
          <div className="flex items-center gap-[5px] text-sm font-normal leading-4 text-amber-800">
            <Calendar className="size-[11px]" />
            <span>{date}</span>
          </div>

          <h1 className="mt-[19px] text-4xl font-bold leading-tight text-black sm:text-5xl lg:text-5xl lg:leading-[56px]">
            {title}
          </h1>
        </div>

        {/* Author & Category */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <span>By <span className="font-semibold text-black">{post.author}</span></span>
          {post.blog && (
            <span className="rounded-full bg-amber-800/10 px-3 py-1 text-xs font-semibold text-amber-800">
              {post.blog}
            </span>
          )}
        </div>

        {/* Tags */}
        {post.tags && (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.split(",").map((tag) => (
              <span key={tag.trim()} className="text-xs text-gray-500">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Article Body — rendered from backend HTML */}
        {body ? (
          <div
            className="mt-7 space-y-10 text-lg font-normal leading-relaxed text-black sm:text-xl sm:leading-[1.5] lg:space-y-12 prose prose-stone max-w-none [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-black [&_h2]:sm:text-4xl [&_h2]:sm:leading-10 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:leading-9 [&_h3]:text-black [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-amber-800 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <div className="mt-7 text-lg text-gray-500">
            No content available for this post.
          </div>
        )}
      </div>

      {/* FAQ Accordion Section — post FAQs when the admin added them */}
      <FaqSection items={faqItems ?? undefined} />

      {/* Comment Form Section */}
      <BlogCommentForm />
    </article>
  )
}
