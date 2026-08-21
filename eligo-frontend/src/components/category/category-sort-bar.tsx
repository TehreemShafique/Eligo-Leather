"use client"

import { SquaresFour, Rows, CaretDown } from "@phosphor-icons/react"
import { useState } from "react"

interface CategorySortBarProps {
  totalResults?: number
  currentResultsCount?: number
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export function CategorySortBar({
  totalResults = 30,
  currentResultsCount = 12,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
}: CategorySortBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const sortOptions = [
    { label: "Default Sorting", value: "default" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Customer Rating", value: "rating" },
    { label: "Newest Arrivals", value: "newest" },
  ]

  const currentLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Default Sorting"

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      {/* Left View Mode Switcher & Results Info */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Grid & List View Toggle Buttons */}
        <div className="inline-flex shadow-xs rounded-[10px] overflow-hidden">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid View"
            className={`w-14 h-10 flex items-center justify-center transition-colors ${
              viewMode === "grid"
                ? "bg-amber-800 text-white"
                : "bg-white text-amber-800 border-l border-t border-b border-amber-800 hover:bg-amber-50"
            }`}
          >
            <SquaresFour className="w-5 h-5" weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="List View"
            className={`w-14 h-10 flex items-center justify-center transition-colors ${
              viewMode === "list"
                ? "bg-amber-800 text-white"
                : "bg-white text-amber-800 border-r border-t border-b border-amber-800 hover:bg-amber-50"
            }`}
          >
            <Rows className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {/* Results Counter */}
        <span className="text-sm font-normal text-black font-['Manrope']">
          Showing 1{"\u2013"}{currentResultsCount} of {totalResults} results
        </span>
      </div>

      {/* Right Sorting Selector */}
      <div className="relative w-full sm:w-64">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full h-10 px-4 rounded-[5px] border border-black bg-white flex items-center justify-between text-sm font-semibold text-black font-['Manrope'] shadow-2xs hover:bg-gray-50 transition-colors"
        >
          <span>{currentLabel}</span>
          <CaretDown className={`w-4 h-4 text-black transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-30 font-['Manrope']">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSortChange(opt.value)
                  setDropdownOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                  sortBy === opt.value
                    ? "bg-amber-800 text-white"
                    : "text-gray-800 hover:bg-amber-50 hover:text-amber-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
