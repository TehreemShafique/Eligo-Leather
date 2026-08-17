import { cn } from "@/lib/utils"

export type PageHeaderProps = {
  title: string
  description?: string
  className?: string
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 border-b border-brand-brown/15 pb-6", className)}>
      <span className="h-[2px] w-10 bg-brand-brown" aria-hidden="true" />
      <h1 className="font-heading text-2xl font-bold tracking-tight text-brand-brown sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="font-sans text-sm/relaxed text-slate-500">
          {description}
        </p>
      ) : null}
    </header>
  )
}