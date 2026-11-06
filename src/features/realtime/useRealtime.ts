import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { socket } from '@/lib/socket'
import { getToken } from '@/lib/session'
import { useSession } from '@/features/auth/queries'
import type { NftUpdatedEvent, Order } from '@/types/api'

const TERMINAL = new Set<Order['status']>(['confirmed', 'failed'])

function paraVersao(valor: unknown): number | null {
  if (typeof valor === 'number') return valor
  if (typeof valor === 'string') {
    const t = Date.parse(valor)
    return Number.isNaN(t) ? null : t
  }
  return null
}

// Aplica o patch somente em itens que já estão no cache de listas
function patchLista(data: unknown, e: NftUpdatedEvent): unknown {
  if (!data || typeof data !== 'object') return data
  const d = data as { items?: Array<{ id: string; price: string; stock?: number }> }
  if (!Array.isArray(d.items)) return data
  return {
    ...d,
    items: d.items.map((n) => (n.id === e.id ? { ...n, price: e.price, stock: e.stock } : n)),
  }
}

function reconciliar(qc: QueryClient) {
  // Só refaz o que está na tela (queries ativas); o resto fica stale
  for (const key of [['nfts'], ['nft'], ['cart'], ['order']]) {
    qc.invalidateQueries({ queryKey: key, refetchType: 'active' })
  }
}

/**
 * Conecta o Socket.IO somente com sessão ativa e o desliga no logout ou
 * troca de usuário. O efeito depende do userId, então os listeners da
 * sessão anterior são removidos e o cache de versões é descartado.
 */
export function useRealtime() {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!userId) return

    // última versão aplicada por recurso: ignora duplicados e eventos antigos
    const versoes = new Map<string, number>()
    const jaViu = (chave: string, v: number) => {
      const atual = versoes.get(chave)
      if (atual !== undefined && v <= atual) return true
      versoes.set(chave, v)
      return false
    }

    let primeiraConexao = true

    const aoConectar = () => {
      socket.emit('session:auth', getToken())
      // após reconexão, a API REST é a fonte da verdade
      if (!primeiraConexao) reconciliar(qc)
      primeiraConexao = false
    }

    const aoNftAtualizado = (e: NftUpdatedEvent) => {
      const v = paraVersao(e.updatedAt)
      if (v !== null && jaViu(`nft:${e.id}`, v)) return

      qc.setQueryData(['nft', e.id], (old: unknown) =>
        old && typeof old === 'object' ? { ...old, price: e.price, stock: e.stock } : old,
      )
      qc.setQueriesData({ queryKey: ['nfts'] }, (old: unknown) => patchLista(old, e))
      // o carrinho/cotação dependem do preço: o servidor recalcula o resumo
      qc.invalidateQueries({ queryKey: ['cart'] })
    }

    const aoPedidoAtualizado = (order: Order) => {
      const atual = qc.getQueryData<Order>(['order', order.id])
      // estados terminais nunca regridem nem mudam
      if (atual && TERMINAL.has(atual.status)) return
      // evento repetido do mesmo estado
      if (atual && atual.status === order.status) return

      qc.setQueryData(['order', order.id], order)
      qc.invalidateQueries({ queryKey: ['order', order.id] })
      if (order.status === 'confirmed') qc.invalidateQueries({ queryKey: ['cart'] })
    }

    socket.on('connect', aoConectar)
    socket.on('nft.updated', aoNftAtualizado)
    socket.on('order.updated', aoPedidoAtualizado)
    socket.connect()

    return () => {
      socket.off('connect', aoConectar)
      socket.off('nft.updated', aoNftAtualizado)
      socket.off('order.updated', aoPedidoAtualizado)
      socket.disconnect()
      versoes.clear()
    }
  }, [userId, qc])
}