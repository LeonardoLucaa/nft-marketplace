import { expect, test } from '@playwright/test'
import { abrir, cardNft } from './helpers'

test('filtra o catálogo por coleção e abre o detalhe do NFT', async ({ page, isMobile }) => {
  await abrir(page, '/')
  const catalogo = page.locator('#catalogo')
  await expect(cardNft(catalogo, 'Emerald Ape #042')).toBeVisible()

  // No mobile os filtros ficam numa gaveta; no desktop, na barra lateral
  if (isMobile) {
    await page.getByRole('button', { name: /^Filtros/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: /^Música/ }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  } else {
    await page.getByRole('complementary', { name: 'Filtros do catálogo' }).getByRole('button', { name: /^Música/ }).click()
  }

  // Filtro vai para a URL e a lista mostra só a coleção Música
  await expect(page).toHaveURL(/category=M%C3%BAsica/)
  await expect(cardNft(catalogo, 'Golden Beat #207')).toBeVisible()
  await expect(cardNft(catalogo, 'Golden Frequency #071')).toBeVisible()
  await expect(cardNft(catalogo, 'Emerald Ape #042')).toHaveCount(0)

  // Abre o detalhe
  await cardNft(catalogo, 'Golden Beat #207').click()
  await expect(page).toHaveURL(/\/nft\/nft-207$/)
  await expect(page.getByRole('heading', { name: 'Golden Beat #207', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeEnabled()
})

test('filtro aplicado sobrevive ao recarregar a página', async ({ page }) => {
  await abrir(page, '/?category=M%C3%BAsica')
  const catalogo = page.locator('#catalogo')
  await expect(cardNft(catalogo, 'Golden Beat #207')).toBeVisible()
  await expect(cardNft(catalogo, 'Emerald Ape #042')).toHaveCount(0)
})

test('paginação navega entre as páginas do catálogo', async ({ page }) => {
  await abrir(page, '/')
  const catalogo = page.locator('#catalogo')
  const paginacao = page.getByRole('navigation', { name: 'Paginação' })

  // 36 NFTs, 9 por página = 4 páginas; na primeira não há "Página anterior"
  await expect(paginacao.getByRole('button', { name: 'Página 4', exact: true })).toBeVisible()
  await expect(paginacao.getByRole('button', { name: 'Página 1', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(paginacao.getByRole('button', { name: 'Página anterior' })).toHaveCount(0)
  await expect(cardNft(catalogo, 'Emerald Ape #042')).toBeVisible()

  await paginacao.getByRole('button', { name: 'Página 2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(cardNft(catalogo, 'Jade Sentinel #401')).toBeVisible()
  await expect(cardNft(catalogo, 'Emerald Ape #042')).toHaveCount(0)
  await expect(paginacao.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute('aria-current', 'page')

  // Na última página, some a seta "Próxima página"
  await paginacao.getByRole('button', { name: 'Página 4', exact: true }).click()
  await expect(page).toHaveURL(/page=4/)
  await expect(cardNft(catalogo, 'Linen Earl #427')).toBeVisible()
  await expect(paginacao.getByRole('button', { name: 'Próxima página' })).toHaveCount(0)
})