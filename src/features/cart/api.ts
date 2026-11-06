import { api } from '@/lib/api'
import type { Cart } from '@/types/api'

export type NovoItem = { nftId: string; editionId: string; quantity: number }

export const getCart = (signal?: AbortSignal) => api.get<Cart>('/cart', { signal }).then((r) => r.data)
export const addCartItem = (item: NovoItem) => api.post<Cart>('/cart/items', item).then((r) => r.data)
export const updateCartItem = ({ itemId, quantity }: { itemId: string; quantity: number }) =>
  api.patch<Cart>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data)
export const removeCartItem = (itemId: string) => api.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data)