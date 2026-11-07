import { api } from '@/lib/api'
import type { Network, Wallet } from '@/types/api'

export type WalletInput = { label: string; address: string; network: Network }

// Toda mutação devolve a lista completa: o cache nunca fica fora de sincronia com o servidor.
export const fetchWallets = () => api.get<Wallet[]>('/wallets').then((r) => r.data)
export const createWallet = (input: WalletInput) => api.post<Wallet[]>('/wallets', input).then((r) => r.data)
export const updateWallet = ({ id, ...input }: WalletInput & { id: string }) =>
  api.patch<Wallet[]>(`/wallets/${id}`, input).then((r) => r.data)
export const deleteWallet = (id: string) => api.delete<Wallet[]>(`/wallets/${id}`).then((r) => r.data)
export const setPrimaryWallet = (id: string) => api.post<Wallet[]>(`/wallets/${id}/primary`).then((r) => r.data)
export const connectWallet = (id: string) => api.post<Wallet[]>(`/wallets/${id}/connect`).then((r) => r.data)
export const disconnectWallet = (id: string) => api.post<Wallet[]>(`/wallets/${id}/disconnect`).then((r) => r.data)