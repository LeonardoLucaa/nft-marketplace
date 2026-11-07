import axios, { AxiosError, isAxiosError } from 'axios'
import type { ApiError } from '@/types/api'
import { clearToken, getGuestId, getToken } from './session'

export const api = axios.create({ baseURL: '/api', timeout: 10_000 })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  else config.headers['X-Guest-Id'] = getGuestId()
  return config
})

// Se o service worker do MSW for desligado pelo navegador (inatividade),
// a requisição cai no servidor do Vite, que devolve o index.html com 200.
// Tratei isso como falha de rede para a UI mostrar erro + "Tentar novamente".
function respostaNaoEhJson(response: { headers: unknown; data: unknown; status: number }) {
  if (response.status === 204) return false
  const headers = response.headers as Record<string, string | undefined> | undefined
  const tipo = String(headers?.['content-type'] ?? '')
  return !tipo.includes('application/json') || typeof response.data !== 'object' || response.data === null
}

api.interceptors.response.use(
  (response) => {
    if (respostaNaoEhJson(response)) {
      return Promise.reject(
        new AxiosError(
          'Resposta inválida da API (mocks indisponíveis).',
          'ERR_BAD_RESPONSE',
          response.config,
          response.request,
          undefined,
        ),
      )
    }
    return response
  },
  (error) => {
    // 401 com token salvo = sessão expirou/invalidou durante a navegação
    if (isAxiosError(error) && error.response?.status === 401 && getToken()) {
      clearToken()
      window.dispatchEvent(new CustomEvent('session:expired'))
    }
    return Promise.reject(error)
  },
)

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