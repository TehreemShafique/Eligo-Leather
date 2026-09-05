import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

interface PolicyContentPageProps {
  label: string
  title: string
  html: string
}

/**
 * Shared shell for the admin-managed legal pages (Privacy, Refund, Terms).
 * Layout, colors, typography and spacing match the original static pages;
 * only the body copy comes from the database.
 */
export function PolicyContentPage({ label, title, html }: PolicyContentPageProps) {
  return (
    <div className="relative left-1/2 w-[min(1920px,100vw)] -translate-x-1/2 bg-slate-50 font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] space-y-10 px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:px-8">
        <PageBreadcrumb label={label} />

        <h1 className="text-5xl font-bold leading-tight text-amber-800 sm:text-6xl">
          {title}
        </h1>

        {html ? (
          <article
            className="max-w-[1680px] space-y-4 text-lg font-normal leading-relaxed text-black sm:text-xl [&_address]:not-italic [&_a:hover]:underline [&_a]:text-black [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-10 [&_h2]:sm:text-4xl [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:leading-9 [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-bold [&_ul]:list-none [&_ul]:space-y-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-lg font-normal leading-relaxed text-gray-500 sm:text-xl">
            This page has not been published yet. Please check back soon.
          </p>
        )}
      </div>
    </div>
  )
}
