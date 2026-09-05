"use client"

import { useState, useEffect } from "react"
import { Gift, Plus, CheckCircle } from "@phosphor-icons/react"
import { toast } from "sonner"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { API_BASE } from "@/lib/api"

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<any[]>([])
  const [giftCardProducts, setGiftCardProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gcRes, gcpRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/catalog/gift-cards/?limit=200`),
          fetch(`${API_BASE}/api/v1/catalog/gift-card-products/?limit=200`),
        ])
        if (gcRes.ok) {
          const data = await gcRes.json()
          if (Array.isArray(data)) setGiftCards(data)
        }
        if (gcpRes.ok) {
          const data = await gcpRes.json()
          if (Array.isArray(data)) setGiftCardProducts(data)
        }
      } catch (err) {}
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gift Cards"
        icon={<Gift className="w-5 h-5" />}
        actions={
          <>
            <Link
              href="/products/gift-cards/new"
              className="eligo-btn-secondary"
            >
              <Gift className="w-4 h-4 text-amber-800" />
              <span>Add gift card product</span>
            </Link>
            <button
              onClick={() => toast.success("Issue gift card drawer opened!")}
              className="eligo-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Issue gift card</span>
            </button>
          </>
        }
      />

      {/* Gift Cards Table */}
      <div className="eligo-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Issued Store Gift Cards ({giftCards.length})</h2>
        </div>

        <div className="eligo-table-wrap">
          <table className="eligo-table">
            <thead>
              <tr>
                <th className="eligo-th">Gift Card Code</th>
                <th className="eligo-th">Status</th>
                <th className="eligo-th w-[16%]">Initial Value</th>
                <th className="eligo-th w-[18%] text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {giftCards.length > 0 ? giftCards.map((card: any) => (
                <tr key={card.id} className="hover:bg-[#faf9f7] transition-colors">
                  <td className="eligo-td font-mono font-bold text-amber-800">{card.code}</td>
                  <td className="eligo-td">
                    <span className="eligo-badge bg-emerald-100 text-emerald-800 border-emerald-200">
                      {card.status}
                    </span>
                  </td>
                  <td className="eligo-td font-semibold text-gray-700">Rs. {Number(card.initial_value).toLocaleString()}</td>
                  <td className="eligo-td text-right font-bold text-gray-900">Rs. {Number(card.current_balance).toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-500 font-semibold">
                    No gift cards issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gift Card Products Table */}
      {giftCardProducts.length > 0 && (
        <div className="eligo-card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Gift Card Products ({giftCardProducts.length})</h2>
          </div>

          <div className="eligo-table-wrap">
            <table className="eligo-table">
              <thead>
                <tr>
                  <th className="eligo-th">Code</th>
                  <th className="eligo-th">Title</th>
                  <th className="eligo-th">Status</th>
                  <th className="eligo-th">Base Price</th>
                  <th className="eligo-th">Compare-at Price</th>
                  <th className="eligo-th">URL Handle</th>
                  <th className="eligo-th text-right">Products</th>
                </tr>
              </thead>
              <tbody>
                {giftCardProducts.map((gcp: any) => (
                  <tr key={gcp.id} className="hover:bg-[#faf9f7] transition-colors">
                    <td className="eligo-td font-mono font-bold text-amber-800">{gcp.code || "-"}</td>
                    <td className="eligo-td font-bold text-gray-900">{gcp.title}</td>
                    <td className="eligo-td">
                      <span className={`eligo-badge ${gcp.status === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {gcp.status}
                      </span>
                    </td>
                    <td className="eligo-td font-bold text-gray-900">Rs. {Number(gcp.base_price || 0).toLocaleString()}</td>
                    <td className="eligo-td font-bold text-gray-500 line-through decoration-red-500/70">Rs. {Number(gcp.compare_at_price || 0).toLocaleString()}</td>
                    <td className="eligo-td font-mono text-xs text-gray-500">{gcp.url_handle || "-"}</td>
                    <td className="eligo-td text-right font-bold text-gray-900">{gcp.product_ids ? gcp.product_ids.split(",").length : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
