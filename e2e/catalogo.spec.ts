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