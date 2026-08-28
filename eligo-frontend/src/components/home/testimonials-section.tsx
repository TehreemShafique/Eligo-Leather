"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { WriteReviewButton } from "./write-review-button"
import { listApprovedReviews } from "@/modules/reviews/api"
import type { StoreReview } from "@/modules/reviews/schema"
import { resolveApiMediaUrl } from "@/lib/utils"

interface Testimonial {
  id: number | string
  author: string
  initials: string
  avatar: string
  timeAgo: string
  rating: number
  title: string
  content: string
  photos: string[]
}

function formatTimeAgo(createdAt?: string | null): string {
  if (!createdAt) return "Recently"
  const diffDays = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86400000,
  )
  if (diffDays < 1) return "Today"
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  }
  const months = Math.floor(diffDays / 30)
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`
  }
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? "" : "s"} ago`
}

function toInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function toTestimonial(review: StoreReview): Testimonial {
  return {
    id: review.id,
    author: review.reviewer_name,
    initials: toInitials(review.reviewer_name || "Eligo"),
    avatar: resolveApiMediaUrl(review.avatar_url),
    timeAgo: formatTimeAgo(review.created_at),
    rating: Math.min(5, Math.max(1, Math.round(review.rating))),
    title: review.title?.trim() || "Verified Purchase",
    content: review.body?.trim() || "",
    photos: (review.images.length > 0 ? review.images : review.photo_urls)
      .map(resolveApiMediaUrl)
      .slice(0, 3),
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const CARD_LEFT_POSITIONS = [
  "lg:left-[6.25cqw]",
  "lg:left-[36.09375cqw]",
  "lg:left-[65.9375cqw]",
] as const

const PHOTO_LEFT_POSITIONS = [
  "lg:left-[1.5625cqw]",
  "lg:left-[6.770833cqw]",
  "lg:left-[11.979167cqw]",
] as const

export function TestimonialsSection({
  productId,
}: {
  productId?: string | number | null
} = {}) {
  // Only admin-approved reviews are fetched; pending ones stay in the admin.
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)

  useEffect(() => {
    let mounted = true
    listApprovedReviews({ productId, perPage: 24 }).then((reviews) => {
      if (mounted) setTestimonials(shuffle(reviews).slice(0, 3).map(toTestimonial))
    })
    return () => {
      mounted = false
    }
  }, [productId])

  const hasCards = Boolean(testimonials && testimonials.length > 0)

  return (
    <section className="w-full bg-slate-50 font-['Manrope']">
      <div className="mx-auto w-full max-w-[1920px] [container-type:inline-size]">
        <div className={`relative px-4 py-12 sm:px-6 sm:py-16 ${hasCards ? "lg:h-[36.458333cqw] lg:overflow-hidden lg:p-0" : ""}`}>
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:absolute lg:inset-0 lg:mb-0 lg:block">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl lg:absolute lg:left-[6.25cqw] lg:top-[4.6875cqw] lg:text-[2.5cqw] lg:leading-[3.645833cqw]">
              What Our Customer Say
            </h2>

            <WriteReviewButton productId={productId} />
          </header>

          {hasCards && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:absolute lg:inset-0 lg:block">
              {testimonials!.map((item, cardIndex) => (
                <article
                  key={item.id}
                  className={`relative flex min-h-[477px] flex-col rounded-[20px] border border-amber-800 bg-white p-6 lg:absolute lg:top-[10.416667cqw] lg:h-[24.84375cqw] lg:min-h-0 lg:w-[27.760417cqw] lg:block lg:rounded-[1.041667cqw] lg:p-0 ${CARD_LEFT_POSITIONS[cardIndex]}`}
                >
                  <div className="flex items-center justify-between lg:contents">
                    <div className="flex items-center gap-4 lg:contents">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-amber-800 lg:absolute lg:left-[1.5625cqw] lg:top-[1.5625cqw] lg:h-[3.333333cqw] lg:w-[3.333333cqw]">
                        {item.avatar ? (
                          <Image
                            src={item.avatar}
                            alt={item.author}
                            fill
                            sizes="(min-width: 1024px) 64px, 64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white lg:text-[1.041667cqw]">
                            {item.initials}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold leading-8 text-black lg:absolute lg:left-[5.78125cqw] lg:top-[2.552083cqw] lg:text-[1.041667cqw] lg:leading-[1.666667cqw]">
                        {item.author}
                      </h3>
                    </div>

                    <span className="text-sm font-normal text-black lg:absolute lg:left-[20.989583cqw] lg:top-[2.65625cqw] lg:text-[0.9375cqw]">
                      {item.timeAgo}
                    </span>
                  </div>

                  <div className="mt-6 h-10 w-40 text-3xl font-normal leading-10 tracking-[3px] text-yellow-400 lg:absolute lg:left-[1.5625cqw] lg:top-[6.25cqw] lg:mt-0 lg:h-[2.083333cqw] lg:w-[8.333333cqw] lg:text-[1.5625cqw] lg:leading-[2.083333cqw] lg:tracking-[0.15625cqw]">
                    {"★".repeat(item.rating)}
                  </div>

                  <h4 className="mt-5 text-xl font-bold leading-8 text-black lg:absolute lg:left-[1.5625cqw] lg:top-[9.479167cqw] lg:mt-0 lg:text-[1.041667cqw] lg:leading-[1.666667cqw]">
                    {item.title}
                  </h4>

                  <p className="mt-3 text-base font-normal leading-relaxed text-black lg:absolute lg:left-[1.5625cqw] lg:top-[12.083333cqw] lg:mt-0 lg:w-[24.635417cqw] lg:text-[0.9375cqw] lg:leading-normal">
                    {item.content}
                  </p>

                  {item.photos.length > 0 && (
                    <div className="mt-auto flex items-center gap-3 pt-6 lg:contents">
                      {item.photos.map((photo, photoIndex) => (
                        <div
                          key={photo}
                          className={`relative h-24 w-24 overflow-hidden rounded-[5px] bg-gray-100 lg:absolute lg:top-[18.59375cqw] lg:h-[5cqw] lg:w-[5cqw] lg:rounded-[0.260417cqw] ${PHOTO_LEFT_POSITIONS[photoIndex]}`}
                        >
                          <Image
                            src={photo}
                            alt={`${item.author} review attachment ${photoIndex + 1}`}
                            fill
                            sizes="(min-width: 1024px) 96px, 96px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  )
}
