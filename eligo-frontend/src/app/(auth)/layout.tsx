import Link from "next/link"
import { STORE_NAME } from "@/lib/constants"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-black p-10 text-brand-white lg:flex lg:p-14">
        <Link href="/" className="text-sm font-semibold tracking-widest">
          {STORE_NAME.toUpperCase()}
        </Link>

        <div>
          <p className="text-3xl leading-tight font-semibold">
            Handcrafted leather goods.
          </p>
          <p className="mt-3 max-w-sm text-sm/relaxed text-brand-white/70">
            Each piece is cut, stitched and finished by hand to last a lifetime.
          </p>
          <div className="mt-8 h-px w-16 bg-brand-brown" />
        </div>

        <p className="text-xs text-brand-white/50">
          &copy; {new Date().getFullYear()} {STORE_NAME}
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
