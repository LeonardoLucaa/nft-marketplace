import { delay, http, HttpResponse } from 'msw'
import { fromWei, toWei } from '@/lib/eth'
import type { Coupon, Network, Order, Quote, QuoteLine } from '@/types/api'
import { db, save } from './db'
import { baixarEstoque, emitirParaUsuario } from './realtime'

// ===================== acesso ao db =====================
function usuarioDaRequest(request: Request): { id: string } | undefined {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return undefined
  const sessao = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now())
  return sessao ? db.users.find((u) => u.id === sessao.userId) : undefined
}
function buscarNft(id: string) {
  return db.nfts.find((n) => n.id === id)
}
function estoque(id: string) {
  return buscarNft(id)?.stock ?? 1
}
function itensDoCarrinho(userId: string) {
  return db.carts[userId] ?? []
}
function limparCarrinho(userId: string) {
  db.carts[userId] = []
  save()
}
// =========================================================

const QUOTE_TTL_MS = 5 * 60_000
const PROCESSAMENTO_MS = 2_500
const CUPONS: Record<string, number> = { KURIO10: 10, BEMVINDO5: 5 }
const TAXA_REDE: Record<Network, string> = { Ethereum: '0.0021', Polygon: '0.0002', Solana: '0.0001' }

type QuoteSalva = Quote & { userId: string }
type PedidoSalvo = Order & { userId: string; idempotencyKey: string; processaEm: number; falhar: boolean }
type Store = { quotes: QuoteSalva[]; orders: PedidoSalvo[] }

const CHAVE = 'kurio-msw-orders-v1'
export const controlesPedido = { falharProximo: false }

function ler(): Store {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '') as Store
  } catch {
    return { quotes: [], orders: [] }
  }
}
function gravar(s: Store) {
  localStorage.setItem(CHAVE, JSON.stringify(s))
}
export function resetPedidos() {
  localStorage.removeItem(CHAVE)
  controlesPedido.falharProximo = false
}

function erro(status: number, code: string, message: string, fields?: Record<string, string>) {
  return HttpResponse.json({ code, message, fields }, { status })
}

function pedidoPublico({ userId: _u, idempotencyKey: _k, processaEm: _p, falhar: _f, ...order }: PedidoSalvo): Order {
  return order
}

type Valores = Omit<Quote, 'id' | 'expiresAt'>

function calcular(userId: string, couponCode?: string | null): { erro: Response } | { valores: Valores } {
  const itens = itensDoCarrinho(userId)
  if (itens.length === 0) return { erro: erro(422, 'CART_EMPTY', 'Seu carrinho está vazio.') }

  const lines: QuoteLine[] = []
  for (const item of itens) {
    const nft = buscarNft(item.nftId)
    if (!nft) return { erro: erro(409, 'NFT_UNAVAILABLE', 'Um item do carrinho não está mais disponível.') }
    if ((nft.stock ?? 1) < item.quantity) {
      return { erro: erro(409, 'OUT_OF_STOCK', `${nft.name} esgotou. Remova do carrinho para continuar.`) }
    }
    lines.push({
      nftId: nft.id,
      name: nft.name,
      image: nft.image,
      network: nft.network,
      quantity: item.quantity,
      unitPrice: nft.price,
      lineTotal: fromWei(toWei(nft.price) * BigInt(item.quantity)),
    })
  }

  let coupon: Coupon | null = null
  if (couponCode?.trim()) {
    const code = couponCode.trim().toUpperCase()
    const pct = CUPONS[code]
    if (!pct) {
      return { erro: erro(422, 'VALIDATION', 'Cupom inválido.', { couponCode: 'Cupom inválido ou expirado.' }) }
    }
    coupon = { code, percentOff: pct }
  }

  const subtotal = lines.reduce((s, l) => s + toWei(l.lineTotal), 0n)
  const discount = coupon ? (subtotal * BigInt(coupon.percentOff)) / 100n : 0n
  const redes = new Set(lines.map((l) => l.network))
  const fee = [...redes].reduce((s, r) => s + toWei(TAXA_REDE[r]), 0n)

  return {
    valores: {
      lines,
      coupon,
      subtotal: fromWei(subtotal),
      discount: fromWei(discount),
      networkFee: fromWei(fee),
      total: fromWei(subtotal - discount + fee),
    },
  }
}

