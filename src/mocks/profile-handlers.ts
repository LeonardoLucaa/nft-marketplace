import { http, HttpResponse, delay } from 'msw'
import type { ChangePasswordInput, UpdateProfileInput } from '@/features/profile/api'
import { db, save, hashPassword, toUser } from './db'
import { autenticar, erro } from './utils'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AVATAR = /^data:image\/(png|jpeg|webp);base64,/
const AVATAR_MAX = 400_000 // caracteres do data URL

export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    await delay()
    const auth = autenticar(request)
    if (!auth.ok) return auth.error
    return HttpResponse.json(toUser(auth.user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    await delay()
    const auth = autenticar(request)
    if (!auth.ok) return auth.error

    const b = (await request.json()) as Partial<UpdateProfileInput>
    const name = b.name?.trim() ?? ''
    const email = b.email?.trim().toLowerCase() ?? ''

    const fields: Record<string, string> = {}
    if (name.length < 2) fields.name = 'Informe seu nome.'
    if (!EMAIL.test(email)) fields.email = 'Informe um e-mail válido.'
    if (typeof b.avatarUrl === 'string') {
      if (!AVATAR.test(b.avatarUrl)) fields.avatarUrl = 'Envie uma imagem PNG, JPG ou WebP.'
      else if (b.avatarUrl.length > AVATAR_MAX) fields.avatarUrl = 'A imagem é grande demais.'
    }
    if (Object.keys(fields).length) return erro(422, 'VALIDATION', 'Verifique os campos.', fields)

    if (db.users.some((u) => u.id !== auth.user.id && u.email === email)) {
      return erro(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', {
        email: 'Este e-mail já está cadastrado.',
      })
    }

    auth.user.name = name
    auth.user.email = email
    if (b.avatarUrl === null) auth.user.avatarUrl = undefined
    else if (typeof b.avatarUrl === 'string') auth.user.avatarUrl = b.avatarUrl
    save()
    return HttpResponse.json(toUser(auth.user))
  }),

  http.post('/api/profile/password', async ({ request }) => {
    await delay()
    const auth = autenticar(request)
    if (!auth.ok) return auth.error

    const b = (await request.json()) as Partial<ChangePasswordInput>
    const atual = b.currentPassword ?? ''
    const nova = b.newPassword ?? ''

    const fields: Record<string, string> = {}
    if (!atual) fields.currentPassword = 'Informe a senha atual.'
    if (nova.length < 8) fields.newPassword = 'A nova senha precisa ter pelo menos 8 caracteres.'
    if (Object.keys(fields).length) return erro(422, 'VALIDATION', 'Verifique os campos.', fields)

    // 422 (e não 401) para não ser confundido com sessão expirada pelo interceptor do Axios
    if (auth.user.passwordHash !== (await hashPassword(atual))) {
      return erro(422, 'INVALID_PASSWORD', 'Senha atual incorreta.', {
        currentPassword: 'Senha atual incorreta.',
      })
    }
    if (nova === atual) {
      return erro(422, 'VALIDATION', 'Verifique os campos.', {
        newPassword: 'A nova senha deve ser diferente da atual.',
      })
    }

    auth.user.passwordHash = await hashPassword(nova)
    // encerra as outras sessões do usuário; mantém a atual
    db.sessions = db.sessions.filter((s) => s.userId !== auth.user.id || s.token === auth.session.token)
    save()
    return new HttpResponse(null, { status: 204 })
  }),
]