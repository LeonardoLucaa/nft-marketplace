import { http, HttpResponse, delay } from 'msw'
import {
  CATEGORIES,
  NETWORKS,
  type CatalogTab,
  type Category,
  type Network,
  type Nft,
  type NftFacets,
  type NftListResponse,
} from '@/types/api'
import { db } from './db'
import { socketHandlers } from './socket'

const PAGE_SIZE = 9
const QTD_NOVOS = 4

// Converte "1.19" em bigint com 18 casas, para comparar preços sem erro de float
function toUnits(value: string): bigint {
  const [inteiro = '0', fracao = ''] = value.trim().split('.')
  return BigInt(inteiro || '0') * 10n ** 18n + BigInt((fracao + '0'.repeat(18)).slice(0, 18) || '0')
}

function compareUnits(a: string, b: string) {
  const x = toUnits(a)
  const y = toUnits(b)
  return x < y ? -1 : x > y ? 1 : 0
}

function buildFacets(list: Nft[]): NftFacets {
  const categories = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>
  const networks = Object.fromEntries(NETWORKS.map((n) => [n, 0])) as Record<Network, number>
  for (const n of list) {
    categories[n.category] = (categories[n.category] ?? 0) + 1
    networks[n.network] = (networks[n.network] ?? 0) + 1
  }
  return { categories, networks }
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const p = new URL(request.url).searchParams
    const q = (p.get('q') ?? '').toLowerCase()
    const network = p.get('network')
    const category = p.get('category')
    const tab = (p.get('tab') ?? 'all') as CatalogTab
    const min = p.get('minPrice')
    const max = p.get('maxPrice')
    const sort = p.get('sort') ?? 'recent'
    const page = Math.max(1, Number(p.get('page') ?? 1))

    // "Novos lançamentos" = os listados mais recentemente
    const novos = new Set(
      [...db.nfts]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, QTD_NOVOS)
        .map((n) => n.id),
    )
    const passaAba = (n: Nft) =>
      tab === 'all' ||
      (tab === 'new' && novos.has(n.id)) ||
      (tab === 'trending' && (n.rare || !!n.oldPrice))

    // Filtros base (busca + preço): usados para as contagens das facetas
    const base = db.nfts.filter(
      (n) =>
        n.name.toLowerCase().includes(q) &&
        (!min || compareUnits(n.price, min) >= 0) &&
        (!max || compareUnits(n.price, max) <= 0),
    )

    let list: Nft[] = base.filter(
      (n) =>
        (!network || n.network === network) &&
        (!category || n.category === category) &&
        passaAba(n),
    )

    if (sort === 'price_asc') list = [...list].sort((a, b) => compareUnits(a.price, b.price))
    if (sort === 'price_desc') list = [...list].sort((a, b) => compareUnits(b.price, a.price))
    if (sort === 'recent') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    await delay(400)

    const body: NftListResponse = {
      items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: list.length,
      page,
      pageSize: PAGE_SIZE,
      facets: buildFacets(base),
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    await delay()
    const nft = db.nfts.find((n) => n.id === params.id)
    if (!nft) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 })
    }
    return HttpResponse.json(nft)
  }),

  ...socketHandlers,
]