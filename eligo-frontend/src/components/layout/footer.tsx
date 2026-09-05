import Link from "next/link"
import {
  FacebookLogo,
  InstagramLogo,
  PinterestLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr"

const FOOTER_COLUMNS = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Our Categories",
    links: [
      { label: "Wallets", href: "/categories/wallets" },
      { label: "Belts", href: "/categories/belts" },
      { label: "Key Chain", href: "/categories/keychains" },
      { label: "Cases", href: "/categories/cases" },
    ],
  },
  {
    title: "Our Policies",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Blog", href: "/blog" },
      { label: "Sale", href: "/sales" },
    ],
  },
] as const

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#", icon: FacebookLogo },
  { label: "Instagram", href: "#", icon: InstagramLogo },
  { label: "YouTube", href: "#", icon: YoutubeLogo },
  { label: "TikTok", href: "#", icon: TiktokLogo },
  { label: "X", href: "#", icon: XLogo },
  { label: "Pinterest", href: "#", icon: PinterestLogo },
] as const

export function Footer() {
  return (
    <footer className="w-full bg-black font-['Manrope'] text-white">
      <div className="relative mx-auto w-full max-w-[1920px] px-6 py-12 [container-type:inline-size] sm:px-8 lg:h-[20cqw] lg:overflow-hidden lg:p-0">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:absolute lg:left-[6.25cqw] lg:top-[2.604167cqw] lg:h-[9.166667cqw] lg:w-[92.5cqw] lg:grid-cols-[20cqw_20cqw_20cqw_20cqw] lg:gap-[4.166667cqw]">
          {FOOTER_COLUMNS.map((column) => (
            <section key={column.title}>
              <h2 className="text-lg font-bold leading-6 tracking-wide text-amber-800 lg:text-[0.9375cqw] lg:leading-[1.25cqw]">
                {column.title}
              </h2>

              <ul className="mt-5 flex flex-col gap-3 lg:mt-[1.09375cqw] lg:gap-[0.583333cqw]">
                {column.links.map((link) => (
                  <li key={link.label} className="h-6 lg:h-[1.25cqw]">
                    <Link
                      href={link.href}
                      className="whitespace-nowrap text-sm font-normal leading-6 tracking-wide text-white transition-colors hover:text-amber-500 lg:text-[0.729167cqw] lg:leading-[1.25cqw]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <h2 className="text-lg font-bold leading-6 tracking-wide text-amber-800 lg:text-[0.9375cqw] lg:leading-[1.25cqw]">
              Find Us
            </h2>

            <address className="mt-5 not-italic lg:mt-[1.041667cqw]">
              <p className="text-sm font-normal leading-7 tracking-wide text-white lg:text-[0.729167cqw] lg:leading-[1.458333cqw]">
                Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive
                Block, Gulberg Greens, Islamabad
              </p>
              <p className="text-sm font-normal leading-7 tracking-wide text-white/75 lg:text-[0.729167cqw] lg:leading-[1.458333cqw]">
                <a href="tel:0512745781" className="hover:text-amber-500">
                  051-2745781
                </a>
                <br />
                <a href="tel:03345399470" className="hover:text-amber-500">
                  0334-5399470
                </a>
              </p>
            </address>
          </section>
        </div>

        <div className="my-10 h-px w-full bg-white lg:absolute lg:left-[6.25cqw] lg:top-[15.46875cqw] lg:my-0 lg:w-[87.5cqw]" />

        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row lg:contents">
          <p className="text-center text-sm font-normal leading-5 tracking-wide text-white sm:text-left lg:absolute lg:left-[6.25cqw] lg:top-[17.708333cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]">
            © 2026, Eligo Leather, Design &amp; Develop By BitBlazeTec
          </p>

          <div className="flex items-start justify-end lg:absolute lg:left-[80.625cqw] lg:top-[17.083333cqw]">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center text-white transition-colors hover:text-amber-500 lg:h-[2.083333cqw] lg:w-[2.083333cqw]"
              >
                <Icon
                  weight="fill"
                  className="h-5 w-5 lg:h-[1.041667cqw] lg:w-[1.041667cqw]"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}