"use client"

import Link from "next/link"
import Image from "next/image"
import {
  useCartStore,
  selectCart,
  selectCartSubtotal,
  cartLineKey,
} from "@/modules/cart/store"
import { Trash, ArrowLeft, ShoppingBag } from "@phosphor-icons/react"

export default function CartPage() {
  const cart = useCartStore(selectCart)
  const cartSubtotal = useCartStore(selectCartSubtotal)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const clearCart = useCartStore((state) => state.clearCart)

  if (cart.length === 0) {
    return (
      <div className="py-20 bg-slate-50 min-h-[70vh] flex flex-col items-center justify-center font-['Manrope'] px-4 text-center">
        <div className="w-20 h-20 bg-amber-100/60 text-amber-800 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-black mb-3">Your Cart is Empty</h1>
        <p className="text-gray-600 max-w-md mb-8 text-base">
          Looks like you haven&apos;t added any handcrafted leather products to your cart yet.
        </p>
        <Link
          href="/products"
          className="px-8 py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-[10px] shadow-sm transition-all"
        >
          Explore Collections
        </Link>
      </div>
    )
  }

  const shippingFee = cartSubtotal >= 2000 ? 0 : 250
  const orderTotal = cartSubtotal + shippingFee

  return (
    <div className="py-12 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-[1570px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-black">Shopping Cart</h1>
          <button
            type="button"
            onClick={clearCart}
            className="text-sm font-semibold text-red-600 hover:text-red-800 cursor-pointer"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={cartLineKey(item)}
                className="bg-white rounded-[20px] p-4 sm:p-6 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-zinc-100 rounded-[15px] overflow-hidden shrink-0">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>

                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-bold text-black leading-snug">
                    {item.title}
                  </h3>
                  {item.color && (
                    <p className="text-xs text-gray-500 font-medium">Color: {item.color}</p>
                  )}
                  <p className="text-sm font-bold text-zinc-950 pt-1">
                    Rs.{item.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="inline-flex items-center border border-gray-300 rounded-[5px] overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-zinc-950">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-black hover:bg-gray-100"
                    >
                      &#43;
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="lg:col-span-4 bg-white rounded-[20px] border border-gray-200 p-6 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-black border-b border-gray-100 pb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold text-black">Rs.{cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span className="font-semibold text-black">
                  {shippingFee === 0 ? "Free (Orders > 2000 PKR)" : `Rs.${shippingFee}`}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-black">
                <span>Total</span>
                <span>Rs.{orderTotal.toLocaleString()}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm rounded-[10px] text-center block shadow-sm transition-all"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
