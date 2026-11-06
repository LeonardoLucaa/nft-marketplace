import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getNft, listNfts } from './api'
import type { NftListQuery } from '@/types/api'

export function useNfts(params: NftListQuery) {
  return useQuery({
    queryKey: ['nfts', 'list', params],
    queryFn: ({ signal }) => listNfts(params, signal),
    // mantém a lista anterior na tela enquanto carrega a próxima página/filtro
    placeholderData: keepPreviousData,
  })
}

export function useNft(id: string) {
  return useQuery({
    queryKey: ['nfts', 'detail', id],
    queryFn: ({ signal }) => getNft(id, signal),
    retry: (falhas, erro) => !(isAxiosError(erro) && erro.response?.status === 404) && falhas < 2,
  })
}