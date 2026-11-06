import axios, { isAxiosError } from 'axios'
import type { ApiError } from '@/types/api'
import { clearToken, getGuestId, getToken } from './session'

export const api = axios.create({ baseURL: '/api', timeout: 10_000 })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  else config.headers['X-Guest-Id'] = getGuestId()
  return config
})

// 401 com token salvo = sessão expirou/invalidou durante a navegação
api.interceptors.response.use(undefined, (error) => {
  if (isAxiosError(error) && error.response?.status === 401 && getToken()) {
    clearToken()
    window.dispatchEvent(new CustomEvent('session:expired'))
  }
  return Promise.reject(error)
})

export function mensagemDeErro(e: unknown, padrao = 'Algo deu errado. Tente novamente.') {
  if (isAxiosError<ApiError>(e)) {
    if (!e.response) return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
    return e.response.data?.message ?? padrao
  }
  return padrao
}

export function errosDosCampos(e: unknown) {
  return isAxiosError<ApiError>(e) ? e.response?.data?.fields ?? {} : {}
}