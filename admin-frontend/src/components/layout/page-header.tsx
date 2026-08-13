"use client"

import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  eyebrow?: string
  actions?: ReactNode
  icon?: ReactNode
}

export function PageHeader({ title, actions, icon }: PageHeaderProps) {
  return (
    <div className="eligo-card animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-amber-800/10 text-amber-800 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}
