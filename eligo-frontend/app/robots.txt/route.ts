import { NextResponse } from "next/server"

export async function GET() {
  const defaultText = `# Eligo Leather Storefront robots.txt
# Controls search engine crawler indexing (Googlebot, Bingbot, YandexBot)

User-agent: *
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /api/
Allow: /

# XML Sitemap Index for Search Engines
Sitemap: https://eligoleather.com/sitemap.xml
`

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
    const res = await fetch(`${apiUrl}/api/v1/pages/robots.txt/raw`, {
      cache: "no-store",
    })
    if (res.ok) {
      const text = await res.text()
      return new NextResponse(text || defaultText, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      })
    }
  } catch (e) {
    console.log("Robots.txt backend API offline, serving default text.")
  }

  return new NextResponse(defaultText, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
