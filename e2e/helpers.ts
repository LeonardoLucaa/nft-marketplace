import { expect, type Locator, type Page } from '@playwright/test'

export const ANA = { id: 'u1', email: 'ana@kurio.dev', senha: 'Senha@123' }

type MockApi = {
  pausarTicker: () => string
  expirarSessao: () => string
  falharProximoPedido: () => string
}

/** Espera o MSW subir (window.__mock existe) e o React montar. */
export async function aguardarApp(page: Page) {
  await page.waitForFunction(() => 'serviceWorker' in navigator && !!(window as unknown as { __mock?: unknown }).__mock)
}

/** Abre uma rota e pausa o ticker de preços para o teste ser determinístico. */
export async function abrir(page: Page, rota: string) {
  await page.goto(rota)
  await aguardarApp(page)
  await chamarMock(page, 'pausarTicker')
}

export async function chamarMock(page: Page, fn: keyof MockApi) {
  return page.evaluate((nome) => (window as unknown as { __mock: MockApi }).__mock[nome](), fn)
}

/** Dá à Ana uma carteira principal conectada (necessária para pagar). Roda antes do app carregar. */
export async function semearCarteira(page: Page) {
  await page.addInitScript((userId) => {
    const CHAVE = 'kurio-msw-wallets-v1'
    if (localStorage.getItem(CHAVE)) return
    localStorage.setItem(
      CHAVE,
      JSON.stringify({
        [userId]: [
          {
            id: 'w-e2e',
            label: 'Carteira E2E',
            address: '0x1111111111111111111111111111111111111111',
            network: 'Ethereum',
            primary: true,
            connected: true,
            createdAt: '2026-11-01T00:00:00.000Z',
          },
        ],
      }),
    )
  }, ANA.id)
}

/** Preenche e envia o formulário de login (a página /login já deve estar aberta). */
export async function entrar(page: Page, email = ANA.email, senha = ANA.senha) {
  await expect(page.getByRole('heading', { name: 'Entrar', level: 1 })).toBeVisible()
  // exact: o rodapé tem o campo "Seu e-mail" da newsletter
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(senha)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

/** Link do título do card (a imagem do card também é um link com o mesmo nome). */
export function cardNft(escopo: Locator, nome: string) {
  return escopo.getByRole('heading', { level: 3, name: nome, exact: true }).getByRole('link')
}