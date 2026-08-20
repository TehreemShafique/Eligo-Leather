import Link from "next/link"
import type { ReactNode } from "react"

interface SeoBlockProps {
  title: string
  children: ReactNode
  headingPosition: string
  bodyPosition: string
}

function SeoBlock({
  title,
  children,
  headingPosition,
  bodyPosition,
}: SeoBlockProps) {
  return (
    <div className="space-y-4 lg:contents">
      <h2
        className={`text-3xl font-bold leading-tight text-black sm:text-4xl lg:absolute lg:left-[6.25cqw] lg:text-[1.875cqw] lg:leading-[2.083333cqw] ${headingPosition}`}
      >
        {title}
      </h2>

      <div
        className={`text-lg font-normal leading-relaxed text-black sm:text-xl lg:absolute lg:left-[6.25cqw] lg:w-[87.5cqw] lg:text-[1.041667cqw] lg:leading-[1.458333cqw] ${bodyPosition}`}
      >
        {children}
      </div>
    </div>
  )
}

const inlineLinkClassName =
  "font-normal text-black underline transition-colors hover:text-amber-800"

export function CategorySeoSection() {
  return (
    <section className="w-full bg-slate-50 font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] space-y-10 px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:h-[113.4375cqw] lg:overflow-hidden lg:space-y-0 lg:p-0">
        <SeoBlock
          title="Explore Our Range of Bifold Wallets"
          headingPosition="lg:top-[5.729167cqw]"
          bodyPosition="lg:top-[9.6875cqw]"
        >
          Discover the perfect blend of functionality and style with our bifold
          wallet collection. Whether you&apos;re looking for a leather bifold
          wallet, a slim bifold wallet, or a men&apos;s bifold wallet with a coin
          pocket, we have something for everyone. Our collection includes unisex
          leather wallets suitable for both men and women, making them ideal for
          everyday use, travel companions, or thoughtful gifts for birthdays,
          anniversaries, and other special occasions.
          <br />
          <br />
          From budget wallets to luxury wallets, our range caters to all
          preferences. We also offer limited-time discounts and exclusive deals
          that you won’t find anywhere else.
        </SeoBlock>

        <SeoBlock
          title="Types of Bifold Wallets"
          headingPosition="lg:top-[19.0625cqw]"
          bodyPosition="lg:top-[23.020833cqw]"
        >
          Our collection features a variety of types of bifold wallets,
          including leather bifold wallets with money clips, perfect for those
          who prefer carrying cash securely. The men&apos;s bifold leather wallet
          is a classic choice for men who value durability and style. For those
          who need extra space for coins, the leather bifold wallet with a coin
          pocket is an excellent option. Minimalists will appreciate the slim
          bifold wallet, designed for a sleek and compact look. Traditional
          designs with modern touches are available in our double-fold wallet
          and two-fold wallet options.
          <br />
          <br />
          Each wallet is crafted with precision, ensuring it meets your needs
          while maintaining a stylish appearance.
        </SeoBlock>

        <SeoBlock
          title="Sizes and Compartments"
          headingPosition="lg:top-[33.958333cqw]"
          bodyPosition="lg:top-[37.916667cqw]"
        >
          Our bifold wallets come in various sizes to suit different preferences.
          Whether you need a compact wallet for daily use or a larger one for
          travel, we’ve got you covered.
          <br />
          <br />
          The compartments in our wallets are designed for maximum functionality.
          Cash compartments are spacious enough to hold bills neatly, while
          multiple card slots provide ample space for credit cards, IDs, and more.
          A secret pocket allows you to store valuable items discreetly, and an ID
          card slot offers easy access to your identification. For added
          convenience, a zipper compartment securely stores coins or small items,
          and a coin slot is designed for loose change. Some wallets are secured
          with a button to ensure your belongings stay safe.
          <br />
          <br />
          These compartments make our wallets highly functional, allowing you to
          organize receipts, photos, and other essentials effortlessly.
        </SeoBlock>

        <SeoBlock
          title="Materials and Colors"
          headingPosition="lg:top-[51.979167cqw]"
          bodyPosition="lg:top-[55.9375cqw]"
        >
          Our bifold wallets are made from premium leather materials, including
          cow leather, known for its durability and soft texture; crazy horse
          leather, celebrated for its rugged texture and longevity; and crocodile
          texture, which adds a luxurious and sophisticated look.
          <br />
          <br />
          Available in a variety of colors, such as black, dark brown, maroon, tan,
          blue, and brown, our wallets are designed to match your style.
        </SeoBlock>

        <SeoBlock
          title="Why Choose Our Bifold Wallets?"
          headingPosition="lg:top-[63.75cqw]"
          bodyPosition="lg:top-[67.708333cqw]"
        >
          Our{" "}
          <Link href="/categories/wallets" className={inlineLinkClassName}>
            men’s wallet
          </Link>{" "}
          and{" "}
          <Link href="/categories/wallets" className={inlineLinkClassName}>
            women’s wallet
          </Link>{" "}
          collections include durable and stylish bifold wallets, made from the
          finest materials to ensure quality. Rated highly for durability and
          functionality, they are considered the best{" "}
          <Link href="/categories/wallets" className={inlineLinkClassName}>
            long wallet
          </Link>{" "}
          and bifold wallet options available. These wallets are also perfect for
          gifting on birthdays, anniversaries, and other occasions.
          <br />
          <br />
          We offer fast delivery all over Pakistan, ensuring you receive your
          wallet quickly and conveniently. Whether you need a classic{" "}
          <Link href="/categories/cases" className={inlineLinkClassName}>
            passport cover
          </Link>{" "}
          for travel or a sleek wallet for daily use, our collection has something
          for everyone. Our easy returns policy allows you to shop worry-free, and
          safe and easy payment methods make transactions secure. Don’t miss out
          on our discount deals and exclusive offers!
        </SeoBlock>

        <SeoBlock
          title="Perfect for Every Occasion"
          headingPosition="lg:top-[80.208333cqw]"
          bodyPosition="lg:top-[84.166667cqw]"
        >
          Our bifold wallets are not just functional but also versatile. They are
          ideal for everyday use, being compact and easy to carry. As a travel
          companion, they are spacious and secure for all your essentials. They
          also make thoughtful gifts for loved ones.
        </SeoBlock>

        <SeoBlock
          title="Shop with Confidence"
          headingPosition="lg:top-[88.854167cqw]"
          bodyPosition="lg:top-[92.8125cqw]"
        >
          Our bifold wallets are trusted by thousands of happy customers and
          backed by a satisfaction guarantee. Made from the finest materials,
          they are designed to exceed your expectations. Exclusive deals are only
          available here, so don’t miss out on our special offers.
        </SeoBlock>

        <SeoBlock
          title="Purchase Your Bifold Wallet in Pakistan"
          headingPosition="lg:top-[97.5cqw]"
          bodyPosition="lg:top-[101.458333cqw]"
        >
          Whether you’re looking for a mens bifold wallet, a leather bifold wallet
          with a flap, or a bi-fold wallet template, our collection has it all.
          Explore our range of bifold wallets online in Pakistan and find the
          perfect match for your needs.
          <br />
          <br />
          With fast delivery, easy returns, and affordable prices, there’s no
          better place to buy a bifold wallet in Pakistan from the{" "}
          <Link href="/" className={inlineLinkClassName}>
            top leather brand in Pakistan
          </Link>
          . Don’t wait – shop now and enjoy the perfect combination of style,
          durability, and functionality!
        </SeoBlock>
      </div>
    </section>
  )
}