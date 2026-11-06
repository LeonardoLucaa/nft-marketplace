import { http, HttpResponse, delay } from 'msw'
import type { Nft, NftListResponse } from '@/types/api'
import { db } from './db'
import { socketHandlers } from './socket'

const PAGE_SIZE = 6

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const p = new URL(request.url).searchParams
    const q = (p.get('q') ?? '').toLowerCase()
    const network = p.get('network')
    const min = p.get('minPrice')
    const max = p.get('maxPrice')
    const sort = p.get('sort') ?? 'recent'
    const page = Number(p.get('page') ?? 1)

    let list: Nft[] = db.nfts.filter(
      (n) =>
        n.name.toLowerCase().includes(q) &&
        (!network || n.network === network) &&
        (!min || Number(n.price) >= Number(min)) &&
        (!max || Number(n.price) <= Number(max)),
    )

    if (sort === 'price_asc') list = [...list].sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'price_desc') list = [...list].sort((a, b) => Number(b.price) - Number(a.price))
    if (sort === 'recent') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    await delay(400)

    const body: NftListResponse = {
      items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: list.length,
      page,
      pageSize: PAGE_SIZE,
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