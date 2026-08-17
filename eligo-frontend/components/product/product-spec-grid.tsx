"use client"

export interface SpecGridProps {
  description?: string
  material?: string
  dimension?: string
  shippingPolicy?: string
}

function renderFormattedContent(text: string) {
  if (!text) return null

  // If text contains HTML tags
  if (text.includes("<") && text.includes(">")) {
    return <div dangerouslySetInnerHTML={{ __html: text }} />
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)

  // Check if lines represent a bulleted list
  const isList = lines.some((line) =>
    line.startsWith("•") ||
    line.startsWith("➢") ||
    line.startsWith("-") ||
    line.startsWith("*") ||
    /^\d+\./.test(line)
  )

  if (isList) {
    return (
      <ul className="space-y-2 list-none p-0 m-0 text-gray-900">
        {lines.map((line, i) => {
          const cleanLine = line.replace(/^[•➢\-\*]\s*/, "").replace(/^\d+\.\s*/, "")
          return (
            <li key={i} className="flex items-start gap-2 text-base sm:text-lg">
              <span className="text-amber-800 font-bold shrink-0">➢</span>
              <span>{cleanLine}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="space-y-3 whitespace-pre-line text-gray-900 text-base sm:text-lg font-normal leading-relaxed">
      {text}
    </div>
  )
}

export function ProductSpecGrid({
  description = "ARDOR is the ultimate blend of style and functionality to manage your essential cards.\n➢ Card Holder\n➢ 2 Card Slots",
  material = "➢ Thread: Nylon\n➢ Material: Waxy\n➢ Leather Type: Vintage Leather / Pullup Leather\n➢ Inner material: Fabric less",
  dimension = "➢ Length: 3”\n➢ Width: 4”\n➢ Stitching: 3 mm",
  shippingPolicy = "If there is any defect in the product, it can be exchanged within 7 days of purchase. Please note that the exchange will be processed, but refunds are not offered. Shipping typically takes 3-5 business days, while delivery to Islamabad or Rawalpindi will be completed within 1-2 business days.",
}: SpecGridProps) {
  const columns = [
    { title: "Product Description", content: description },
    { title: "Product Material", content: material },
    { title: "Product Dimension", content: dimension },
    { title: "Shipping & Return Policy", content: shippingPolicy },
  ]

  return (
    <section className="my-12 w-full max-w-[1680px] font-['Manrope']">
      <div className="bg-white rounded-[20px] border border-amber-800 shadow-xs overflow-hidden min-h-[310px] flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-amber-800 min-h-[310px]">
          {columns.map((col, idx) => (
            <div key={idx} className="flex flex-col h-full">
              <div className="bg-amber-800 px-6 py-3.5 border-b border-amber-800 shrink-0">
                <h3 className="text-white text-lg sm:text-xl font-semibold tracking-wide">
                  {col.title}
                </h3>
              </div>

              <div className="p-6 flex-1 bg-white flex flex-col justify-start">
                {renderFormattedContent(col.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
