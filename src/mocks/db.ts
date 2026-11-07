import type { Nft, User } from '@/types/api'
import { nftsSeed } from './fixtures'

export type UserRecord = User & { passwordHash: string }
export type SessionRecord = { token: string; userId: string; expiresAt: number }
export type CartLine = { id: string; nftId: string; editionId: string; quantity: number }

type State = {
  nfts: Nft[]
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: Record<string, CartLine[]> // chave: userId ou "guest:<id>"
  favorites: Record<string, string[]>
}

const KEY = 'kurio-msw-db-v5'
const CHAVES_ANTIGAS = ['kurio-msw-db-v1', 'kurio-msw-db-v2', 'kurio-msw-db-v3', 'kurio-msw-db-v4']
// sha256("kurio:Senha@123")
const SENHA_PADRAO = 'e4f3920e8bfa128140400b690ae0766eb1839007c92bae8962f0113914039cf5'

function seed(): State {
  return {
    nfts: structuredClone(nftsSeed),
    users: [
      { id: 'u1', name: 'Ana Collector', email: 'ana@kurio.dev', passwordHash: SENHA_PADRAO },
      { id: 'u2', name: 'Bruno Holder', email: 'bruno@kurio.dev', passwordHash: SENHA_PADRAO },
    ],
    sessions: [],
    carts: {},
    favorites: {},
  }
}

function load(): State {
  try {
    CHAVES_ANTIGAS.forEach((k) => localStorage.removeItem(k))
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* estado corrompido: usa o seed */
  }
  return seed()
}

export const db: State = load()
export const save = () => localStorage.setItem(KEY, JSON.stringify(db))
export function resetDb() {
  Object.assign(db, seed())
  save()
}

export async function hashPassword(senha: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kurio:${senha}`))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const toUser = (u: UserRecord): User => ({
  id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl,
})

export function disponivel(nftId: string, editionId: string) {
  return db.nfts.find((n) => n.id === nftId)?.editions.find((e) => e.id === editionId)?.available ?? 0
}

export function mergeCarts(de: string, para: string) {
  const origem = db.carts[de] ?? []
  const destino = db.carts[para] ?? []
  for (const linha of origem) {
    const max = disponivel(linha.nftId, linha.editionId)
    const existente = destino.find((l) => l.nftId === linha.nftId && l.editionId === linha.editionId)
    if (existente) existente.quantity = Math.min(existente.quantity + linha.quantity, max)
    else destino.push({ ...linha, quantity: Math.min(linha.quantity, max) })
  }
  db.carts[para] = destino.filter((l) => l.quantity > 0)
  delete db.carts[de]
}