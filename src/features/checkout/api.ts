import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import type { ApiError, Order, Quote } from '@/types/api'

export async function criarCotacao(couponCode: string | null, signal?: AbortSignal) {
  const { data } = await api.post<Quote>('/checkout/quote', { couponCode }, { signal })
  return data
}

export async function criarPedido(quoteId: string, idempotencyKey: string, walletId: string) {
  const { data } = await api.post<Order>(
    '/orders',
    { quoteId, walletId },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return data
}

export async function buscarPedido(id: string, signal?: AbortSignal) {
  const { data } = await api.get<Order>(`/orders/${id}`, { signal })
  return data
}

export function codigoErro(err: unknown) {
  return isAxiosError<ApiError>(err) ? err.response?.data?.code : undefined
}
export function mensagemErro(err: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  return (isAxiosError<ApiError>(err) && err.response?.data?.message) || fallback
}
export function erroDeCampo(err: unknown, campo: string) {
  return isAxiosError<ApiError>(err) ? err.response?.data?.fields?.[campo] : undefined
}