"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Copy, Tag, Gift, X } from "@phosphor-icons/react"

interface ScratchWelcomePopupProps {
  discountPercentage?: number
  couponCode?: string
  isOpen?: boolean
  onClose?: () => void
  onApplyCoupon?: (code: string) => void
}

export default function ScratchWelcomePopup({
  discountPercentage = 5,
  couponCode = "",
  isOpen = true,
  onClose,
  onApplyCoupon,
}: ScratchWelcomePopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [scratchedPct, setScratchedPct] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(isOpen)

  useEffect(() => {
    queueMicrotask(() => setShowModal(isOpen))
  }, [isOpen])

  // Initialize Canvas Scratch Surface
  useEffect(() => {
    if (!showModal) return

    const timer = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height

      // Metallic Silver Glitter Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, "#d1d5db")
      grad.addColorStop(0.3, "#9ca3af")
      grad.addColorStop(0.6, "#e5e7eb")
      grad.addColorStop(1, "#6b7280")

      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Add Scratch Text & Sparkles Pattern
      ctx.fillStyle = "#111827"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("✨ SCRATCH HERE WITH CURSOR ✨", width / 2, height / 2 - 4)

      ctx.fillStyle = "#4b5563"
      ctx.font = "11px sans-serif"
      ctx.fillText("Move mouse back and forth to reveal", width / 2, height / 2 + 16)
    }, 100)

    return () => clearTimeout(timer)
  }, [showModal])

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || isRevealed) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratched percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++
    }

    const pct = Math.round((transparent / (pixels.length / 4)) * 100)
    setScratchedPct(pct)

    if (pct > 40 && !isRevealed) {
      setIsRevealed(true)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScratching(true)
    scratch(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isScratching) scratch(e.clientX, e.clientY)
  }

  const handleMouseUp = () => setIsScratching(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScratching(true)
    if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isScratching && e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-amber-200 overflow-hidden relative space-y-5 p-6 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            setShowModal(false)
            if (onClose) onClose()
          }}
          className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-200 shadow-2xs">
            <Gift className="w-6 h-6 text-amber-800" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 block">First-Time Visitor Special</span>
          <h2 className="text-xl font-bold text-gray-900">Scratch &amp; Win {discountPercentage}% OFF!</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Scratch the silver card below with your mouse back &amp; forth to reveal your exclusive welcome coupon code.
          </p>
        </div>

        {/* Scratch Card Canvas Container */}
        <div className="relative w-full h-32 rounded-2xl bg-amber-900 text-white flex flex-col items-center justify-center shadow-inner overflow-hidden border-2 border-amber-700 select-none">
          {/* Hidden Coupon Revealed Layer */}
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">Your Secret Welcome Code</span>
            <div className="text-2xl font-black font-mono tracking-wider text-amber-400 bg-black/40 px-4 py-1 rounded-xl border border-amber-400/40 inline-block shadow-md">
              {couponCode}
            </div>
            <span className="text-[10px] text-amber-200 block font-semibold">{discountPercentage}% Discount Applied on Checkout</span>
          </div>

          {/* Interactive Silver Glitter Overlay Canvas */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              width={380}
              height={128}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="absolute inset-0 w-full h-full cursor-crosshair rounded-2xl"
            />
          )}
        </div>

        {/* Scratch Progress Bar */}
        {!isRevealed && (
          <div className="space-y-1 text-center">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
              <div className="bg-amber-800 h-2 transition-all duration-150" style={{ width: `${scratchedPct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-gray-500">Scratch Progress: {scratchedPct}%</span>
          </div>
        )}

        {/* Actions */}
        {isRevealed && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-xl border border-gray-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-800" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onApplyCoupon) onApplyCoupon(couponCode)
                  else handleCopy()
                  setShowModal(false)
                }}
                className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Tag className="w-4 h-4" />
                <span>Apply to Cart ({discountPercentage}% OFF)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}