import Image from "next/image"
import { WriteReviewButton } from "./write-review-button"

interface Testimonial {
  id: number
  author: string
  avatar: string
  timeAgo: string
  rating: number
  title: string
  content: string
  photos: string[]
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    author: "Muhammad Usman",
    avatar: "/images/homepage/35_ellipse_115.webp",
    timeAgo: "1 month ago",
    rating: 5,
    title: "Excellent Quality",
    content:
      "I had ordered Handmade RFID Leather Wallet Open media 4 in modal HERALD - Handmade RFID Leather Wallet inspire online scammers they have the best quality... And I surprised to see that product 100 % recommend",
    photos: [
      "/images/homepage/36_image_user_picture__image_.webp",
      "/images/homepage/37_image_user_picture__image_.webp",
      "/images/homepage/38_image_user_picture__image_.webp",
    ],
  },
  {
    id: 2,
    author: "Muhammad Usman",
    avatar: "/images/homepage/39_ellipse_115.webp",
    timeAgo: "1 month ago",
    rating: 5,
    title: "Excellent Quality",
    content:
      "I had ordered Handmade RFID Leather Wallet Open media 4 in modal HERALD - Handmade RFID Leather Wallet inspire online scammers they have the best quality... And I surprised to see that product 100 % recommend",
    photos: [
      "/images/homepage/40_image_user_picture__image_.webp",
      "/images/homepage/41_image_user_picture__image_.webp",
      "/images/homepage/42_image_user_picture__image_.webp",
    ],
  },
  {
    id: 3,
    author: "Muhammad Usman",
    avatar: "/images/homepage/43_ellipse_115.webp",
    timeAgo: "1 month ago",
    rating: 5,
    title: "Excellent Quality",
    content:
      "I had ordered Handmade RFID Leather Wallet Open media 4 in modal HERALD - Handmade RFID Leather Wallet inspire online scammers they have the best quality... And I surprised to see that product 100 % recommend",
    photos: [
      "/images/homepage/44_image_user_picture__image_.webp",
      "/images/homepage/45_image_user_picture__image_.webp",
      "/images/homepage/46_image_user_picture__image_.webp",
    ],
  },
]

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

export function TestimonialsSection() {
  return (
    <section className="w-full bg-slate-50 font-['Manrope']">
      <div className="mx-auto w-full max-w-[1920px] [container-type:inline-size]">
        <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:h-[36.458333cqw] lg:overflow-hidden lg:p-0">
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:absolute lg:inset-0 lg:mb-0 lg:block">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl lg:absolute lg:left-[6.25cqw] lg:top-[4.6875cqw] lg:text-[2.5cqw] lg:leading-[3.645833cqw]">
              What Our Customer Say
            </h2>

            <WriteReviewButton />
          </header>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:absolute lg:inset-0 lg:block">
            {TESTIMONIALS.map((item, cardIndex) => (
              <article
                key={item.id}
                className={`relative flex min-h-[477px] flex-col rounded-[20px] border border-amber-800 bg-white p-6 lg:absolute lg:top-[10.416667cqw] lg:h-[24.84375cqw] lg:min-h-0 lg:w-[27.760417cqw] lg:block lg:rounded-[1.041667cqw] lg:p-0 ${CARD_LEFT_POSITIONS[cardIndex]}`}
              >
                <div className="flex items-center justify-between lg:contents">
                  <div className="flex items-center gap-4 lg:contents">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full lg:absolute lg:left-[1.5625cqw] lg:top-[1.5625cqw] lg:h-[3.333333cqw] lg:w-[3.333333cqw]">
                      <Image
                        src={item.avatar}
                        alt={item.author}
                        fill
                        sizes="(min-width: 1024px) 64px, 64px"
                        className="object-cover"
                      />
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
              </article>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}