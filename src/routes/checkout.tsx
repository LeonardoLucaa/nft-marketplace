import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { getToken } from '@/lib/session'
import { codigoErro, erroDeCampo, mensagemErro } from '@/features/checkout/api'
import { quoteOptions, useCriarPedido, useQuote } from '@/features/checkout/queries'

export const Route = createFileRoute('/checkout')({
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
  const [cupom, setCupom] = useState<string | null>(null)
  const [cupomDigitado, setCupomDigitado] = useState('')
  const [erroCupom, setErroCupom] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)

  const quote = useQuote(cupom)
  const criar = useCriarPedido()

  // Uma chave por cotação: retries/duplo clique reaproveitam; cotação nova gera chave nova.
  const quoteId = quote.data?.id
  const idempotencyKey = useMemo(() => (quoteId ? crypto.randomUUID() : ''), [quoteId])

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
    if (!quote.data || criar.isPending) return
    criar.mutate(
      { quoteId: quote.data.id, idempotencyKey },
      {
        onSuccess: (order) => navigate({ to: '/pedido/$id', params: { id: order.id }, replace: true }),
        onError: (err) => {
          const c = codigoErro(err)
          if (c === 'QUOTE_EXPIRED' || c === 'QUOTE_OUTDATED' || c === 'QUOTE_NOT_FOUND') void quote.refetch()
        },
      },
    )
  }

  if (quote.isPending) {
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

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-[1fr_360px]">
      <section aria-labelledby="itens">
        <h1 id="itens" className="mb-4 text-2xl font-bold">Revisar pedido</h1>
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
          disabled={criar.isPending || quote.isFetching}
          className="w-full rounded-md bg-[#D28A4C] py-3 font-semibold text-[#140D0A] disabled:opacity-50"
        >
          {criar.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
        </button>
      </aside>
    </main>
  )
}