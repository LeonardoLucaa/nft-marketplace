import { api } from '@/lib/api'
import type { User } from '@/types/api'

// avatarUrl: string (data URL) define a foto; null remove; undefined mantém.
export type UpdateProfileInput = { name: string; email: string; avatarUrl?: string | null }
export type ChangePasswordInput = { currentPassword: string; newPassword: string }

export const fetchProfile = () => api.get<User>('/profile').then((r) => r.data)
export const updateProfile = (input: UpdateProfileInput) =>
  api.patch<User>('/profile', input).then((r) => r.data)
export const changePassword = (input: ChangePasswordInput) =>
  api.post('/profile/password', input).then(() => undefined)