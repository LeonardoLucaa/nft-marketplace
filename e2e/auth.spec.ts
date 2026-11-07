import { expect, test } from '@playwright/test'
import { abrir, chamarMock, entrar } from './helpers'

test('rota protegida redireciona ao login e volta para ela depois de entrar', async ({ page }) => {
  await abrir(page, '/perfil')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)

  await entrar(page)

  await expect(page).toHaveURL(/\/perfil$/)
  await expect(page.getByRole('heading', { name: 'Meu perfil', level: 1 })).toBeVisible()
})

test('login com senha errada mostra erro e continua na página', async ({ page }) => {
  await abrir(page, '/login')
  await entrar(page, 'ana@kurio.dev', 'senha-errada')
  await expect(page.locator('form').getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('sessão expirada leva ao login com aviso e retorna à rota de origem', async ({ page }) => {
  await abrir(page, '/login?redirect=%2Fcarteiras')
  await entrar(page)
  await expect(page.getByRole('heading', { name: 'Minhas carteiras', level: 1 })).toBeVisible()

  // Simula expiração no "servidor" (fica salvo no localStorage) e recarrega
  // em outra rota: a primeira requisição autenticada recebe 401
  await chamarMock(page, 'expirarSessao')
  await page.goto('/carrinho')

  await expect(page).toHaveURL(/\/login\?.*expired=true/)
  await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()

  await entrar(page)
  await expect(page).toHaveURL(/\/carrinho/)
})