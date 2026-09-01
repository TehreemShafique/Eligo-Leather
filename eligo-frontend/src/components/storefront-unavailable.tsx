import Link from "next/link"

// Rendered when a dynamic storefront route cannot confirm its content because
// the backend is unreachable (outage), NOT because the resource is missing.
// It carries noindex metadata (set by the caller) and deliberately avoids
// fabricating SEO content or pretending the page is a genuine 404.
export function StorefrontUnavailable() {
  return (
    <div className="min-h-screen bg-[#faf9f6] px-4 py-16 font-sans text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-800/20 bg-white p-8 text-center shadow-sm sm:p-12">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          This page is temporarily unavailable
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          We are unable to load this content right now. Please try again shortly,
          or explore our latest handcrafted leather products.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-amber-800 px-6 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-800 hover:text-white"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
