import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { clearToken, getToken, resetGuestId, setToken } from '@/lib/session'
import type { SessionResponse } from '@/types/api'
import { fetchSession, login, logout, register } from './api'

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: async (): Promise<SessionResponse | null> => {
    if (!getToken()) return null
    try {
      return await fetchSession()
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 401) return null
      throw e
    }
  },
  staleTime: 5 * 60_000,
  retry: false,
})

export const useSession = () => useQuery(sessionQuery)

function useAoAutenticar() {
  const qc = useQueryClient()
  return (s: SessionResponse) => {
    setToken(s.token)
    resetGuestId() // o carrinho do visitante já foi juntado pelo servidor
    qc.removeQueries({ queryKey: ['cart'] })
    qc.setQueryData(sessionQuery.queryKey, s)
  }
}

export function useLogin() {
  const aoAutenticar = useAoAutenticar()
  return useMutation({ mutationFn: login, onSuccess: aoAutenticar })
}

export function useRegister() {
  const aoAutenticar = useAoAutenticar()
  return useMutation({ mutationFn: register, onSuccess: aoAutenticar })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearToken()
      resetGuestId()
      qc.clear() // remove dados privados do usuário anterior
      qc.setQueryData(sessionQuery.queryKey, null)
    },
  })
}