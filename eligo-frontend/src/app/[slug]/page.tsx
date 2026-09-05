import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts, getProduct, listCollections } from "@/modules/catalog/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { truncate } from "@/lib/utils"
import { absoluteUrl, buildSeoMetadata, cleanSeoDescription } from "@/lib/seo"
import { ProductDetailView } from "@/components/product/product-detail-view"
import { fetchStoreSchemas } from "@/modules/store/api"
import type { ProductListOut, ProductOut } from "@/modules/catalog/schema"

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

async function fetchRelatedProducts(currentProduct: ProductOut): Promise<ProductListOut[]> {
  try {
    const collections = await listCollections()
    const ownCategories = (currentProduct.categories ?? "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
    const ownerCollection =
      ownCategories.length > 0
        ? collections.find(
            (c) =>
              c.title?.trim() &&
              ownCategories.includes(c.title.trim().toLowerCase()),
          )
        : undefined

    const products = await listProducts({
      status: "Active",
      limit: 200,
      ...(ownerCollection
        ? { collection: ownerCollection.collection_type }
        : { category: currentProduct.category }),
    })

    const others = products.filter((p) => p.id !== currentProduct.id)
    if (!ownerCollection) return others.slice(0, 5)

    const differentCategory = others.filter((p) => {
      const titles = (p.categories ?? "")
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
      return !titles.some((t) => ownCategories.includes(t))
    })
    return [
      ...differentCategory,
      ...others.filter((p) => !differentCategory.includes(p)),
    ].slice(0, 5)
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await resolveProduct(slug)
  if (!product) {
    return buildSeoMetadata({
      title: "Product Not Found",
      description: "The requested Eligo Leather product could not be found. Browse our current handcrafted leather products and accessories.",
      path: `/${slug}`,
      noIndex: true,
    })
  }

  const description = (product.seo_description && cleanSeoDescription(product.seo_description))
    ? truncate(cleanSeoDescription(product.seo_description), 155)
    : (product.description ? truncate(product.description.replace(/<[^>]+>/g, ""), 155) : `Shop ${product.title}, handcrafted by Eligo Leather with delivery available across Pakistan.`)
  const image = product.images?.[0]?.url

  return buildSeoMetadata({
    title: product.seo_title ?? product.title,
    description,
    path: `/${product.url_handle || product.id}`,
    image: image || undefined,
    keywords: [product.title, product.category, "genuine leather product"],
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await resolveProduct(slug)
  if (!product) {
    notFound()
  }

  const relatedProducts = await fetchRelatedProducts(product)

  const firstVariant = product?.variants?.[0]
  const price = firstVariant?.price ? parseFloat(firstVariant.price) : undefined
  const images = product?.images && product.images.length > 0 ? product.images.map((img) => img.url) : []

  // A schema published from the admin product editor for THIS slug replaces the
  // built-in JSON-LD (Product/Organization/Breadcrumb) to avoid duplicate markup.
  let publishedSchemaJson: string | null = null
  try {
    const schemas = await fetchStoreSchemas()
    const target = `/${product.url_handle || product.id}`
    const match = schemas.find(
      (s) => s.is_active && s.schema_type === "product" && s.target_pages === target,
    )
    if (match && match.schema_json.trim()) {
      publishedSchemaJson = match.schema_json
    }
  } catch {
    publishedSchemaJson = null
  }

  const jsonLdSchema = product
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            "name": product.title,
            "image": images.length > 0 ? images : [absoluteUrl("/images/homepage/26_rectangle_1682.webp")],
            "description": product.description ? product.description.replace(/<[^>]+>/g, "").trim() : product.title,
            "sku": firstVariant?.sku || `ELIGO-${product.id}`,
            "mpn": firstVariant?.barcode || `MPN-${product.id}`,
            "brand": {
              "@type": "Brand",
              "name": product.vendor || "Eligo Leather",
            },
            "offers": {
              "@type": "Offer",
              "url": absoluteUrl(`/${product.url_handle || product.id}`),
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
          },
          {
            "@type": "Organization",
            "name": "Eligo Leather Official Store",
            "url": absoluteUrl("/"),
            "logo": absoluteUrl("/images/homepage/2_rectangle_1655.webp"),
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
                "item": absoluteUrl("/"),
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": absoluteUrl("/products"),
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.title,
                "item": absoluteUrl(`/${product.url_handle || product.id}`),
              },
            ],
          }
        ],
      }
    : null

  return (
    <>
      {publishedSchemaJson ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: publishedSchemaJson.replace(/</g, "\\u003c") }}
        />
      ) : jsonLdSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema).replace(/</g, "\\u003c") }}
        />
      ) : null}
      <ProductDetailView
        product={{
          ...product,
          description: product.description ? sanitizeCmsHtml(product.description) : product.description,
        }}
        relatedProducts={relatedProducts}
      />
    </>
  )
}
