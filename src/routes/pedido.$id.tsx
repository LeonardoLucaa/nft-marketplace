import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getToken } from '@/lib/session'
import { mensagemErro } from '@/features/checkout/api'
import { useOrder } from '@/features/checkout/queries'
import type { Order } from '@/types/api'

export const Route = createFileRoute('/pedido/$id')({
  beforeLoad: ({ location }) => {
    if (!getToken()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: PedidoPage,
})

// A rota "/" exige search params tipados. Passamos {} e o validateSearch da home
// aplica os valores padrão. (Se corrigir o index.tsx com SearchSchemaInput, pode remover o `as never`.)
const SEARCH_HOME = {} as never

function PedidoPage() {
  const { id } = Route.useParams()
  const order = useOrder(id)

  if (order.isPending) {
    return (
      <main className="mx-auto max-w-xl space-y-4 p-6" aria-busy="true">
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </main>
    )
  }

  if (order.isError) {
    return (
      <main className="mx-auto max-w-xl space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold">Pedido indisponível</h1>
        <p role="alert" className="text-[#CFB28C]">
          {mensagemErro(order.error, 'Pedido não encontrado.')}
        </p>
        <Link to="/" search={SEARCH_HOME} className="inline-block text-[#D28A4C] underline">
          Voltar ao catálogo
        </Link>
      </main>
    )
  }

  const o = order.data

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <StatusPedido order={o} />
      <ResumoPedido order={o} />
    </main>
  )
}

function StatusPedido({ order: o }: { order: Order }) {
  return (
    <section aria-live="polite" className="rounded-xl bg-[#241612] p-6 text-center">
      {o.status === 'processing' && (
        <>
          <div
            aria-hidden="true"
            className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#D28A4C] border-t-transparent motion-reduce:animate-none"
          />
          <h1 className="text-xl font-bold">Processando seu pedido…</h1>
          <p className="text-[#CFB28C]">Aguardando confirmação da rede.</p>
        </>
      )}

      {o.status === 'confirmed' && (
        <>
          <h1 className="text-xl font-bold text-[#D28A4C]">Compra confirmada!</h1>
          <p className="text-[#CFB28C]">Pedido {o.id}</p>
          <Link to="/" search={SEARCH_HOME} className="mt-4 inline-block rounded-md bg-[#D28A4C] px-4 py-2 font-semibold text-[#140D0A]">
            Continuar explorando
          </Link>
        </>
      )}

      {o.status === 'failed' && (
        <>
          <h1 className="text-xl font-bold text-red-400">Pedido não concluído</h1>
          <p className="text-[#CFB28C]">{o.failureReason ?? 'Não foi possível concluir o pagamento.'}</p>
          <Link to="/carrinho" className="mt-4 inline-block text-[#D28A4C] underline">
            Voltar ao carrinho
          </Link>
        </>
      )}
    </section>
  )
}

function ResumoPedido({ order: o }: { order: Order }) {
  const data = new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <section aria-labelledby="resumo" className="space-y-3 rounded-xl bg-[#241612] p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="resumo" className="font-semibold">Resumo</h2>
        <span className="text-sm text-[#CFB28C]">{data}</span>
      </div>

      <ul className="space-y-3">
        {o.lines.map((l) => (
          <li key={l.nftId} className="flex items-center gap-3">
            <img src={l.image} alt="" className="size-12 rounded-md object-cover" />
            <div className="flex-1">
              <p className="text-sm font-medium">{l.name}</p>
              <p className="text-xs text-[#CFB28C]">
                {l.network} · {l.quantity} × {l.unitPrice} ETH
              </p>
            </div>
            <span className="text-sm text-[#D28A4C]">{l.lineTotal} ETH</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-1 border-t border-[#CFB28C]/20 pt-3 text-sm text-[#CFB28C]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{o.subtotal} ETH</dd>
        </div>
        {o.coupon && (
          <div className="flex justify-between">
            <dt>Desconto ({o.coupon.code})</dt>
            <dd>−{o.discount} ETH</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Taxa de rede</dt>
          <dd>{o.networkFee} ETH</dd>
        </div>
        <div className="flex justify-between pt-2 text-base font-bold text-[#D28A4C]">
          <dt>Total</dt>
          <dd>{o.total} ETH</dd>
        </div>
      </dl>
    </section>
  )
}