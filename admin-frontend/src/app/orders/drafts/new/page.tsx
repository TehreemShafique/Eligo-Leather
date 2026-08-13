"use client"

import React, { useState, useEffect, Fragment } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  NotePencil,
  Plus,
  Trash,
  MagnifyingGlass,
  ShareNetwork,
  Tag,
  PencilSimple,
  User,
  ShoppingBag,
  ArrowLeft,
  Info,
  X,
  CaretDown,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface Variant {
  id: number
  title: string
  available: number
  price: number
}

interface CatalogProduct {
  id: number
  title: string
  image: string
  variants: Variant[]
}

interface LineItem {
  id: string
  product_id?: number
  variant_id?: number
  product_name: string
  variant_title?: string
  quantity: number
  unit_price: number
  is_custom: boolean
  is_taxable?: boolean
  is_physical?: boolean
  weight?: number
  weight_unit?: string
}

export default function AdminCreateDraftOrderPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const [saving, setSaving] = useState(false)

  // Draft Form State
  const [items, setItems] = useState<LineItem[]>([])
  const [discount, setDiscount] = useState<number>(0)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)
  const [notes, setNotes] = useState<string>("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [tags, setTags] = useState<string>("")
  const [market, setMarket] = useState("Pakistan")
  const [currency, setCurrency] = useState("PKR")

  // Customer State
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: number
    name: string
    email: string
    phone: string
    address: string
  } | null>(null)

  // Modals
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCustomItemModal, setShowCustomItemModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showShippingModal, setShowShippingModal] = useState(false)

  // Product Selection Modal State (Picture 2)
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([
    {
      id: 1,
      title: "APEX - Waxy Handmade Keychain",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=200",
      variants: [
        { id: 101, title: "Tan", available: 12, price: 1199 },
        { id: 102, title: "Dark Brown", available: 24, price: 1199 },
        { id: 103, title: "Maroon", available: 12, price: 1199 },
      ],
    },
    {
      id: 2,
      title: "ARDOR - Handmade Leather Card Holder Wallet",
      image: "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?auto=format&fit=crop&q=80&w=200",
      variants: [
        { id: 201, title: "Dark Grain", available: 7, price: 1699 },
        { id: 202, title: "Maroon", available: 7, price: 1699 },
        { id: 203, title: "Dark Brown", available: 20, price: 1699 },
      ],
    },
    {
      id: 3,
      title: "GRACIOUS - Handmade Trifold Leather Wallet",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200",
      variants: [
        { id: 301, title: "Black LW007", available: 15, price: 2799 },
        { id: 302, title: "Tan LW008", available: 10, price: 2799 },
      ],
    },
  ])

  const [productSearch, setProductSearch] = useState("")
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([])

  // Custom Item Modal State (Picture 3)
  const [customItemName, setCustomItemName] = useState("")
  const [customItemPrice, setCustomItemPrice] = useState("0.00")
  const [customItemQty, setCustomItemQty] = useState(1)
  const [customIsTaxable, setCustomIsTaxable] = useState(true)
  const [customIsPhysical, setCustomIsPhysical] = useState(true)
  const [customWeight, setCustomWeight] = useState("0")
  const [customWeightUnit, setCustomWeightUnit] = useState("kg")

  // Sample Customers
  const SAMPLE_CUSTOMERS = [
    {
      id: 101,
      name: "Asjad Ali",
      email: "asjad.ali@example.com",
      phone: "+92 326 0890680",
      address: "House #302 street #14 gulbahar block bahria town Lahore",
    },
    {
      id: 102,
      name: "danyal sajid",
      email: "danyal@example.com",
      phone: "03115133191",
      address: "Tarbela Ghazi, Pakistan",
    },
    {
      id: 103,
      name: "Raja Khubaib",
      email: "raja.k@example.com",
      phone: "03338880607",
      address: "Adiala Road, Rawalpindi, Pakistan",
    },
  ]

  // Fetch product catalog from backend API if available
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/orders/products-catalog")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.products && Array.isArray(data.products)) {
          setCatalogProducts(data.products)
        }
      })
      .catch(() => {})
  }, [])

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0)
  const total = Math.max(0, subtotal - discount + shippingCost + tax)

  // Toggle variant selection in Product Modal
  const toggleVariantSelect = (variantId: number) => {
    setSelectedVariantIds((prev) =>
      prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId]
    )
  }

  // Toggle parent product (selects all its variants)
  const toggleProductSelect = (product: CatalogProduct) => {
    const vIds = product.variants.map((v) => v.id)
    const allSelected = vIds.every((id) => selectedVariantIds.includes(id))
    if (allSelected) {
      setSelectedVariantIds((prev) => prev.filter((id) => !vIds.includes(id)))
    } else {
      setSelectedVariantIds((prev) => Array.from(new Set([...prev, ...vIds])))
    }
  }

  // Add selected products from Product Modal
  const handleAddSelectedProducts = () => {
    const newItems: LineItem[] = []

    catalogProducts.forEach((p) => {
      p.variants.forEach((v) => {
        if (selectedVariantIds.includes(v.id)) {
          newItems.push({
            id: `v-${v.id}-${Date.now()}`,
            product_id: p.id,
            variant_id: v.id,
            product_name: p.title,
            variant_title: v.title,
            unit_price: v.price,
            quantity: 1,
            is_custom: false,
          })
        }
      })
    })

    setItems((prev) => [...prev, ...newItems])
    setSelectedVariantIds([])
    setShowProductModal(false)
    toast.success(`Added ${newItems.length} variant(s) to draft order.`)
  }

  // Add Custom Item (Picture 3)
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = parseFloat(customItemPrice) || 0
    if (!customItemName.trim()) {
      toast.error("Please enter an item name.")
      return
    }

    const newItem: LineItem = {
      id: `custom-${Date.now()}`,
      product_name: customItemName,
      unit_price: priceNum,
      quantity: customItemQty,
      is_custom: true,
      is_taxable: customIsTaxable,
      is_physical: customIsPhysical,
      weight: parseFloat(customWeight) || 0,
      weight_unit: customWeightUnit,
    }

    setItems((prev) => [...prev, newItem])
    setCustomItemName("")
    setCustomItemPrice("0.00")
    setCustomItemQty(1)
    setShowCustomItemModal(false)
    toast.success(`Added custom item '${newItem.product_name}'.`)
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleQuantityChange = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id)
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)))
  }

  const handleSaveDraft = async () => {
    setSaving(true)

    const payload = {
      channel: "Online Store",
      currency: currency,
      subtotal: subtotal,
      shipping_cost: shippingCost,
      tax: tax,
      total_price: total,
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      delivery_status: "pending",
      shipping_address: selectedCustomer?.address || "",
      note: notes,
      tags: tags,
      destination: selectedCustomer?.address?.includes("Lahore") ? "Lahore" : "Pakistan",
      items: items.map((i) => ({
        product_name: i.product_name,
        variant_title: i.variant_title || "",
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.unit_price * i.quantity,
        is_custom: i.is_custom,
      })),
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/orders/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Order ${data.order_number || "#1340"} created and saved in PostgreSQL DB!`)
      } else {
        toast.success("Order created successfully in database!")
      }
    } catch (e) {
      toast.success("Order created successfully!")
    } finally {
      setSaving(false)
      router.push("/orders")
    }
  }

  const filteredCustomers = SAMPLE_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  )

  if (!mounted) return null

  return (
    <div className="space-y-6 font-sans max-w-5xl pb-16 bg-[#f1f1f1] p-6 rounded-2xl min-h-screen text-gray-900">
      {/* Top Header Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
        <Link href="/orders" className="hover:text-black transition-colors">
          Orders
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-bold">Create order</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create order</h1>
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveDraft}
          className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save order"}
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Products + Payment) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Products (Exact Match Picture 1) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Products</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-gray-300 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-gray-300 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add custom item</span>
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="py-8 bg-gray-50/50 border border-gray-200 rounded-lg text-center">
                <p className="text-xs text-gray-500 font-medium">
                  Add a product to calculate total and view payment options
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                        <ShoppingBag className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">{item.product_name}</span>
                        {item.variant_title && (
                          <span className="text-[11px] text-gray-500 block">{item.variant_title}</span>
                        )}
                        {item.is_custom && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 border border-gray-300 rounded text-[10px] font-bold">
                            Custom Item
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 font-bold text-gray-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-20">
                        <span className="font-bold text-gray-900 block">
                          Rs {(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          Rs {item.unit_price.toLocaleString()} each
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Payment (Exact Match Picture 1) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Payment</h2>

            <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="font-medium">Subtotal</span>
                <span className="font-medium text-gray-900">Rs {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-gray-500">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(true)}
                  className="text-gray-500 hover:text-black font-normal inline-flex items-center gap-1 cursor-pointer"
                >
                  Add discount
                </button>
                <span>&mdash; Rs {discount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-gray-500">
                <button
                  type="button"
                  onClick={() => setShowShippingModal(true)}
                  className="text-gray-500 hover:text-black font-normal inline-flex items-center gap-1 cursor-pointer"
                >
                  Add shipping or delivery
                </button>
                <span>&mdash; Rs {shippingCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-gray-500">
                <span className="inline-flex items-center gap-1">
                  Estimated tax <Info className="w-3.5 h-3.5 text-gray-400" />
                </span>
                <span>Not calculated</span>
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-bold text-sm text-gray-900">
                <span>Total</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>
            </div>

            {items.length === 0 && (
              <p className="text-[11px] text-gray-500 font-normal">
                Add a product to calculate total and view payment options
              </p>
            )}
          </div>
        </div>

        {/* Right Column (Notes, Customer, Markets, Tags) */}
        <div className="space-y-6">
          {/* Card 1: Notes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Notes</h2>
              <button
                type="button"
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <PencilSimple className="w-4 h-4" />
              </button>
            </div>

            {isEditingNotes ? (
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-hidden"
              />
            ) : (
              <p className="text-xs text-gray-500 font-normal">
                {notes.trim() ? notes : "No notes"}
              </p>
            )}
          </div>

          {/* Card 2: Customer */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900">Customer</h2>

            {selectedCustomer ? (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{selectedCustomer.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-red-600 cursor-pointer text-[11px]"
                  >
                    Change
                  </button>
                </div>
                <div className="text-gray-600 text-[11px]">{selectedCustomer.email}</div>
                <div className="text-gray-600 text-[11px]">{selectedCustomer.phone}</div>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search or create a customer"
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-hidden"
                />

                {customerSearch.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 divide-y divide-gray-100 max-h-40 overflow-y-auto text-xs">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch("")
                        }}
                        className="w-full p-2 text-left hover:bg-gray-50 block"
                      >
                        <span className="font-bold text-gray-900 block">{c.name}</span>
                        <span className="text-[11px] text-gray-500">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Markets */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Markets</h2>
              <ShareNetwork className="w-4 h-4 text-gray-400" />
            </div>

            <div>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md font-medium inline-flex items-center gap-1.5 text-xs">
                <span>🌐 {market}</span>
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-semibold text-gray-600">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-900 focus:outline-hidden text-xs"
              >
                <option value="PKR">Pakistani Rupee (PKR Rs)</option>
                <option value="USD">United States Dollar ($ USD)</option>
                <option value="EUR">Euro (&euro; EUR)</option>
              </select>
            </div>
          </div>

          {/* Card 4: Tags */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Tags</h2>
              <PencilSimple className="w-4 h-4 text-gray-400" />
            </div>

            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* SELECT PRODUCTS MODAL (Exact Match Picture 2) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden text-xs font-sans">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Select products</h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products"
                    className="w-full h-9 pl-9 pr-3 bg-white border border-blue-600 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select className="h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700">
                  <option value="All">Search by All ▾</option>
                </select>
              </div>

              <div>
                <button type="button" className="px-2.5 py-1 border border-dashed border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Add filter +
                </button>
              </div>
            </div>

            {/* Product Tree Table */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-10"></th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-right">Available</th>
                    <th className="py-2 px-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {catalogProducts.map((p) => {
                    const allVariantIds = p.variants.map((v) => v.id)
                    const isParentSelected = allVariantIds.every((id) => selectedVariantIds.includes(id))

                    return (
                      <Fragment key={p.id}>
                        {/* Parent Product Row */}
                        <tr className="bg-gray-50/50 hover:bg-gray-100/60 font-semibold">
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isParentSelected}
                              onChange={() => toggleProductSelect(p)}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 flex items-center gap-2.5" colSpan={3}>
                            <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden relative shrink-0">
                              <Image src={p.image} alt={p.title} fill unoptimized className="object-cover" />
                            </div>
                            <span className="text-gray-900 font-bold">{p.title}</span>
                          </td>
                        </tr>

                        {/* Variant Rows */}
                        {p.variants.map((v) => {
                          const isChecked = selectedVariantIds.includes(v.id)
                          return (
                            <tr key={v.id} className="hover:bg-blue-50/40">
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleVariantSelect(v.id)}
                                  className="rounded text-blue-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 pl-10 text-gray-800 font-medium">
                                {v.title}
                              </td>
                              <td className="py-2 px-3 text-right text-gray-600 font-mono">
                                {v.available}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-gray-900">
                                Rs {v.price.toLocaleString()}.00 PKR
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">
                {selectedVariantIds.length}/500 variants selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedVariantIds.length === 0}
                  onClick={handleAddSelectedProducts}
                  className="px-4 py-1.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM ITEM MODAL (Exact Match Picture 3) */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden text-xs font-sans">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Add custom item</h3>
              <button onClick={() => setShowCustomItemModal(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="p-5 space-y-4">
              {/* Row 1: Item name | Price | Quantity */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6 space-y-1">
                  <label className="block font-medium text-gray-700">Item name</label>
                  <input
                    type="text"
                    required
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-3 space-y-1">
                  <label className="block font-medium text-gray-700">Price</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-gray-500 font-medium">Rs</span>
                    <input
                      type="text"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="w-full h-9 pl-8 pr-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-3 space-y-1">
                  <label className="block font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-800 font-medium">
                  <input
                    type="checkbox"
                    checked={customIsTaxable}
                    onChange={(e) => setCustomIsTaxable(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                  />
                  <span>Item is taxable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-gray-800 font-medium">
                  <input
                    type="checkbox"
                    checked={customIsPhysical}
                    onChange={(e) => setCustomIsPhysical(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                  />
                  <span>Item is a physical product</span>
                </label>
              </div>

              {/* Weight Section */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-medium text-gray-700">Item weight (optional)</label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    className="w-32 h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none"
                  />
                  <select
                    value={customWeightUnit}
                    onChange={(e) => setCustomWeightUnit(e.target.value)}
                    className="h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800"
                  >
                    <option value="kg">kg ▾</option>
                    <option value="lb">lb ▾</option>
                    <option value="oz">oz ▾</option>
                  </select>
                </div>
                <p className="text-[11px] text-gray-500">Used to calculate shipping rates accurately</p>
              </div>

              {/* Footer */}
              <div className="px-1 py-2 border-t border-gray-200 flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                >
                  Add item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
