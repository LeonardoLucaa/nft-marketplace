import { api } from '@/lib/api'
import type { Nft, NftListQuery, NftListResponse } from '@/types/api'

export async function listNfts(params: NftListQuery, signal?: AbortSignal) {
  const { data } = await api.get<NftListResponse>('/nfts', { params, signal })
  return data
}

export async function getNft(id: string, signal?: AbortSignal) {
  const { data } = await api.get<Nft>(`/nfts/${id}`, { signal })
  return data
}