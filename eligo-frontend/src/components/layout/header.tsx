"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  FacebookLogo,
  InstagramLogo,
  PinterestLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
  CaretRight,
  List,
  X,
} from "@phosphor-icons/react"
import { useCartStore, selectCartCount } from "@/modules/cart/store"
import { DEFAULT_HEADER_MENU, getHeaderMenu } from "@/modules/menu/api"
import type { MenuItem } from "@/modules/menu/types"
import { searchProducts } from "@/modules/catalog/api"
import type { ProductListOut } from "@/modules/catalog/schema"

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    position:
      "lg:left-[6.25cqw] lg:top-[0.572917cqw] lg:h-[0.9375cqw] lg:w-[0.9375cqw]",
    icon: FacebookLogo,
  },
  {
    label: "Instagram",
    href: "#",
    position:
      "lg:left-[8.5625cqw] lg:top-[0.572917cqw] lg:h-[0.9375cqw] lg:w-[0.9375cqw]",
    icon: InstagramLogo,
  },
  {
    label: "YouTube",
    href: "#",
    position:
      "lg:left-[10.875cqw] lg:top-[0.729167cqw] lg:h-[0.625cqw] lg:w-[0.9375cqw]",
    icon: YoutubeLogo,
  },
  {
    label: "TikTok",
    href: "#",
    position:
      "lg:left-[13.234375cqw] lg:top-[0.572917cqw] lg:h-[0.9375cqw] lg:w-[0.833333cqw]",
    icon: TiktokLogo,
  },
  {
    label: "X",
    href: "#",
    position:
      "lg:left-[15.448958cqw] lg:top-[0.625cqw] lg:h-[0.833333cqw] lg:w-[0.833333cqw]",
    icon: XLogo,
  },
  {
    label: "Pinterest",
    href: "#",
    position:
      "lg:left-[17.706771cqw] lg:top-[0.572917cqw] lg:h-[0.9375cqw] lg:w-[0.9375cqw]",
    icon: PinterestLogo,
  },
] as const

const DESKTOP_ITEM_POSITIONS = [
  "lg:left-[20.520833cqw]",
  "lg:left-[25.208333cqw]",
  "lg:left-[32.604167cqw]",
] as const

const ACTIONS = [
  {
    label: "Search",
    href: "#",
    image: "/images/homepage/7_rectangle_1674.webp",
    position: "lg:left-[85.416667cqw]",
  },
  {
    label: "Account",
    href: "/auth/login",
    image: "/images/homepage/6_rectangle_1660.webp",
    position: "lg:left-[87.5cqw]",
  },
  {
    label: "Wishlist",
    href: "/wishlist",
    image: "/images/homepage/5_rectangle_1659.webp",
    position: "lg:left-[90.104167cqw]",
  },
  {
    label: "Shopping Cart",
    href: "/cart",
    image: "/images/homepage/4_rectangle_1673.webp",
    position: "lg:left-[92.708333cqw]",
  },
] as const

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] [container-type:inline-size] lg:h-[7.291667cqw]">
        <div className="relative flex h-10 items-center justify-center bg-black px-4 text-white lg:absolute lg:left-0 lg:top-0 lg:h-[2.083333cqw] lg:w-full lg:px-0">
          <div className="hidden lg:block">
            {SOCIAL_LINKS.map(({ label, href, position, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className={`absolute text-white transition-opacity hover:opacity-70 ${position}`}
              >
                <Icon weight="fill" className="h-full w-full" />
              </Link>
            ))}
          </div>

          <p className="text-center text-xs font-semibold text-white sm:text-sm lg:absolute lg:left-[79.479167cqw] lg:top-[0.572917cqw] lg:text-left lg:text-[0.729167cqw] lg:leading-normal">
            Free Shipping on above 2000/- PKR Order
          </p>
        </div>

        <div className="relative flex h-20 items-center justify-between bg-white px-4 sm:px-6 lg:absolute lg:left-0 lg:top-[2.083333cqw] lg:h-[5cqw] lg:w-full lg:block lg:px-0">
          <Link
            href="/"
            aria-label="Eligo Leather home"
            className="relative h-12 w-36 shrink-0 lg:absolute lg:left-[6.25cqw] lg:top-[1.041667cqw] lg:h-[2.916667cqw] lg:w-[9.166667cqw]"
          >
            <Image
              src="/images/homepage/2_rectangle_1655.webp"
              alt="Eligo Leather"
              fill
              sizes="(min-width: 1920px) 176px, (min-width: 1024px) 9.167vw, 144px"
              className="object-contain object-left"
              priority
            />
          </Link>

          <HeaderInteractive />
        </div>
      </div>
    </header>
  )
}

