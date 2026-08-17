import { Suspense } from "react"
import { searchProducts } from "@/modules/catalog/api"
import { ProductGrid } from "@/modules/catalog/components/product-grid"
import { SearchForm } from "@/modules/catalog/components/search-form"

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q
  const query = rawQuery?.trim() ?? ""

  const results = query ? await searchProducts(query) : []

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-black">
          Search
        </h1>
        <Suspense fallback={null}>
          <SearchForm defaultValue={query} className="max-w-lg" autoFocus={!query} />
        </Suspense>
      </div>

      {query ? (
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-sm font-medium text-brand-black">{results.length}</span>
          <span className="text-xs text-muted-foreground">
            result{results.length === 1 ? "" : "s"} for “{query}”
          </span>
        </div>
      ) : null}

      {query ? (
        <ProductGrid
          products={results}
          emptyTitle="No results"
          emptyDescription={`No products matched “${query}”. Try a different search term.`}
        />
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Start typing above to search the store.
        </p>
      )}
    </div>
  )
}
