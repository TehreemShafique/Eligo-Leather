"use client"

export interface CategorySubItem {
  id: string
  name: string
  href: string
  count?: number
}

interface CategorySidebarProps {
  categoryTitle?: string
  subcategories?: CategorySubItem[]
  activeSubcategory?: string
  onSelectSubcategory?: (id: string) => void
}

const DEFAULT_SUBCATEGORIES: CategorySubItem[] = [
  { id: "bifold", name: "Bifold Wallets", href: "/categories/wallets?sub=bifold" },
  { id: "trifold", name: "Trifold Wallets", href: "/categories/wallets?sub=trifold" },
  { id: "long", name: "Long Wallets", href: "/categories/wallets?sub=long" },
  { id: "crocodile", name: "Crocodile Wallets", href: "/categories/wallets?sub=crocodile" },
  { id: "note-clip", name: "Note Clip Wallets", href: "/categories/wallets?sub=note-clip" },
  { id: "vintage", name: "Vintage Wallets", href: "/categories/wallets?sub=vintage" },
]

export function CategorySidebar({
  categoryTitle = "All Wallets Category",
  subcategories = DEFAULT_SUBCATEGORIES,
  activeSubcategory,
  onSelectSubcategory,
}: CategorySidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* Category Main Header Badge */}
      <div className="w-full bg-amber-800 text-white rounded-[5px] px-6 py-3.5 text-center font-semibold text-sm font-['Manrope'] shadow-xs">
        {categoryTitle}
      </div>

      {/* Subcategories List */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-['Manrope'] mb-2">
          Subcategories
        </h4>
        <ul className="space-y-3 font-['Manrope']">
          {subcategories.map((item) => {
            const isActive = activeSubcategory === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectSubcategory && onSelectSubcategory(item.id)}
                  className={`w-full text-left flex items-center justify-between text-base font-semibold transition-colors py-1 ${
                    isActive
                      ? "text-amber-900 font-bold"
                      : "text-amber-800 hover:text-amber-900 hover:translate-x-1"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-800">➢</span>
                    {item.name}
                  </span>
                  {item.count !== undefined && (
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
