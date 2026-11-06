import type { toSocketIo } from '@mswjs/socket.io-binding'
import { fromWei, toWei } from '@/lib/eth'
import type { NftUpdatedEvent } from '@/types/api'
import { db, save } from './db'

type Io = ReturnType<typeof toSocketIo>
type Cliente = { io: Io; userId: string | null }

const clientes = new Map<string, Cliente>()

export function registrarCliente(id: string, io: Io) {
  clientes.set(id, { io, userId: null })
}
export function removerCliente(id: string) {
  clientes.delete(id)
}
export function autenticarCliente(id: string, userId: string | null) {
  const c = clientes.get(id)
  if (c) c.userId = userId
}

export function emitirParaTodos(evento: string, payload: unknown) {
  clientes.forEach((c) => c.io.client.emit(evento, payload))
}
// Eventos privados (pedido) só vão para as conexões autenticadas daquele usuário
export function emitirParaUsuario(userId: string, evento: string, payload: unknown) {
  clientes.forEach((c) => {
    if (c.userId === userId) c.io.client.emit(evento, payload)
  })
}

export function usuarioPorToken(token: unknown): string | null {
  if (typeof token !== 'string' || !token) return null
  const sessao = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now())
  return sessao?.userId ?? null
}

function publicarNft(id: string) {
  const nft = db.nfts.find((n) => n.id === id)
  if (!nft) return
  const evento: NftUpdatedEvent = {
    id: nft.id,
    price: nft.price,
    stock: nft.stock ?? 1,
    updatedAt: new Date().toISOString(),
  }
  emitirParaTodos('nft.updated', evento)
}

export function alterarPreco(id: string, price: string) {
  const nft = db.nfts.find((n) => n.id === id)
  if (!nft) return `NFT ${id} não encontrado`
  nft.price = price
  save()
  publicarNft(id)
  return `${id} agora custa ${price} ETH`
}

export function baixarEstoque(id: string, quantidade: number) {
  const nft = db.nfts.find((n) => n.id === id)
  if (!nft) return
  nft.stock = Math.max(0, (nft.stock ?? 1) - quantidade)
  save()
  publicarNft(id)
}

// ---------- ticker de preços ----------
const CENTAVO = 10n ** 16n // 0.01 ETH
let ticker: ReturnType<typeof setInterval> | undefined
let pausado = false

export function iniciarTicker(intervaloMs = 10_000) {
  if (ticker) return
  ticker = setInterval(() => {
    if (pausado || clientes.size === 0) return
    const disponiveis = db.nfts.filter((n) => (n.stock ?? 1) > 0)
    const nft = disponiveis[Math.floor(Math.random() * disponiveis.length)]
    if (!nft) return

    const variacao = BigInt(Math.round((Math.random() * 0.16 - 0.08) * 10_000)) // ±8%
    let novo = (toWei(nft.price) * (10_000n + variacao)) / 10_000n
    novo = (novo / CENTAVO) * CENTAVO // arredonda para 2 casas
    if (novo < CENTAVO) novo = CENTAVO

    alterarPreco(nft.id, fromWei(novo))
  }, intervaloMs)
}

export function pausarTicker(valor: boolean) {
  pausado = valor
  return valor ? 'ticker pausado' : 'ticker rodando'
}

export function publicarPedido(userId: string, id: string, status: 'pending' | 'confirmed' | 'declined') {
  emitirParaUsuario(userId, 'order.updated', { id, status, updatedAt: new Date().toISOString() })
}