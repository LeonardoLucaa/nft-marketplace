import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/api'

export const SOCKET_URL = 'wss://api.nft.local'

// autoConnect: false -> só conecta depois que o MSW já está ativo (useRealtime)
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: false,
  reconnectionDelayMax: 5_000,
})