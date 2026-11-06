import { HttpResponse } from 'msw'
import { db, type SessionRecord, type UserRecord } from './db'

export function erro(status: number, code: string, message: string, fields?: Record<string, string>) {
  return HttpResponse.json({ code, message, fields }, { status })
}

type Auth =
  | { ok: true; user: UserRecord; session: SessionRecord }
  | { ok: false; error: Response }

export function autenticar(request: Request): Auth {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return { ok: false, error: erro(401, 'UNAUTHORIZED', 'Faça login para continuar.') }
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return { ok: false, error: erro(401, 'UNAUTHORIZED', 'Sessão inválida.') }
  if (session.expiresAt < Date.now()) {
    return { ok: false, error: erro(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.') }
  }
  const user = db.users.find((u) => u.id === session.userId)
  if (!user) return { ok: false, error: erro(401, 'UNAUTHORIZED', 'Sessão inválida.') }
  return { ok: true, user, session }
}

type Dono = { ok: true; key: string } | { ok: false; error: Response }

export function donoDoCarrinho(request: Request): Dono {
  if (request.headers.get('Authorization')) {
    const auth = autenticar(request)
    return auth.ok ? { ok: true, key: auth.user.id } : auth
  }
  const guest = request.headers.get('X-Guest-Id')
  if (!guest) return { ok: false, error: erro(400, 'BAD_REQUEST', 'Carrinho sem identificador.') }
  return { ok: true, key: `guest:${guest}` }
}