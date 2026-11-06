import { http, HttpResponse, delay } from 'msw'
import type { Cart, CartItem } from '@/types/api'
import { multiplicarEth, somarEth } from '@/lib/eth'
import { db, save } from './db'
import { donoDoCarrinho, erro } from './utils'

function montarCarrinho(key: string): Cart {
  const items: CartItem[] = (db.carts[key] ?? []).flatMap((l) => {
    const nft = db.nfts.find((n) => n.id === l.nftId)
    const ed = nft?.editions.find((e) => e.id === l.editionId)
    if (!nft || !ed) return []
    return [{
      id: l.id, nftId: nft.id, editionId: ed.id, editionLabel: ed.label,
      name: nft.name, image: nft.image, price: nft.price,
      quantity: l.quantity, available: ed.available,
    }]
  })
  return {
    items,
    subtotal: somarEth(...items.map((i) => multiplicarEth(i.price, i.quantity))),
    count: items.reduce((t, i) => t + i.quantity, 0),
  }
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await delay()
    const dono = donoDoCarrinho(request)
    if (!dono.ok) return dono.error
    return HttpResponse.json(montarCarrinho(dono.key))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay()
    const dono = donoDoCarrinho(request)
    if (!dono.ok) return dono.error

    const b = (await request.json()) as { nftId?: string; editionId?: string; quantity?: number }
    const qtd = Number(b.quantity)
    if (!b.nftId || !b.editionId || !Number.isInteger(qtd) || qtd < 1) {
      return erro(422, 'VALIDATION', 'Dados inválidos.')
    }
    const nft = db.nfts.find((n) => n.id === b.nftId)
    const ed = nft?.editions.find((e) => e.id === b.editionId)
    if (!nft || !ed) return erro(404, 'NOT_FOUND', 'NFT ou edição não encontrada.')

    const linhas = (db.carts[dono.key] ??= [])
    const existente = linhas.find((l) => l.nftId === nft.id && l.editionId === ed.id)
    const total = (existente?.quantity ?? 0) + qtd
    if (total > ed.available) {
      const jaTem = existente ? ` Você já tem ${existente.quantity} no carrinho.` : ''
      return erro(409, 'OUT_OF_STOCK', `Só há ${ed.available} unidade(s) desta edição.${jaTem}`)
    }
    if (existente) existente.quantity = total
    else linhas.push({ id: crypto.randomUUID(), nftId: nft.id, editionId: ed.id, quantity: qtd })
    save()
    return HttpResponse.json(montarCarrinho(dono.key), { status: 201 })
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    await delay()
    const dono = donoDoCarrinho(request)
    if (!dono.ok) return dono.error

    const linha = db.carts[dono.key]?.find((l) => l.id === params.itemId)
    if (!linha) return erro(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    const { quantity } = (await request.json()) as { quantity?: number }
    const qtd = Number(quantity)
    if (!Number.isInteger(qtd) || qtd < 1) return erro(422, 'VALIDATION', 'Quantidade inválida.')

    const max = db.nfts.find((n) => n.id === linha.nftId)?.editions.find((e) => e.id === linha.editionId)?.available ?? 0
    if (qtd > max) return erro(409, 'OUT_OF_STOCK', `Só há ${max} unidade(s) desta edição.`)
    linha.quantity = qtd
    save()
    return HttpResponse.json(montarCarrinho(dono.key))
  }),

  http.delete('/api/cart/items/:itemId', async ({ request, params }) => {
    await delay()
    const dono = donoDoCarrinho(request)
    if (!dono.ok) return dono.error
    db.carts[dono.key] = (db.carts[dono.key] ?? []).filter((l) => l.id !== params.itemId)
    save()
    return HttpResponse.json(montarCarrinho(dono.key))
  }),
]