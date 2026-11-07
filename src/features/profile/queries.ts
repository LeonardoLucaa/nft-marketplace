import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQuery, useSession } from '@/features/auth/queries'
import type { SessionResponse } from '@/types/api'
import { changePassword, fetchProfile, updateProfile } from './api'

// A chave inclui o usuário: trocar de conta nunca reaproveita o perfil do anterior.
export const profileKey = (userId?: string) => ['profile', userId] as const

export function useProfile() {
  const { data: session } = useSession()
  const userId = session?.user.id
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: fetchProfile,
    enabled: !!userId,
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      qc.setQueryData(profileKey(user.id), user)
      // mantém o cabeçalho ("Olá, ...") em sincronia com o perfil salvo
      qc.setQueryData<SessionResponse | null>(sessionQuery.queryKey, (s) => (s ? { ...s, user } : s))
    },
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}