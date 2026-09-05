import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({ title: "Leather Sales and Special Offers", description: "Explore Eligo Leather sales, seasonal promotions, bundle savings and special offers on handcrafted genuine leather products and accessories.", path: "/sales", keywords: ["leather sale Pakistan", "leather product discounts"] })

export default function SalesPage() {
  return (
    <div className="relative left-1/2 w-[min(1920px,100vw)] -translate-x-1/2 bg-slate-50 font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] space-y-10 px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:px-8 min-[1800px]:h-[1725px] min-[1800px]:overflow-hidden min-[1800px]:space-y-0 min-[1800px]:p-0">
        <PageBreadcrumb label="Sales" />

        <h1 className="text-5xl font-bold leading-tight text-amber-800 sm:text-6xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[76px] min-[1800px]:leading-[70px]">
          Sales
        </h1>

        <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[186px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
          At <strong className="font-bold">Eligoleather,</strong> we believe that
          luxury and affordability can go hand in hand. We&apos;re committed to
          offering you exclusive deals and seasonal promotions on our finest
          leather goods, so you can enjoy premium wallets, belts, and keychain
          covers without compromising on quality or style.
        </p>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[276px]">
            Current Sales and Offers
          </h2>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[352px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Seasonal Sales:</strong> Explore our
              exclusive seasonal sales for limited-time discounts on a selection
              of our bestselling leather products. Whether you&apos;re looking
              for a classic leather wallet or a stylish belt, our seasonal
              promotions make it easier to upgrade your collection.
            </p>
            <p>
              <strong className="font-bold">Clearance Deals:</strong> Don&apos;t
              miss out on our Clearance Section where you&apos;ll find discounted
              items, including past collections and final-sale pieces. These
              products are limited in stock, so act fast before they&apos;re gone!
            </p>
            <p>
              <strong className="font-bold">Bundle Offers:</strong> Shop our
              Bundle Offers to save more! Combine your favorite leather wallet,
              belt, and keychain cover for a special discounted rate. Bundling
              is the perfect way to enjoy multiple products while saving money.
            </p>
            <p>
              <strong className="font-bold">Free Shipping:</strong> For a
              limited time, we&apos;re offering Free Shipping on all orders over
              [amount]. Shop now and take advantage of this offer to get your
              favorite leather goods delivered straight to your doorstep
              without extra shipping costs.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[742px]">
            Sign Up for Exclusive Discounts
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[818px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Join our <strong className="font-bold">Eligoleather VIP </strong>
            List to receive:
          </p>

          <div className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[868px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <strong className="font-bold">Exclusive discount codes</strong>{" "}
            delivered directly to your inbox.
            <br />
            Early access to new collections and sales events.
            <br />
            Special offers and promotions tailored to your shopping preferences.
          </div>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[969px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Sign up today and be the first to know about exciting deals and new
            product releases!
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1029px]">
            Gift Cards
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1105px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Give the gift of timeless style with our{" "}
            <strong className="font-bold">Eligoleather Gift Cards.</strong>{" "}
            Available in various denominations, our gift cards are perfect for
            birthdays, holidays, or special occasions. They never expire and can
            be used toward any item on our website, including sale products.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1195px]">
            Referral Program
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1271px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Do you love your Eligoleather products? Refer a friend and both of
            you can enjoy savings! For every successful referral, you and your
            friend will receive{" "}
            <strong className="font-bold">[percentage]% off</strong> your next
            purchase. Share the elegance of leather craftsmanship and earn
            rewards for spreading the word.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1361px]">
            Upcoming Sales Events
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1437px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Keep an eye on our website for special sale events during:
          </p>

          <ul className="list-none text-lg font-bold leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1487px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>Black Friday</li>
            <li>Cyber Monday</li>
            <li>Holiday Sales</li>
            <li>New Year&apos;s Sales</li>
          </ul>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1615px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We regularly host flash sales and limited-time offers, so be sure to
            check back often and take advantage of these incredible deals.
          </p>
        </section>
      </div>
    </div>
  )
}

