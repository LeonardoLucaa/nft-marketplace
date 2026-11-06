import { http, HttpResponse, delay } from 'msw'
import type { LoginInput, RegisterInput } from '@/types/api'
import { db, save, hashPassword, toUser, mergeCarts, type UserRecord, type SessionRecord } from './db'
import { autenticar, erro } from './utils'

const SESSAO_MS = 30 * 60 * 1000
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function criarSessao(userId: string): SessionRecord {
  const s = { token: crypto.randomUUID(), userId, expiresAt: Date.now() + SESSAO_MS }
  db.sessions.push(s)
  return s
}

const respostaSessao = (u: UserRecord, s: SessionRecord) => ({
  user: toUser(u),
  token: s.token,
  expiresAt: new Date(s.expiresAt).toISOString(),
})

function juntarCarrinhoVisitante(request: Request, userId: string) {
  const guest = request.headers.get('X-Guest-Id')
  if (guest) mergeCarts(`guest:${guest}`, userId)
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    await delay()
    const b = (await request.json()) as Partial<RegisterInput>
    const name = b.name?.trim() ?? ''
    const email = b.email?.trim().toLowerCase() ?? ''
    const password = b.password ?? ''

    const fields: Record<string, string> = {}
    if (name.length < 2) fields.name = 'Informe seu nome.'
    if (!EMAIL.test(email)) fields.email = 'Informe um e-mail válido.'
    if (password.length < 8) fields.password = 'A senha precisa ter pelo menos 8 caracteres.'
    if (Object.keys(fields).length) return erro(422, 'VALIDATION', 'Verifique os campos.', fields)

    if (db.users.some((u) => u.email === email)) {
      return erro(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', {
        email: 'Este e-mail já está cadastrado.',
      })
    }

    const user: UserRecord = { id: crypto.randomUUID(), name, email, passwordHash: await hashPassword(password) }
    db.users.push(user)
    const s = criarSessao(user.id)
    juntarCarrinhoVisitante(request, user.id)
    save()
    return HttpResponse.json(respostaSessao(user, s), { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay()
    const b = (await request.json()) as Partial<LoginInput>
    const user = db.users.find((u) => u.email === b.email?.trim().toLowerCase())
    if (!user || user.passwordHash !== (await hashPassword(b.password ?? ''))) {
      return erro(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    const s = criarSessao(user.id)
    juntarCarrinhoVisitante(request, user.id)
    save()
    return HttpResponse.json(respostaSessao(user, s))
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await delay()
    const auth = autenticar(request)
    if (!auth.ok) return auth.error
    return HttpResponse.json(respostaSessao(auth.user, auth.session))
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await delay()
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    db.sessions = db.sessions.filter((s) => s.token !== token)
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]