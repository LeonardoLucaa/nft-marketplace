import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createFileRoute, Link, redirect, useNavigate, type SearchSchemaInput } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { getToken } from '@/lib/session'
import { codigoErro, erroDeCampo, mensagemErro } from '@/features/checkout/api'
import { quoteOptions, useCriarPedido, useQuote } from '@/features/checkout/queries'
import { useWallets } from '@/features/wallets/queries'
import type { Quote } from '@/types/api'

type CheckoutSearch = { cupom?: string }

export const Route = createFileRoute('/checkout')({
  // Entrada opcional => <Link to="/checkout"> continua sem exigir search
  validateSearch: (input: CheckoutSearch & SearchSchemaInput): CheckoutSearch => {
    const raw = (input as Record<string, unknown>).cupom
    return { cupom: typeof raw === 'string' && raw.trim() ? raw.trim().toUpperCase() : undefined }
  },
  beforeLoad: ({ location }) => {
    if (!getToken()) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: CheckoutPage,
})

function Linha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`flex justify-between ${destaque ? 'text-lg font-bold text-[#D28A4C]' : 'text-[#CFB28C]'}`}>
      <dt>{label}</dt>
      <dd>{valor} ETH</dd>
    </div>
  )
}

function CheckoutPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const search = Route.useSearch()
  const [cupom, setCupom] = useState<string | null>(search.cupom ?? null)
  const [cupomDigitado, setCupomDigitado] = useState(search.cupom ?? '')
  const [erroCupom, setErroCupom] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)
  const [avisoPreco, setAvisoPreco] = useState<{ de: string; para: string } | null>(null)

  const quote = useQuote(cupom)
  const criar = useCriarPedido()

  // Carteira de pagamento: só as conectadas podem pagar; a principal vem pré-selecionada.
  const carteiras = useWallets()
  const [carteiraEscolhida, setCarteiraEscolhida] = useState<string | null>(null)
  const conectadas = (carteiras.data ?? []).filter((w) => w.connected)
  const carteira =
    conectadas.find((w) => w.id === carteiraEscolhida) ?? conectadas.find((w) => w.primary) ?? conectadas[0]

  // Uma chave por cotação: retries/duplo clique reaproveitam; cotação nova gera chave nova.
  const quoteId = quote.data?.id
  const idempotencyKey = useMemo(() => (quoteId ? crypto.randomUUID() : ''), [quoteId])

  // Cupom vindo da URL e inválido: descarta e mostra o erro no campo
  useEffect(() => {
    if (!quote.isError || !cupom) return
    const erro = erroDeCampo(quote.error, 'couponCode')
    if (erro) {
      setErroCupom(erro)
      setCupom(null)
    }
  }, [quote.isError, quote.error, cupom])

  // Detecta cotação nova com total diferente (preço mudou durante o checkout)
  const anterior = useRef<Quote | null>(null)
  useEffect(() => {
    const atual = quote.data
    if (!atual) return
    const prev = anterior.current
    if (prev && prev.id !== atual.id && prev.coupon?.code === atual.coupon?.code && prev.total !== atual.total) {
      setAvisoPreco({ de: prev.total, para: atual.total })
    }
    anterior.current = atual
  }, [quote.data])

  // Não deixa cotação em cache ao sair (evita vazar entre usuários no mesmo navegador)
  useEffect(() => () => qc.removeQueries({ queryKey: ['checkout'] }), [qc])

  async function aplicarCupom(e: FormEvent) {
    e.preventDefault()
    const code = cupomDigitado.trim().toUpperCase()
    if (!code) return
    setAplicando(true)
    setErroCupom(null)
    try {
      await qc.fetchQuery(quoteOptions(code))
      setCupom(code)
    } catch (err) {
      setErroCupom(erroDeCampo(err, 'couponCode') ?? mensagemErro(err, 'Não foi possível aplicar o cupom.'))
    } finally {
      setAplicando(false)
    }
  }

  function finalizar() {
    if (!quote.data || !carteira || criar.isPending || avisoPreco) return
    criar.mutate(
      { quoteId: quote.data.id, idempotencyKey, walletId: carteira.id },
      {
        onSuccess: (order) => navigate({ to: '/pedido/$id', params: { id: order.id }, replace: true }),
        onError: (err) => {
          const c = codigoErro(err)
          if (c === 'QUOTE_EXPIRED' || c === 'QUOTE_OUTDATED' || c === 'QUOTE_NOT_FOUND') void quote.refetch()
          if (c?.startsWith('WALLET_')) void carteiras.refetch()
        },
      },
    )
  }

  if (quote.isPending || (quote.isError && cupom && erroDeCampo(quote.error, 'couponCode'))) {
    return <main className="mx-auto max-w-3xl p-6"><div className="skeleton h-64 rounded-xl" aria-busy="true" /></main>
  }

  if (quote.isError) {
    const c = codigoErro(quote.error)
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p role="alert" className="text-[#CFB28C]">{mensagemErro(quote.error)}</p>
        {c === 'CART_EMPTY' || c === 'OUT_OF_STOCK' || c === 'NFT_UNAVAILABLE' ? (
          <Link to="/carrinho" className="text-[#D28A4C] underline">Voltar ao carrinho</Link>
        ) : (
          <button onClick={() => quote.refetch()} className="rounded-md bg-[#D28A4C] px-4 py-2 font-semibold text-[#140D0A]">
            Tentar novamente
          </button>
        )}
      </main>
    )
  }

  const q = quote.data
  const bloqueado = criar.isPending || quote.isFetching || !!avisoPreco || !carteira

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-[1fr_360px]">
      <section aria-labelledby="itens">
        <h1 id="itens" className="mb-4 text-2xl font-bold">Revisar pedido</h1>

        <div role="status" aria-live="polite" className="mb-4">
          {avisoPreco && (
            <div className="space-y-2 rounded-lg border border-[#D28A4C] bg-[#241612] p-3 text-sm">
              <p className="font-semibold text-[#D28A4C]">Os preços mudaram durante o checkout.</p>
              <p className="text-[#CFB28C]">
                O total passou de {avisoPreco.de} ETH para {avisoPreco.para} ETH. Revise os valores antes de confirmar.
              </p>
              <button
                type="button"
                onClick={() => setAvisoPreco(null)}
                className="rounded-md border border-[#D28A4C] px-3 py-1 text-[#D28A4C]"
              >
                Revisei e quero continuar
              </button>
            </div>
          )}
        </div>

        <ul className="space-y-3">
          {q.lines.map((l) => (
            <li key={l.nftId} className="flex items-center gap-4 rounded-xl bg-[#241612] p-3">
              <img src={l.image} alt="" className="size-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm text-[#CFB28C]">{l.network} · {l.quantity} × {l.unitPrice} ETH</p>
              </div>
              <p className="font-semibold text-[#D28A4C]">{l.lineTotal} ETH</p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit space-y-5 rounded-xl bg-[#241612] p-5">
        <form onSubmit={aplicarCupom} className="space-y-2" noValidate>
          <label htmlFor="cupom" className="text-sm text-[#CFB28C]">Cupom</label>
          <div className="flex gap-2">
            <input
              id="cupom"
              value={cupomDigitado}
              onChange={(e) => setCupomDigitado(e.target.value)}
              aria-invalid={!!erroCupom}
              aria-describedby={erroCupom ? 'cupom-erro' : undefined}
              className="flex-1 rounded-md border border-[#CFB28C]/30 bg-[#140D0A] px-3 py-2 uppercase"
            />
            <button disabled={aplicando} className="rounded-md border border-[#D28A4C] px-3 text-[#D28A4C] disabled:opacity-50">
              {aplicando ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
          {erroCupom && <p id="cupom-erro" role="alert" className="text-sm text-red-400">{erroCupom}</p>}
          {q.coupon && (
            <p className="text-sm text-[#CFB28C]">
              {q.coupon.code} aplicado (−{q.coupon.percentOff}%){' '}
              <button type="button" onClick={() => { setCupom(null); setCupomDigitado('') }} className="underline">
                remover
              </button>
            </p>
          )}
        </form>

        <fieldset className="space-y-2">
          <legend className="text-sm text-[#CFB28C]">Carteira de pagamento</legend>
          {carteiras.isPending && <div className="skeleton h-12 rounded-md" aria-busy="true" />}
          {carteiras.isError && (
            <p role="alert" className="text-sm text-red-400">
              Não foi possível carregar suas carteiras.{' '}
              <button type="button" onClick={() => void carteiras.refetch()} className="underline">
                Tentar novamente
              </button>
            </p>
          )}
          {carteiras.data?.map((w) => (
            <label
              key={w.id}
              className={`flex items-center gap-3 rounded-md border p-2 text-sm ${
                w.connected ? 'cursor-pointer border-[#CFB28C]/30' : 'border-[#CFB28C]/10 opacity-60'
              } ${carteira?.id === w.id ? 'border-[#D28A4C]' : ''}`}
            >
              <input
                type="radio"
                name="carteira"
                value={w.id}
                checked={carteira?.id === w.id}
                disabled={!w.connected}
                onChange={() => setCarteiraEscolhida(w.id)}
              />
              <span className="flex-1">
                {w.label} · {w.network}
                {w.primary ? ' · principal' : ''}
                <span className="block font-mono text-xs text-[#CFB28C]">
                  {w.address.slice(0, 6)}…{w.address.slice(-4)}
                  {w.connected ? '' : ' (desconectada)'}
                </span>
              </span>
            </label>
          ))}
          {carteiras.data && !carteira && (
            <p role="alert" className="text-sm text-[#CFB28C]">
              {carteiras.data.length === 0
                ? 'Cadastre uma carteira para pagar.'
                : 'Conecte uma carteira para pagar.'}{' '}
              <Link to="/carteiras" className="text-[#D28A4C] underline">
                Gerenciar carteiras
              </Link>
            </p>
          )}
        </fieldset>

        <dl className="space-y-2" aria-live="polite">
          <Linha label="Subtotal" valor={q.subtotal} />
          {q.coupon && <Linha label="Desconto" valor={`−${q.discount}`} />}
          <Linha label="Taxa de rede" valor={q.networkFee} />
          <Linha label="Total" valor={q.total} destaque />
        </dl>

        {criar.isError && (
          <p role="alert" className="text-sm text-red-400">{mensagemErro(criar.error)}</p>
        )}

        <button
          onClick={finalizar}
          disabled={bloqueado}
          className="w-full rounded-md bg-[#D28A4C] py-3 font-semibold text-[#140D0A] disabled:opacity-50"
        >
          {criar.isPending ? 'Enviando pedido…' : avisoPreco ? 'Revise os novos valores' : 'Confirmar compra'}
        </button>
      </aside>
    </main>
  )
}