function HeaderInteractive() {
  const pathname = usePathname()
  const cartCount = useCartStore(selectCartCount)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuItems, setMenuItems] =
    useState<MenuItem[]>(DEFAULT_HEADER_MENU)
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
  const [activeSubDropdownId, setActiveSubDropdownId] = useState<number | null>(
    null,
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductListOut[]>([])
  const [searchResultsQuery, setSearchResultsQuery] = useState("")
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    getHeaderMenu().then((items) => {
      if (isMounted) setMenuItems(items)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!searchOpen) return

    const closeSearch = (event: PointerEvent) => {
      const target = event.target as Node
      if (!searchPanelRef.current?.contains(target) && !searchButtonRef.current?.contains(target)) {
        setSearchOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false)
        searchButtonRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", closeSearch)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeSearch)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [searchOpen])


  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) return

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      const results = await searchProducts(query)
      if (!cancelled) {
        setSearchResults(results.slice(0, 6))
        setSearchResultsQuery(query)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  return (
    <>
      <nav aria-label="Main navigation" className="hidden lg:block">
        {menuItems.slice(0, 3).map((item, index) => {
          const isActive = pathname === item.url
          const hasChildren = Boolean(item.children?.length)

          return (
            <div
              key={item.id}
              className={`group absolute top-[2.083333cqw] z-40 ${DESKTOP_ITEM_POSITIONS[index]}`}
              onMouseEnter={() => {
                if (hasChildren) setActiveDropdownId(item.id)
              }}
              onMouseLeave={() => {
                setActiveDropdownId(null)
                setActiveSubDropdownId(null)
              }}
            >
              <Link
                href={item.url || "#"}
                className={`relative block whitespace-nowrap pb-[1.25cqw] text-[0.729167cqw] font-semibold leading-[1.041667cqw] transition-colors ${
                  isActive
                    ? "text-amber-800"
                    : "text-black hover:text-amber-800"
                }`}
              >
                {item.label}

                {hasChildren && (
                  <span className="absolute left-[4.375cqw] top-[0.3125cqw] h-[0.416667cqw] w-[0.416667cqw] transition-transform group-hover:rotate-180">
                    <Image
                      src="/images/homepage/3_rectangle_1656.webp"
                      alt=""
                      fill
                      sizes="8px"
                      className="object-contain"
                    />
                  </span>
                )}
              </Link>

              {hasChildren && activeDropdownId === item.id && (
                <div className="absolute left-0 top-[1.875cqw] z-50 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-2xl">
                  {item.children?.map((subItem) => {
                    const hasSubChildren = Boolean(subItem.children?.length)

                    return (
                      <div
                        key={subItem.id}
                        className="relative"
                        onMouseEnter={() =>
                          setActiveSubDropdownId(subItem.id)
                        }
                        onMouseLeave={() => setActiveSubDropdownId(null)}
                      >
                        <Link
                          href={subItem.url}
                          className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-800 transition-colors hover:bg-amber-50 hover:text-amber-800"
                        >
                          <span>{subItem.label}</span>
                          {hasSubChildren && (
                            <CaretRight className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </Link>

                        {hasSubChildren &&
                          activeSubDropdownId === subItem.id && (
                            <div className="absolute left-full top-0 z-50 ml-1 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-2xl">
                              {subItem.children?.map((nestedItem) => (
                                <Link
                                  key={nestedItem.id}
                                  href={nestedItem.url}
                                  className="block px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-800"
                                >
                                  {nestedItem.label}
                                </Link>
                              ))}
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1 lg:contents">
        {ACTIONS.map((action) => {
          const actionClassName = `relative h-9 w-9 rounded-full transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 lg:absolute lg:top-[2.083333cqw] lg:h-[1.041667cqw] lg:w-[1.041667cqw] lg:rounded-none ${action.position}`
          const icon = (
            <span className="absolute inset-[8px] lg:inset-0">
              <Image src={action.image} alt="" fill sizes="20px" className="object-contain" />
            </span>
          )

          if (action.label === "Search") {
            return (
              <button
                ref={searchButtonRef}
                key={action.label}
                type="button"
                aria-label={searchOpen ? "Close search" : "Search products"}
                aria-expanded={searchOpen}
                aria-controls="navbar-search-panel"
                onClick={() => setSearchOpen((open) => !open)}
                className={actionClassName}
              >
                {icon}
              </button>
            )
          }

          return (
            <Link key={action.label} href={action.href} aria-label={action.label} className={actionClassName}>
              {icon}
              {action.label === "Shopping Cart" && cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-amber-800 text-[9px] font-bold text-white lg:h-[0.833333cqw] lg:w-[0.833333cqw] lg:text-[0.46875cqw]">
                  {cartCount}
                </span>
              )}
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
          className="ml-1 inline-flex h-9 w-9 items-center justify-center text-black lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
        </button>
      </div>

      {searchOpen && (
        <div
          ref={searchPanelRef}
          id="navbar-search-panel"
          className="absolute left-0 top-20 z-[70] w-full border-t border-gray-100 bg-white shadow-2xl lg:top-[5cqw]"
        >
          <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search leather products..."
                aria-label="Search products"
                autoFocus
                className="h-12 w-full rounded-lg border border-amber-800 bg-white px-4 pr-12 text-sm text-black outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-amber-800/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            <div className="mt-4 max-h-[420px] overflow-y-auto" aria-live="polite">
              {searchQuery.trim().length < 2 ? (
                <p className="py-6 text-center text-sm text-neutral-500">
                  Type at least 2 characters to search products.
                </p>
              ) : searchResultsQuery !== searchQuery.trim() ? (
                <p className="py-6 text-center text-sm text-neutral-500">
                  Searching...
                </p>
              ) : searchResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">
                  No products found for &ldquo;{searchQuery.trim()}&rdquo;.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/${product.url_handle?.trim() || product.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-amber-800/20 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800"
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                        <Image
                          src={product.image_url || "/images/homepage/26_rectangle_1682.webp"}
                          alt={product.title}
                          fill
                          sizes="64px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-semibold text-black group-hover:text-amber-800">
                          {product.title}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-amber-800">
                          Rs.{Number(product.price || 0).toLocaleString("en-PK")}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="absolute left-0 top-20 z-50 w-full space-y-3 border-t border-gray-100 bg-white px-4 pb-6 pt-3 shadow-xl lg:hidden"
        >
          {menuItems.map((item) => (
            <div key={item.id}>
              <Link
                href={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1 text-base font-bold text-gray-900 hover:text-amber-800"
              >
                {item.label}
              </Link>

              {item.children?.length ? (
                <div className="my-1 space-y-2 border-l border-amber-800/30 pl-4">
                  {item.children.map((subItem) => (
                    <div key={subItem.id}>
                      <Link
                        href={subItem.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-sm font-semibold text-amber-900 hover:text-amber-800"
                      >
                        {subItem.label}
                      </Link>

                      {subItem.children?.length ? (
                        <div className="space-y-1 pl-3">
                          {subItem.children.map((nestedItem) => (
                            <Link
                              key={nestedItem.id}
                              href={nestedItem.url}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-0.5 text-xs text-gray-600 hover:text-amber-800"
                            >
                              {nestedItem.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      )}
    </>
  )
}
