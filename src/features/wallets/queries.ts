import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/queries'
import type { Wallet } from '@/types/api'
import {
  connectWallet,
  createWallet,
  deleteWallet,
  disconnectWallet,
  fetchWallets,
  setPrimaryWallet,
  updateWallet,
} from './api'

// A chave inclui o usuário: trocar de conta nunca reaproveita as carteiras do anterior.
export const walletsKey = (userId?: string) => ['wallets', userId] as const

export function useWallets() {
  const { data: session } = useSession()
  const userId = session?.user.id
  return useQuery({
    queryKey: walletsKey(userId),
    queryFn: fetchWallets,
    enabled: !!userId,
    staleTime: 30_000,
  })
}

function useWalletMutation<V>(fn: (v: V) => Promise<Wallet[]>) {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id
  return useMutation({
    mutationFn: fn,
    onSuccess: (lista) => qc.setQueryData(walletsKey(userId), lista),
  })
}

export const useCreateWallet = () => useWalletMutation(createWallet)
export const useUpdateWallet = () => useWalletMutation(updateWallet)
export const useDeleteWallet = () => useWalletMutation(deleteWallet)
export const useConnectWallet = () => useWalletMutation(connectWallet)
export const useDisconnectWallet = () => useWalletMutation(disconnectWallet)

// Update otimista com rollback: a carteira principal muda na tela na hora;
// se o servidor recusar, volta ao estado anterior.
export function useSetPrimaryWallet() {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const key = walletsKey(session?.user.id)
  return useMutation({
    mutationFn: setPrimaryWallet,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: key })
      const anterior = qc.getQueryData<Wallet[]>(key)
      qc.setQueryData<Wallet[]>(key, (l) => l?.map((w) => ({ ...w, primary: w.id === id })))
      return { anterior }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.anterior) qc.setQueryData(key, ctx.anterior)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  })
}