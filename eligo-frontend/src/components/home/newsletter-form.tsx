"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { toast } from "sonner"

export function NewsletterForm() {
  const [email, setEmail] = useState("")

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) return

    toast.success("Thank you for subscribing to Eligo Leather updates!")
    setEmail("")
  }

  return (
    <form
      onSubmit={handleSubscribe}
      className="relative z-20 mt-7 h-14 w-full rounded-[42px] bg-white lg:absolute lg:left-[5.208333cqw] lg:top-[18.165625cqw] lg:mt-0 lg:h-[2.916667cqw] lg:w-[34.6875cqw] lg:rounded-[2.1875cqw]"
    >
      <span className="absolute left-[18px] top-[18px] h-5 w-5 sm:left-[30px] lg:left-[1.5625cqw] lg:top-[1.041667cqw] lg:h-[1.041667cqw] lg:w-[1.041667cqw]">
        <Image
          src="/images/homepage/16_rectangle_1688.webp"
          alt=""
          fill
          sizes="20px"
          className="object-contain"
        />
      </span>

      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email"
        className="h-full w-full rounded-[42px] bg-transparent pl-12 pr-32 text-sm font-medium text-black outline-none placeholder:text-neutral-400 sm:pl-[54px] sm:pr-36 lg:rounded-[2.1875cqw] lg:pl-[2.8125cqw] lg:pr-[7.291667cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
      />

      <button
        type="submit"
        className="absolute right-1 top-1 inline-flex h-12 w-28 items-center justify-center rounded-[32px] bg-black text-sm font-semibold text-white transition-colors hover:bg-amber-800 sm:right-[5px] sm:top-[5px] sm:w-32 lg:right-auto lg:left-[27.760417cqw] lg:top-[0.260417cqw] lg:h-[2.5cqw] lg:w-[6.666667cqw] lg:rounded-[1.666667cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
      >
        Subscribe
      </button>
    </form>
  )
}