import { api } from '@/lib/api'
import type { LoginInput, RegisterInput, SessionResponse } from '@/types/api'

export const login = (input: LoginInput) => api.post<SessionResponse>('/auth/login', input).then((r) => r.data)
export const register = (input: RegisterInput) => api.post<SessionResponse>('/auth/register', input).then((r) => r.data)
export const fetchSession = () => api.get<SessionResponse>('/auth/session').then((r) => r.data)
export const logout = () => api.post('/auth/logout')