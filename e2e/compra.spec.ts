import { expect, test } from '@playwright/test'
import { abrir, entrar, semearCarteira } from './helpers'

test.beforeEach(async ({ page }) => {
  await semearCarteira(page)
})

test('visitante compra um NFT: detalhe → carrinho → login → checkout → comprovante', async ({ page }) => {
  await abrir(page, '/nft/nft-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()

  // Adiciona ao carrinho como visitante
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  const itens = page.getByRole('region', { name: 'Itens do carrinho' })
  await expect(itens.getByText('Emerald Ape #042').first()).toBeVisible()

  // Visitante precisa entrar; o carrinho é mesclado no login
  await page.getByRole('link', { name: 'Entrar e finalizar' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await entrar(page)

  // Checkout com a carteira principal pré-selecionada
  await expect(page).toHaveURL(/\/checkout/)
  await expect(page.getByRole('heading', { name: 'Revisar pedido' })).toBeVisible()
  await expect(page.getByRole('main').getByText('Emerald Ape #042').first()).toBeVisible()
  await expect(page.getByRole('radio', { name: /Carteira E2E/ })).toBeChecked()

  // Cupom válido
  await page.getByLabel('Cupom').fill('kurio10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText(/KURIO10 aplicado/)).toBeVisible()

  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  // Comprovante: processando → confirmado (via socket/polling)
  await expect(page).toHaveURL(/\/pedido\//)
  await expect(page.getByRole('heading', { name: 'Compra confirmada!' })).toBeVisible({ timeout: 20_000 })
  const resumo = page.getByRole('region', { name: 'Resumo' })
  await expect(resumo.getByText('Emerald Ape #042').first()).toBeVisible()
  await expect(resumo.getByText('Desconto (KURIO10)')).toBeVisible()

  // Carrinho foi esvaziado após a confirmação
  await page.getByRole('link', { name: /^Carrinho, / }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('cupom inválido mostra erro no campo e não altera o total', async ({ page }) => {
  await abrir(page, '/nft/nft-207')
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await page.getByRole('link', { name: 'Entrar e finalizar' }).click()
  await entrar(page)

  await expect(page.getByRole('heading', { name: 'Revisar pedido' })).toBeVisible()
  await page.getByLabel('Cupom').fill('NAOEXISTE')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.locator('#cupom-erro')).toBeVisible()
  await expect(page.getByLabel('Cupom')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText(/aplicado \(−/)).toHaveCount(0)
})