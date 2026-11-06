import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import {
  autenticarCliente,
  iniciarTicker,
  registrarCliente,
  removerCliente,
  usuarioPorToken,
} from './realtime'

// Sem curinga no final: o Socket.IO conecta em /socket.io/?EIO=4&transport=websocket
const api = ws.link('*')

export const socketHandlers = [
  api.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const id = connection.client.id

    registrarCliente(id, io)
    iniciarTicker()

    io.client.on('session:auth', (_event, token) => {
      const userId = usuarioPorToken(token)
      autenticarCliente(id, userId)
      io.client.emit('session:ready', { authenticated: userId !== null })
    })

    connection.client.addEventListener('close', () => removerCliente(id))
  }),
]