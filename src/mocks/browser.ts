import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { socketHandlers } from './socket'
import { authHandlers } from './auth-handlers'
import { profileHandlers } from './profile-handlers'
import { cartHandlers } from './cart-handlers'
import { controlesPedido, orderHandlers, resetPedidos } from './order-handlers'
import { alterarPreco, pausarTicker } from './realtime'
import { db, resetDb, save } from './db'

export const worker = setupWorker(
  ...handlers,
  ...authHandlers,
  ...profileHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...socketHandlers,
)

// Atalhos para testar no console (e no Playwright)
;(window as unknown as { __mock: unknown }).__mock = {
  reset: () => {
    resetPedidos()
    resetDb()
    location.reload()
  },
  expirarSessao: () => {
    db.sessions.forEach((s) => (s.expiresAt = 0))
    save()
    return 'sessão expirada: faça qualquer requisição (ex.: abra o carrinho)'
  },
  falharProximoPedido: () => {
    controlesPedido.falharProximo = true
    return 'o próximo pedido vai falhar'
  },
  alterarPreco: (id: string, price: string) => alterarPreco(id, price),
  pausarTicker: () => pausarTicker(true),
  retomarTicker: () => pausarTicker(false),
}
