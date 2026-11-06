import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router'
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { listNfts } from '@/features/nfts/api'
import { NftCard } from '@/features/nfts/NftCard'
import { NftCardSkeleton } from '@/features/nfts/NftCardSkeleton'
import { Hero } from '@/features/nfts/Hero'
import { CatalogFilters, FeaturedNft, MobileFilters, type FiltersValue } from '@/features/nfts/CatalogSidebar'
import { MintJournal, PromoBanners } from '@/features/nfts/HomeSections'
import { CATEGORIES, NETWORKS, type CatalogTab, type Category, type Network, type SortOption } from '@/types/api'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
]

const TABS: { value: CatalogTab; label: string }[] = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

type CatalogSearch = {
  q?: string
  network?: Network
  category?: Category
  tab?: CatalogTab
  minPrice?: string
  maxPrice?: string
  sort: SortOption
  page: number
}

function texto(v: unknown) {
  if (typeof v === 'number') return String(v)
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function preco(v: unknown) {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 ? String(n) : undefined
}

const nftListOptions = (search: CatalogSearch) =>
  queryOptions({
    queryKey: ['nfts', 'list', search],
    queryFn: ({ signal }) => listNfts(search, signal),
    placeholderData: keepPreviousData,
  })

export const Route = createFileRoute('/')({
  // Entrada opcional (Partial + SearchSchemaInput) => <Link to="/"> não exige search.
  validateSearch: (input: Partial<CatalogSearch> & SearchSchemaInput): CatalogSearch => {
    const raw = input as Record<string, unknown>
    const page = Number(raw.page)
    const tab = TABS.some((t) => t.value === raw.tab) && raw.tab !== 'all' ? (raw.tab as CatalogTab) : undefined
    return {
      q: texto(raw.q),
      network: NETWORKS.includes(raw.network as Network) ? (raw.network as Network) : undefined,
      category: CATEGORIES.includes(raw.category as Category) ? (raw.category as Category) : undefined,
      tab,
      minPrice: preco(raw.minPrice),
      maxPrice: preco(raw.maxPrice),
      sort: SORTS.some((s) => s.value === raw.sort) ? (raw.sort as SortOption) : 'recent',
      page: Number.isInteger(page) && page > 0 ? page : 1,
    }
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.prefetchQuery(nftListOptions(deps)),
  component: CatalogPage,
})

function CatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const nfts = useQuery(nftListOptions(search))

  function atualizar(patch: Partial<CatalogSearch>) {
    void navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }), replace: true, resetScroll: false })
  }

  function irParaPagina(page: number) {
    void navigate({ search: (prev) => ({ ...prev, page }), resetScroll: false })
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filtros: FiltersValue = {
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
  }
  const facets = nfts.data?.facets
  const abaAtual = search.tab ?? 'all'
  const totalPages = nfts.data ? Math.max(1, Math.ceil(nfts.data.total / nfts.data.pageSize)) : 1

  return (
    <div className="pb-8">
      <Hero />

      <section id="catalogo" aria-labelledby="catalogo-titulo" className={`${CONTAINER} mt-12 scroll-mt-24 lg:mt-16`}>
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="grid gap-10 lg:grid-cols-[310px_1fr] xl:gap-12">
          <aside aria-label="Filtros do catálogo" className="hidden space-y-5 lg:block">
            <CatalogFilters
              key={`${search.minPrice}-${search.maxPrice}`}
              value={filtros}
              facets={facets}
              onChange={atualizar}
            />
            <FeaturedNft />
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div role="group" aria-label="Tipo de listagem" className="flex gap-6 overflow-x-auto">
                {TABS.map((t) => {
                  const ativo = abaAtual === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => atualizar({ tab: t.value === 'all' ? undefined : t.value })}
                      className={`relative whitespace-nowrap pb-2 text-sm transition-colors hover:text-primary ${
                        ativo ? 'text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary' : ''
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 pb-2">
                <MobileFilters value={filtros} facets={facets} onChange={atualizar} />
                <label htmlFor="ordenar" className="text-sm">
                  Ordenar por:
                </label>
                <select
                  id="ordenar"
                  value={search.sort}
                  onChange={(e) => atualizar({ sort: e.target.value as SortOption })}
                  className="cursor-pointer rounded-sm bg-transparent text-sm"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-card">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {search.q && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span>
                  Resultados para <strong className="text-primary">"{search.q}"</strong>
                </span>
                <button
                  type="button"
                  onClick={() => atualizar({ q: undefined })}
                  aria-label="Limpar busca"
                  className="grid size-6 place-items-center rounded-sm hover:bg-secondary"
                >
                  <FiX className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <p className="sr-only" aria-live="polite">
              {nfts.data ? `${nfts.data.total} NFT${nfts.data.total === 1 ? '' : 's'} encontrado${nfts.data.total === 1 ? '' : 's'}` : ''}
            </p>

            {nfts.isPending ? (
              <ul
                className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12"
                aria-busy="true"
                aria-label="Carregando NFTs"
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <li key={i}>
                    <NftCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : nfts.isError ? (
              <div role="alert" className="mt-6 space-y-3 bg-card p-6 text-center">
                <p>Não foi possível carregar os NFTs.</p>
                <button
                  type="button"
                  onClick={() => nfts.refetch()}
                  className="rounded-sm bg-primary px-4 py-2 font-bold text-primary-foreground"
                >
                  Tentar novamente
                </button>
              </div>
            ) : nfts.data.items.length === 0 ? (
              <div className="mt-6 bg-card p-6 text-center text-muted-foreground">
                Nenhum NFT encontrado com esses filtros.
              </div>
            ) : (
              <ul
                className={`mt-6 grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12 ${
                  nfts.isPlaceholderData ? 'opacity-60' : ''
                }`}
              >
                {nfts.data.items.map((nft, i) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} priority={i < 3} />
                  </li>
                ))}
              </ul>
            )}

            {nfts.data && totalPages > 1 && (
              <nav aria-label="Paginação" className="mt-12 flex justify-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => irParaPagina(search.page - 1)}
                  disabled={search.page <= 1}
                  aria-label="Página anterior"
                  className="grid size-8 place-items-center rounded-sm border border-primary/40 disabled:opacity-40"
                >
                  <FiChevronLeft className="size-4" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const atual = p === search.page
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => irParaPagina(p)}
                      aria-current={atual ? 'page' : undefined}
                      aria-label={`Página ${p}`}
                      className={`grid size-8 place-items-center rounded-sm border text-sm ${
                        atual ? 'border-primary bg-primary font-bold text-primary-foreground' : 'border-primary/40'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => irParaPagina(search.page + 1)}
                  disabled={search.page >= totalPages}
                  aria-label="Próxima página"
                  className="grid size-8 place-items-center rounded-sm border border-primary/40 disabled:opacity-40"
                >
                  <FiChevronRight className="size-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>

      <PromoBanners />
      <MintJournal />
    </div>
  )
}