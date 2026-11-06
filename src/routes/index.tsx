import { useEffect, useState, type FormEvent } from 'react'
import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router'
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { listNfts } from '@/features/nfts/api'
import { NftCard } from '@/features/nfts/NftCard'
import { NftCardSkeleton } from '@/features/nfts/NftCardSkeleton'
import type { Network, SortOption } from '@/types/api'

const NETWORKS: Network[] = ['Ethereum', 'Polygon', 'Solana']
const SORTS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
]

type CatalogSearch = {
  q?: string
  network?: Network
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
    return {
      q: texto(raw.q),
      network: NETWORKS.includes(raw.network as Network) ? (raw.network as Network) : undefined,
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
    void navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }), replace: true })
  }
  function irParaPagina(page: number) {
    void navigate({ search: (prev) => ({ ...prev, page }) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Busca com debounce
  const [termo, setTermo] = useState(search.q ?? '')
  useEffect(() => setTermo(search.q ?? ''), [search.q])
  useEffect(() => {
    const t = setTimeout(() => {
      if (termo.trim() !== (search.q ?? '')) atualizar({ q: termo.trim() || undefined })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo])

  function aplicarPreco(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    atualizar({ minPrice: preco(f.get('minPrice')), maxPrice: preco(f.get('maxPrice')) })
  }

  const temFiltro = !!(search.q || search.network || search.minPrice || search.maxPrice)
  const totalPages = nfts.data ? Math.max(1, Math.ceil(nfts.data.total / nfts.data.pageSize)) : 1

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Explore NFTs</h1>
        <p className="text-[#CFB28C]">Descubra, colecione e negocie ativos digitais.</p>
      </header>

      <section aria-label="Filtros" className="grid gap-3 rounded-xl bg-[#241612] p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex flex-col gap-1">
          <label htmlFor="busca" className="text-xs text-[#CFB28C]">Buscar</label>
          <input
            id="busca"
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Nome do NFT"
            className="rounded-md border border-[#CFB28C]/30 bg-[#140D0A] px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="rede" className="text-xs text-[#CFB28C]">Rede</label>
          <select
            id="rede"
            value={search.network ?? ''}
            onChange={(e) => atualizar({ network: (e.target.value || undefined) as Network | undefined })}
            className="rounded-md border border-[#CFB28C]/30 bg-[#140D0A] px-3 py-2"
          >
            <option value="">Todas</option>
            {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <form
          key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`}
          onSubmit={aplicarPreco}
          className="flex items-end gap-2"
          aria-label="Faixa de preço"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="min" className="text-xs text-[#CFB28C]">Mín. (ETH)</label>
            <input id="min" name="minPrice" type="number" min="0" step="any" defaultValue={search.minPrice}
              className="w-24 rounded-md border border-[#CFB28C]/30 bg-[#140D0A] px-2 py-2" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="max" className="text-xs text-[#CFB28C]">Máx. (ETH)</label>
            <input id="max" name="maxPrice" type="number" min="0" step="any" defaultValue={search.maxPrice}
              className="w-24 rounded-md border border-[#CFB28C]/30 bg-[#140D0A] px-2 py-2" />
          </div>
          <button className="rounded-md border border-[#D28A4C] px-3 py-2 text-[#D28A4C]">Aplicar</button>
        </form>

        <div className="flex flex-col gap-1">
          <label htmlFor="ordem" className="text-xs text-[#CFB28C]">Ordenar</label>
          <select
            id="ordem"
            value={search.sort}
            onChange={(e) => atualizar({ sort: e.target.value as SortOption })}
            className="rounded-md border border-[#CFB28C]/30 bg-[#140D0A] px-3 py-2"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-[#CFB28C]">
        <p aria-live="polite">
          {nfts.data ? `${nfts.data.total} resultado${nfts.data.total === 1 ? '' : 's'}` : 'Carregando…'}
        </p>
        {temFiltro && (
          <button
            onClick={() => {
              setTermo('')
              void navigate({ search: { sort: search.sort }, replace: true })
            }}
            className="text-[#D28A4C] underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {nfts.isPending ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => <li key={i}><NftCardSkeleton /></li>)}
        </ul>
      ) : nfts.isError ? (
        <div role="alert" className="space-y-3 rounded-xl bg-[#241612] p-6 text-center">
          <p>Não foi possível carregar os NFTs.</p>
          <button onClick={() => nfts.refetch()} className="rounded-md bg-[#D28A4C] px-4 py-2 font-semibold text-[#140D0A]">
            Tentar novamente
          </button>
        </div>
      ) : nfts.data.items.length === 0 ? (
        <div className="rounded-xl bg-[#241612] p-6 text-center text-[#CFB28C]">
          Nenhum NFT encontrado com esses filtros.
        </div>
      ) : (
        <ul
          className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${nfts.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {nfts.data.items.map((nft) => <li key={nft.id}><NftCard nft={nft} /></li>)}
        </ul>
      )}

      {nfts.data && totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-2">
          <button
            onClick={() => irParaPagina(search.page - 1)}
            disabled={search.page <= 1}
            className="rounded-md border border-[#CFB28C]/30 px-3 py-2 disabled:opacity-40"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => irParaPagina(p)}
              aria-current={p === search.page ? 'page' : undefined}
              className={`size-10 rounded-md ${p === search.page ? 'bg-[#D28A4C] font-bold text-[#140D0A]' : 'border border-[#CFB28C]/30'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => irParaPagina(search.page + 1)}
            disabled={search.page >= totalPages}
            className="rounded-md border border-[#CFB28C]/30 px-3 py-2 disabled:opacity-40"
          >
            Próxima
          </button>
        </nav>
      )}
    </main>
  )
}