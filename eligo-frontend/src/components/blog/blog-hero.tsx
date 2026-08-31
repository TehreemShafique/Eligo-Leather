import Image from "next/image"
import Link from "next/link"

export interface FeaturedPost {
  slug: string
  title: string
  date: string
  excerpt: string
  image: string
}

const DEFAULT_FEATURED_POST: FeaturedPost = {
  slug: "timeless-black-leather-accessories",
  title: "Timeless Black Leather Accessories for Everyday Style",
  date: "Feb 4, 2026",
  excerpt:
    "Upgrade your daily essentials with a refined collection of black leather accessories designed for style, durability, and convenience. From a premium wallet and classic belt to a keychain, storage pouch, and cable organizer, each piece adds a polished look while keeping everyday items organized. The black leather finish with brass details creates a bold, elegant appearance suitable for both personal use and gifting.",
  image: "/images/blog_hero.webp",
}

interface BlogHeroProps {
  post?: FeaturedPost
}

export function BlogHero({ post = DEFAULT_FEATURED_POST }: BlogHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-slate-50 font-['Manrope']">
      <div className="relative mx-auto w-full max-w-[1920px] px-4 pb-16 pt-10 [container-type:inline-size] sm:px-6 sm:pt-14 lg:h-[47.916667cqw] lg:p-0">
        <h1 className="text-5xl font-bold leading-tight text-amber-800 sm:text-6xl lg:absolute lg:left-[6.25cqw] lg:top-[4.166667cqw] lg:text-[3.125cqw] lg:leading-[3.645833cqw]">
          Blog
        </h1>

        <div className="mt-10 grid grid-cols-1 items-center gap-8 lg:contents">
          <Link
            href={`/blog/${post.slug}`}
            aria-label={post.title}
            className="relative block h-[350px] w-full overflow-hidden rounded-[20px] bg-zinc-100 sm:h-[480px] lg:absolute lg:left-[6.25cqw] lg:top-[9.895833cqw] lg:h-[33.854167cqw] lg:w-[62.5cqw] lg:rounded-[1.041667cqw]"
          >
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                sizes="(min-width: 1024px) 62.5vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </Link>

          <div className="space-y-5 lg:contents">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl lg:absolute lg:left-[70.3125cqw] lg:top-[15.625cqw] lg:w-[20cqw] lg:text-[2.5cqw] lg:leading-[2.604167cqw]">
              <Link
                href={`/blog/${post.slug}`}
                className="transition-colors hover:text-amber-800"
              >
                {post.title}
              </Link>
            </h2>

            <p className="text-base font-normal leading-relaxed text-black sm:text-lg lg:absolute lg:left-[70.3125cqw] lg:top-[27.604167cqw] lg:w-[20cqw] lg:text-[0.9375cqw] lg:leading-normal">
              {post.excerpt}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}