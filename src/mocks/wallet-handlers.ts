import { http, HttpResponse, delay } from 'msw'
import type { WalletInput } from '@/features/wallets/api'
import { NETWORKS, type Network, type Wallet } from '@/types/api'
import { autenticar, erro } from './utils'

const CHAVE = 'kurio-msw-wallets-v1'
const MAX_CARTEIRAS = 4 // 1 principal + até 3 secundárias

export const controlesCarteira = { falharProximaConexao: false }

type Store = Record<string, Wallet[]> // chave: userId

function ler(): Store {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) ?? '') as Store
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}
const gravar = (s: Store) => localStorage.setItem(CHAVE, JSON.stringify(s))

export function resetCarteiras() {
  localStorage.removeItem(CHAVE)
  controlesCarteira.falharProximaConexao = false
}

const EVM = /^0x[a-fA-F0-9]{40}$/
const ENDERECO: Record<Network, RegExp> = {
  Ethereum: EVM,
  Polygon: EVM,
  Solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
}
const chave = (n: Network, a: string) => `${n}:${n === 'Solana' ? a : a.toLowerCase()}`

function validar(b: Partial<WalletInput>) {
  const label = b.label?.trim() ?? ''
  const address = b.address?.trim() ?? ''
  const network = b.network as Network
  const fields: Record<string, string> = {}
  if (label.length < 2 || label.length > 30) fields.label = 'Dê um nome de 2 a 30 caracteres.'
  if (!NETWORKS.includes(network)) fields.network = 'Escolha uma rede.'
  else if (!ENDERECO[network].test(address)) {
    fields.address =
      network === 'Solana'
        ? 'Endereço Solana inválido (32 a 44 caracteres base58).'
        : 'Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais.'
  }
  return { fields, label, address, network }
}

type Ctx = { ok: true; userId: string; store: Store; lista: Wallet[] } | { ok: false; error: Response }

function contexto(request: Request): Ctx {
  const auth = autenticar(request)
  if (!auth.ok) return auth
  const store = ler()
  return { ok: true, userId: auth.user.id, store, lista: store[auth.user.id] ?? [] }
}

function salvar(c: Extract<Ctx, { ok: true }>, lista: Wallet[], status = 200) {
  c.store[c.userId] = lista
  gravar(c.store)
  return HttpResponse.json(lista, { status })
}

const naoEncontrada = () => erro(404, 'NOT_FOUND', 'Carteira não encontrada.')
const duplicada = () =>
  erro(409, 'DUPLICATE_WALLET', 'Esta carteira já está cadastrada.', { address: 'Esta carteira já está cadastrada.' })

export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    await delay()
    const c = contexto(request)
    if (!c.ok) return c.error
    return HttpResponse.json(c.lista)
  }),

  http.post('/api/wallets', async ({ request }) => {
    await delay()
    const c = contexto(request)
    if (!c.ok) return c.error
    const v = validar((await request.json().catch(() => ({}))) as Partial<WalletInput>)
    if (Object.keys(v.fields).length) return erro(422, 'VALIDATION', 'Verifique os campos.', v.fields)
    if (c.lista.length >= MAX_CARTEIRAS) {
      return erro(409, 'WALLET_LIMIT', `Você pode cadastrar até ${MAX_CARTEIRAS} carteiras.`)
    }
    if (c.lista.some((w) => chave(w.network, w.address) === chave(v.network, v.address))) return duplicada()

    const nova: Wallet = {
      id: `wal_${crypto.randomUUID().slice(0, 8)}`,
      label: v.label,
      address: v.address,
      network: v.network,
      primary: c.lista.length === 0, // a primeira carteira é a principal
      connected: false,
      createdAt: new Date().toISOString(),
    }
    return salvar(c, [...c.lista, nova], 201)
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    await delay()
    const c = contexto(request)
    if (!c.ok) return c.error
    const atual = c.lista.find((w) => w.id === params.id)
    if (!atual) return naoEncontrada()

    const v = validar((await request.json().catch(() => ({}))) as Partial<WalletInput>)
    if (Object.keys(v.fields).length) return erro(422, 'VALIDATION', 'Verifique os campos.', v.fields)
    if (c.lista.some((w) => w.id !== atual.id && chave(w.network, w.address) === chave(v.network, v.address))) {
      return duplicada()
    }

    // Trocar endereço ou rede invalida a conexão anterior.
    const mudou = chave(atual.network, atual.address) !== chave(v.network, v.address)
    return salvar(
      c,
      c.lista.map((w) =>
        w.id === atual.id
          ? { ...w, label: v.label, address: v.address, network: v.network, connected: mudou ? false : w.connected }
          : w,
      ),
    )
  }),

  http.delete('/api/wallets/:id', async ({ request, params }) => {
    await delay()
    const c = contexto(request)
    if (!c.ok) return c.error
    const alvo = c.lista.find((w) => w.id === params.id)
    if (!alvo) return naoEncontrada()
    const resto = c.lista.filter((w) => w.id !== alvo.id)
    // Removeu a principal: a mais antiga das restantes assume.
    if (alvo.primary && resto.length) resto[0] = { ...resto[0], primary: true }
    return salvar(c, resto)
  }),

  http.post('/api/wallets/:id/primary', async ({ request, params }) => {
    await delay()
    const c = contexto(request)
    if (!c.ok) return c.error
    if (!c.lista.some((w) => w.id === params.id)) return naoEncontrada()
    return salvar(c, c.lista.map((w) => ({ ...w, primary: w.id === params.id })))
  }),

  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    await delay(800)
    const c = contexto(request)
    if (!c.ok) return c.error
    if (!c.lista.some((w) => w.id === params.id)) return naoEncontrada()
    if (controlesCarteira.falharProximaConexao) {
      controlesCarteira.falharProximaConexao = false
      return erro(502, 'WALLET_CONNECTION_FAILED', 'Não foi possível conectar à carteira. Tente novamente.')
    }
    return salvar(c, c.lista.map((w) => (w.id === params.id ? { ...w, connected: true } : w)))
  }),

  http.post('/api/wallets/:id/disconnect', async ({ request, params }) => {
    await delay()
    const c = contexto(request)
    if (!c.ok) return c.error
    if (!c.lista.some((w) => w.id === params.id)) return naoEncontrada()
    return salvar(c, c.lista.map((w) => (w.id === params.id ? { ...w, connected: false } : w)))
  }),
]

// Roda antes do handler de pedidos: sem carteira conectada não há compra.
// Quando tudo está certo ele não responde, e o MSW segue para o próximo handler.
export const carteiraNoPedido = http.post('/api/orders', async ({ request }) => {
  const auth = autenticar(request)
  if (!auth.ok) return // o handler de pedidos responde 401
  const { walletId } = ((await request.clone().json().catch(() => ({}))) as { walletId?: string })
  if (!walletId) return erro(422, 'WALLET_REQUIRED', 'Escolha uma carteira para pagar.')
  const w = (ler()[auth.user.id] ?? []).find((x) => x.id === walletId)
  if (!w) return erro(422, 'WALLET_NOT_FOUND', 'Carteira não encontrada. Escolha outra.')
  if (!w.connected) {
    return erro(422, 'WALLET_DISCONNECTED', `A carteira ${w.label} está desconectada. Reconecte para pagar.`)
  }
})