// O status avança pelo "servidor" (timer ou GET de reserva) e é publicado via socket.
function atualizarStatus(p: PedidoSalvo): boolean {
  if (p.status !== 'processing' || Date.now() < p.processaEm) return false

  const esgotou = p.lines.some((l) => estoque(l.nftId) < l.quantity)

  if (p.falhar || esgotou) {
    p.status = 'failed'
    p.failureReason = esgotou
      ? 'Um item esgotou antes da confirmação.'
      : 'Pagamento recusado pela rede.'
  } else {
    p.status = 'confirmed'
    p.lines.forEach((l) => baixarEstoque(l.nftId, l.quantity)) // emite nft.updated
    limparCarrinho(p.userId)
  }

  emitirParaUsuario(p.userId, 'order.updated', pedidoPublico(p))
  return true
}

function agendarProcessamento(orderId: string) {
  setTimeout(() => {
    const s = ler()
    const pedido = s.orders.find((o) => o.id === orderId)
    if (pedido && atualizarStatus(pedido)) gravar(s)
  }, PROCESSAMENTO_MS + 50)
}

export const orderHandlers = [
  http.post('/api/checkout/quote', async ({ request }) => {
    await delay(300)
    const user = usuarioDaRequest(request)
    if (!user) return erro(401, 'UNAUTHORIZED', 'Faça login para continuar.')

    const body = (await request.json().catch(() => ({}))) as { couponCode?: string | null }
    const r = calcular(user.id, body.couponCode)
    if ('erro' in r) return r.erro

    const quote: QuoteSalva = {
      ...r.valores,
      id: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
      userId: user.id,
    }
    const s = ler()
    s.quotes = [...s.quotes.filter((q) => Date.parse(q.expiresAt) > Date.now()), quote]
    gravar(s)

    const { userId: _u, ...publica } = quote
    return HttpResponse.json(publica)
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(600)
    const user = usuarioDaRequest(request)
    if (!user) return erro(401, 'UNAUTHORIZED', 'Faça login para continuar.')

    const key = request.headers.get('Idempotency-Key')
    if (!key) return erro(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Header Idempotency-Key é obrigatório.')

    // Lê o body ANTES do store: daqui pra baixo não há await,
    // então duas requisições simultâneas não criam dois pedidos.
    const { quoteId } = (await request.json().catch(() => ({}))) as { quoteId?: string }

    const s = ler()
    const existente = s.orders.find((o) => o.userId === user.id && o.idempotencyKey === key)
    if (existente) return HttpResponse.json(pedidoPublico(existente), { status: 200 })

    const quote = s.quotes.find((q) => q.id === quoteId && q.userId === user.id)
    if (!quote) return erro(404, 'QUOTE_NOT_FOUND', 'Cotação não encontrada.')
    if (Date.parse(quote.expiresAt) < Date.now()) {
      return erro(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise os valores.')
    }

    const atual = calcular(user.id, quote.coupon?.code)
    if ('erro' in atual) return atual.erro
    if (
      atual.valores.total !== quote.total ||
      JSON.stringify(atual.valores.lines) !== JSON.stringify(quote.lines)
    ) {
      return erro(409, 'QUOTE_OUTDATED', 'O preço de algum item mudou. Revise o pedido.')
    }

    const pedido: PedidoSalvo = {
      ...atual.valores,
      id: `ord_${crypto.randomUUID().slice(0, 8)}`,
      status: 'processing',
      createdAt: new Date().toISOString(),
      userId: user.id,
      idempotencyKey: key,
      processaEm: Date.now() + PROCESSAMENTO_MS,
      falhar: controlesPedido.falharProximo,
    }
    controlesPedido.falharProximo = false

    s.orders.push(pedido)
    s.quotes = s.quotes.filter((q) => q.id !== quote.id)
    gravar(s)
    agendarProcessamento(pedido.id)

    return HttpResponse.json(pedidoPublico(pedido), { status: 201 })
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await delay(200)
    const user = usuarioDaRequest(request)
    if (!user) return erro(401, 'UNAUTHORIZED', 'Faça login para continuar.')

    const s = ler()
    const pedido = s.orders.find((o) => o.id === params.id && o.userId === user.id)
    if (!pedido) return erro(404, 'NOT_FOUND', 'Pedido não encontrado.')

    if (atualizarStatus(pedido)) gravar(s) // reserva, caso o timer tenha se perdido (reload)
    return HttpResponse.json(pedidoPublico(pedido))
  }),
]