import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs"

interface PageBreadcrumbProps {
  label?: string
  items?: BreadcrumbItem[]
  positioned?: boolean
}

export function PageBreadcrumb({
  label,
  items,
  positioned = true,
}: PageBreadcrumbProps) {
  const breadcrumbItems = items ?? (label ? [{ label }] : [])

  if (!positioned) {
    return <Breadcrumbs items={breadcrumbItems} />
  }

  return (
    <div className="mb-6 pb-3 xl:absolute xl:left-[6.25cqw] xl:top-[2.083333cqw] xl:-translate-y-3 xl:mb-0 xl:pb-0">
      <Breadcrumbs items={breadcrumbItems} />
    </div>
  )
}