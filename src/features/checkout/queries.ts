import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { buscarPedido, criarCotacao, criarPedido } from './api'
import { socket } from '@/lib/socket'

export const quoteOptions = (cupom: string | null) =>
  queryOptions({
    queryKey: ['checkout', 'quote', cupom],
    queryFn: ({ signal }) => criarCotacao(cupom, signal),
    staleTime: 60_000,
    gcTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  })

export function useQuote(cupom: string | null) {
  return useQuery(quoteOptions(cupom))
}

export function useCriarPedido() {
  return useMutation({
    mutationFn: (v: { quoteId: string; idempotencyKey: string }) => criarPedido(v.quoteId, v.idempotencyKey),
  })
}

export function useOrder(id: string) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['order', id],
    queryFn: async ({ signal }) => {
      const order = await buscarPedido(id, signal)
      if (order.status === 'confirmed') {
        void qc.invalidateQueries({ queryKey: ['cart'] })
        void qc.invalidateQueries({ queryKey: ['nfts'] })
      }
      return order
    },
    // Polling enquanto processa; na etapa do Socket.IO o evento order.updated complementa isso.
    refetchInterval: (q) =>
      q.state.data?.status === 'processing' ? (socket.connected ? 5_000 : 1_000) : false,
    retry: (n, err) => !(isAxiosError(err) && err.response?.status === 404) && n < 2,
  })
}