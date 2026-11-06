const DECIMAIS = 18

export function toWei(valor: string): bigint {
  const [inteiro, fracao = ''] = valor.split('.')
  return BigInt(inteiro + fracao.padEnd(DECIMAIS, '0').slice(0, DECIMAIS))
}

export function fromWei(wei: bigint, casas = 4): string {
  const s = wei.toString().padStart(DECIMAIS + 1, '0')
  const inteiro = s.slice(0, -DECIMAIS)
  const fracao = s.slice(-DECIMAIS).slice(0, casas).replace(/0+$/, '')
  return fracao ? `${inteiro}.${fracao}` : inteiro
}

/**
 * Formato de exibição: no mínimo `minCasas` decimais ("2.1" -> "2.10") e
 * no máximo `maxCasas` ("0.0002" continua "0.0002"). Sem passar por Number.
 */
export function formatEth(valor: string, minCasas = 2, maxCasas = 4): string {
  const curto = fromWei(toWei(valor), maxCasas)
  const [inteiro, fracao = ''] = curto.split('.')
  return `${inteiro}.${fracao.padEnd(minCasas, '0')}`
}

export const multiplicarEth = (preco: string, qtd: number) => fromWei(toWei(preco) * BigInt(qtd))
export const somarEth = (...valores: string[]) => fromWei(valores.reduce((t, v) => t + toWei(v), 0n))