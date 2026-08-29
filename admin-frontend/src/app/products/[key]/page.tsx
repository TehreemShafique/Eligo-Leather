"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { API_BASE } from "@/lib/api"
import ProductForm, { type ProductFormData } from "@/components/products/product-form"

export default function AdminEditProductPage() {
  const params = useParams<{ key: string }>()
  const key = decodeURIComponent(params.key)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [product, setProduct] = useState<ProductFormData | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        let data: ProductFormData | null = null
        if (/^\d+$/.test(key)) {
          const res = await fetch(`${API_BASE}/api/v1/catalog/products/${key}`)
          if (res.ok) data = await res.json()
        } else {
          const res = await fetch(`${API_BASE}/api/v1/catalog/products/?limit=200`)
          if (res.ok) {
            const list = await res.json()
            const match = (Array.isArray(list) ? list : []).find(
              (p: any) => p.url_handle === key || String(p.id) === key
            )
            if (match) {
              const detail = await fetch(`${API_BASE}/api/v1/catalog/products/${match.id}`)
              if (detail.ok) data = await detail.json()
            }
          }
        }
        if (cancelled) return
        if (data) {
          setProduct(data)
        } else {
          setNotFound(true)
        }
      } catch (err) {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [key])

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans">
        Loading Product Editor...
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans space-y-2">
        <div className="text-sm font-bold text-gray-800">Product not found</div>
        <div>The requested product could not be loaded. It may have been deleted.</div>
        <a href="/products" className="inline-block mt-2 text-amber-800 font-bold hover:underline">
          ← Back to Products
        </a>
      </div>
    )
  }

  return <ProductForm initialData={product} />
}
