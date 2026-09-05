"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { API_BASE } from "@/lib/api"
import DiscountForm, { type DiscountFormData } from "@/components/discounts/discount-form"

export default function AdminEditDiscountPage() {
  const params = useParams<{ id: string }>()
  const id = parseInt(params.id ?? "", 10)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [discount, setDiscount] = useState<DiscountFormData | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const res = await fetch(`${API_BASE}/api/v1/discounts/${id}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setDiscount(data as DiscountFormData)
        } else {
          setNotFound(true)
        }
      } catch (err) {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (!Number.isNaN(id)) {
      load()
    } else {
      setNotFound(true)
      setLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans">
        Loading Discount...
      </div>
    )
  }

  if (notFound || !discount) {
    return (
      <div className="p-8 text-center text-xs text-gray-500 font-sans space-y-2">
        <div className="text-sm font-bold text-gray-800">Discount not found</div>
        <div>The requested discount could not be loaded. It may have been deleted.</div>
        <a href="/discounts" className="inline-block mt-2 text-amber-800 font-bold hover:underline">
          ← Back to Discounts
        </a>
      </div>
    )
  }

  return <DiscountForm mode="edit" initialData={discount} />
}
