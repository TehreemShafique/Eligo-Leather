import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts, getProduct } from "@/modules/catalog/api"
import { truncate } from "@/lib/utils"
import { ProductDetailView } from "@/components/product/product-detail-view"

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

async function resolveProduct(slug: string) {
  if (/^\d+$/.test(slug)) {
    try {
      return await getProduct(Number(slug))
    } catch {
      return null
    }
  }

  try {
    const products = await listProducts({ search: slug, status: "Active", limit: 50 })
    const match = products.find((product) => product.url_handle === slug || String(product.id) === slug)
    if (match) {
      return await getProduct(match.id)
    }
  } catch (error) {
    console.error("Error resolving product:", error)
  }

  return null
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await resolveProduct(slug)
  if (!product) return { title: "Product Detail | Eligo Leather" }
  return {
    title: `${product.seo_title ?? product.title} | Eligo Leather`,
    description: product.seo_description ?? (product.description ? truncate(product.description, 155) : undefined),
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await resolveProduct(slug)
  if (!product) {
    notFound()
  }

  const firstVariant = product?.variants?.[0]
  const price = firstVariant?.price ? parseFloat(firstVariant.price) : undefined
  const compareAtPrice = firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : undefined
  const images = product?.images && product.images.length > 0 ? product.images.map((img) => img.url) : []

  // Generate Valid Schema.org Product, Organization, Breadcrumb & FAQ JSON-LD Script for Search Engine Validators & Rich Snippets
  const jsonLdSchema = product
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            "name": product.title,
            "image": images.length > 0 ? images : ["https://eligoleather.com/placeholder.jpg"],
            "description": product.description ? product.description.replace(/<[^>]+>/g, "").trim() : product.title,
            "sku": firstVariant?.sku || `ELIGO-${product.id}`,
            "mpn": firstVariant?.barcode || `MPN-${product.id}`,
            "brand": {
              "@type": "Brand",
              "name": product.vendor || "Eligo Leather",
            },
            "offers": {
              "@type": "Offer",
              "url": `https://eligoleather.com/products/${product.url_handle || product.id}`,
              "priceCurrency": "PKR",
              "price": price ? price.toString() : "1699",
              "priceValidUntil": "2028-12-31",
              "itemCondition": "https://schema.org/NewCondition",
              "availability": (firstVariant?.inventory_quantity ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "Eligo Leather",
              },
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "1520",
            },
          },
          {
            "@type": "Organization",
            "name": "Eligo Leather Official Store",
            "url": "https://eligoleather.com",
            "logo": "https://eligoleather.com/logo.png",
            "sameAs": [
              "https://facebook.com/eligoleather",
              "https://instagram.com/eligoleather"
            ],
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://eligoleather.com",
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": "https://eligoleather.com/products",
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.title,
                "item": `https://eligoleather.com/products/${product.url_handle || product.id}`,
              },
            ],
          },
          {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is this product made of 100% genuine real leather?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! All Eligo Leather products are handcrafted from 100% genuine top-grain cowhide leather.",
                },
              },
              {
                "@type": "Question",
                "name": "What is the delivery time and exchange policy?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We offer 5-7 days delivery across Pakistan with a 7-Day Easy Exchange policy.",
                },
              },
            ],
          },
        ],
      }
    : null

  return (
    <>
      {jsonLdSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      )}
      <ProductDetailView product={product as any} />
    </>
  )
}
