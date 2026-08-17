"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar } from "@phosphor-icons/react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { FaqSection } from "@/components/home/faq-section"
import { BlogCommentForm } from "./blog-comment-form"

interface BlogArticle {
  title?: string
  date?: string
  image?: string
}

export function BlogDetailContent({ article }: { article?: BlogArticle }) {
  const title =
    article?.title || "Luxury Leather Glasses Case: A Touch of Elegance for Everyday Use"
  const date = article?.date || "Feb 4, 2026"
  const image =
    article?.image ||
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=1200"

  return (
    <article className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SEO Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Blog", href: "/blog" },
              { label: title },
            ]}
          />
        </div>

        {/* Banner Cover Image */}
        <div className="relative w-full h-[350px] sm:h-[500px] lg:h-[650px] rounded-[20px] overflow-hidden mb-8 shadow-md">
          <Image src={image} alt={title} fill priority className="object-cover" />
        </div>

        {/* Date & Title */}
        <div className="max-w-4xl mx-auto space-y-4 mb-12">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight tracking-tight">
            {title}
          </h1>
        </div>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto space-y-10 text-black text-lg sm:text-xl font-normal leading-relaxed">
          {/* Intro Section */}
          <div className="space-y-4">
            <p>
              Protecting your eyewear can be a real challenge, especially when most cases on the market are either bulky or made from low-quality materials. A poorly designed case not only compromises the safety of your glasses but also detracts from your personal style.
            </p>
            <p>
              The solution lies in investing in a luxury leather glasses case. These cases are designed to offer the perfect blend of durability, protection, and style. Crafted from high-quality leather, they keep your glasses safe while adding a touch of elegance to your accessories.
            </p>
            <p>
              In this guide, we’ll explore the benefits of using a leather glasses case, its different types, and why brands like Eligo Leather are the go-to choice in Pakistan for luxury leather goods.
            </p>
          </div>

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Eyeglass Holder: Keeping Your Glasses Safe
            </h2>
            <p>
              An eyeglass holder is an essential accessory for anyone who wears glasses or sunglasses. It prevents scratches, dust, and accidental damage, ensuring your eyewear remains in pristine condition.
            </p>
            <p>
              A{" "}
              <Link href="/categories/cases" className="underline hover:text-amber-800">
                high-quality leather sunglasses case
              </Link>{" "}
              or eyeglass case combines functionality with aesthetics. These cases are lightweight yet sturdy, offering superior protection and style for your eyewear.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Leather Glasses Case: A Timeless Accessory
            </h2>
            <p>
              A leather glasses case is more than just a protective holder; it’s a statement of sophistication. Unlike plastic or fabric cases, leather cases are durable and exude luxury, making them perfect for both casual and formal settings.
            </p>
            <h3 className="text-2xl font-bold text-black pt-2">
              Benefits of a Leather Glasses Case:
            </h3>
            <ul className="space-y-2 pl-4 border-l-2 border-amber-800">
              <li>
                <span className="font-bold">Durability:</span> Leather lasts longer than synthetic materials.
              </li>
              <li>
                <span className="font-bold">Aesthetic Appeal:</span> Its rich texture and elegant design enhance your style.
              </li>
              <li>
                <span className="font-bold">Eco-Friendly:</span> Leather is a natural and biodegradable material.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Luxury Leather Glasses Case: Elegance Meets Functionality
            </h2>
            <p>
              If you’re looking for the best way to protect your eyewear while showcasing your refined taste, a luxury leather glasses case is the answer. These cases are crafted from premium leather, offering unmatched quality and a sleek design.
            </p>
            <p>
              At Eligo Leather, our leather glasses case is thoughtfully designed to meet the needs of discerning customers in Pakistan who value both functionality and fashion. Available in three timeless colors, it combines elegance with practicality to suit your everyday style.
            </p>
            <h3 className="text-2xl font-bold text-black pt-2">
              Why Choose a Luxury Leather Glasses Case?
            </h3>
            <ul className="space-y-2 pl-4 border-l-2 border-amber-800">
              <li>
                <span className="font-bold">Enhanced Protection:</span> Leather interiors are soft and gentle on lenses which prevent scratches and impacts.
              </li>
              <li>
                <span className="font-bold">Stylish Design:</span> Perfect for both everyday use and special occasions.
              </li>
              <li>
                <span className="font-bold">Customizable Options:</span> Many luxury brands offer personalized designs.
              </li>
            </ul>
            <p className="pt-2">
              For those in Pakistan, Eligo Leather offers an exceptional collection of luxury glasses cases tailored to your needs.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Optical Cover: Practical and Chic
            </h2>
            <p>
              An optical cover is a must-have accessory for anyone who wants to protect their glasses without compromising on style. Leather optical covers are particularly popular due to their durability and luxurious appeal.
            </p>
            <h3 className="text-2xl font-bold text-black pt-2">
              Features of a High-Quality Optical Cover:
            </h3>
            <ul className="space-y-1 list-disc list-inside text-gray-800">
              <li>Compact and lightweight design.</li>
              <li>Secure closure mechanisms to keep your glasses safe.</li>
              <li>Sleek, minimalist aesthetics.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Best Sunglasses Case: Combining Protection and Style
            </h2>
            <p>
              Finding the best sunglasses case can be challenging, especially with so many options on the market. A good sunglasses case should not only protect your glasses but also complement your personal style.
            </p>
            <h3 className="text-2xl font-bold text-black pt-2">
              Why Leather is the Best Option:
            </h3>
            <ul className="space-y-2 pl-4 border-l-2 border-amber-800">
              <li>
                <span className="font-bold">Scratch Resistance:</span> Leather interiors are soft and gentle on lenses.
              </li>
              <li>
                <span className="font-bold">Long-Lasting Material:</span> Unlike synthetic cases, leather retains its quality over time.
              </li>
              <li>
                <span className="font-bold">Timeless Appeal:</span> Leather never goes out of style.
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Leather Glasses Pouch: Convenience Redefined
            </h2>
            <p>
              A leather glasses pouch offers a more flexible and lightweight alternative to traditional hard cases. These pouches are easy to carry and ideal for everyday use, ensuring your glasses are always within reach.
            </p>
            <h3 className="text-2xl font-bold text-black pt-2">
              Benefits of a Leather Glasses Pouch:
            </h3>
            <ul className="space-y-1 list-disc list-inside text-gray-800">
              <li>Compact size for easy portability.</li>
              <li>Stylish designs that suit every occasion.</li>
              <li>Durable materials that provide lasting protection.</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Handmade Leather Cases: Artisanal Quality
            </h2>
            <p>
              For those who appreciate craftsmanship, handmade leather cases are the perfect choice. These cases are carefully crafted by skilled artisans, ensuring each piece is unique and of the highest quality. If you&apos;re drawn to finely crafted leather goods, don&apos;t miss our feature on the{" "}
              <Link href="/blog" className="underline hover:text-amber-800">
                Leather Keychain: The Perfect Blend of Style and Utility
              </Link>
              —a small accessory that brings the same level of elegance and functionality to your everyday essentials.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Conclusion
            </h2>
            <p>
              A luxury leather glasses case is an investment in both style and functionality. Whether you’re protecting prescription glasses or sunglasses, leather cases offer unparalleled durability and elegance. Brands like Eligoleather provide a wide range of options, including leather sunglasses cases, optical covers, and handmade pouches—catering to the needs of customers in Pakistan and beyond. If you admire premium leather accessories, you’ll also appreciate the elegance of our{" "}
              <Link href="/categories/cases" className="underline hover:text-amber-800">
                Leather Cigarette Case: A Stylish and Practical Accessory
              </Link>
              . Crafted with the same attention to detail and timeless design, it’s the perfect complement for those who value both sophistication and quality in their everyday carry.
            </p>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <FaqSection />

        {/* Comment Form Section */}
        <BlogCommentForm />
      </div>
    </article>
  )
}
