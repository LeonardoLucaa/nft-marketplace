import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/queries'
import { multiplicarEth, somarEth } from '@/lib/eth'
import type { Cart } from '@/types/api'
import { addCartItem, getCart, removeCartItem, updateCartItem } from './api'

// Cache isolado por dono: visitante e cada usuário têm sua própria entrada
function useCartKey() {
  const { data } = useSession()
  return ['cart', data?.user.id ?? 'guest'] as const
}

export function useCart() {
  const { isPending } = useSession()
  const key = useCartKey()
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getCart(signal),
    enabled: !isPending,
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart) => qc.setQueryData(key, cart),
  })
}

// Atualização otimista com rollback (requisito do desafio)
export function useUpdateCartItem() {
  const qc = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn: updateCartItem,
    onMutate: async ({ itemId, quantity }) => {
      await qc.cancelQueries({ queryKey: key })
      const anterior = qc.getQueryData<Cart>(key)
      if (anterior) {
        const items = anterior.items.map((i) => (i.id === itemId ? { ...i, quantity } : i))
        qc.setQueryData<Cart>(key, {
          items,
          subtotal: somarEth(...items.map((i) => multiplicarEth(i.price, i.quantity))),
          count: items.reduce((t, i) => t + i.quantity, 0),
        })
      }
      return { anterior }
    },
    onError: (_erro, _vars, ctx) => {
      if (ctx?.anterior) qc.setQueryData(key, ctx.anterior)
    },
    onSuccess: (cart) => qc.setQueryData(key, cart),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => qc.setQueryData(key, cart),
  })
}