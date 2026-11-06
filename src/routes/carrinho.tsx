import { createFileRoute, Link } from '@tanstack/react-router'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/features/cart/queries'
import { mensagemDeErro } from '@/lib/api'
import { multiplicarEth } from '@/lib/eth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/carrinho')({ component: Carrinho })

function Carrinho() {
  const { data: cart, isPending, isError, refetch } = useCart()
  const atualizar = useUpdateCartItem()
  const remover = useRemoveCartItem()

  if (isPending) return <CarrinhoSkeleton />

  if (isError) {
    return (
      <section role="alert" className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p>Não foi possível carregar o carrinho.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </section>
    )
  }

  if (cart.items.length === 0) {
    return (
      <section className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <Button asChild>
          <Link to="/" search={{ sort: 'recent', page: 1 }}>Explorar NFTs</Link>
        </Button>
      </section>
    )
  }

  const erroMutation = atualizar.error ?? remover.error

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px]">
      <section aria-labelledby="titulo-carrinho">
        <h1 id="titulo-carrinho" className="mb-4 text-2xl font-bold">Carrinho</h1>

        <p role="status" aria-live="polite" className="mb-2 min-h-5 text-sm text-destructive">
          {erroMutation ? mensagemDeErro(erroMutation) : ''}
        </p>

        <ul className="space-y-3">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-3">
              <img src={item.image} alt="" width={96} height={96} className="size-24 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Edição {item.editionLabel} · {item.price} ETH cada
                    </p>
                  </div>
                  <p className="font-semibold text-primary">{multiplicarEth(item.price, item.quantity)} ETH</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" aria-label={`Diminuir quantidade de ${item.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() => atualizar.mutate({ itemId: item.id, quantity: item.quantity - 1 })}>−</Button>
                  <span className="w-8 text-center" aria-label={`Quantidade: ${item.quantity}`}>{item.quantity}</span>
                  <Button variant="outline" size="sm" aria-label={`Aumentar quantidade de ${item.name}`}
                    disabled={item.quantity >= item.available}
                    onClick={() => atualizar.mutate({ itemId: item.id, quantity: item.quantity + 1 })}>+</Button>
                  <Button variant="ghost" size="sm" className="ml-auto"
                    disabled={remover.isPending} onClick={() => remover.mutate(item.id)}>
                    Remover<span className="sr-only"> {item.name}</span>
                  </Button>
                </div>

                {item.quantity > item.available && (
                  <p role="alert" className="text-sm text-destructive">
                    Só há {item.available} disponível(is) agora. Ajuste a quantidade.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-labelledby="titulo-resumo" className="h-fit space-y-4 rounded-xl border border-border bg-card p-4">
        <h2 id="titulo-resumo" className="text-lg font-semibold">Resumo</h2>
        <dl className="flex justify-between">
          <dt>Subtotal ({cart.count} {cart.count === 1 ? 'item' : 'itens'})</dt>
          <dd className="font-semibold">{cart.subtotal} ETH</dd>
        </dl>
        <p className="text-xs text-muted-foreground">Cupom, taxa de rede e total aparecem na próxima etapa.</p>
        <Link
          to="/checkout"
          className="mt-4 block rounded-md bg-[#D28A4C] py-3 text-center font-semibold text-[#140D0A] transition-opacity hover:opacity-90"
        >
          Finalizar compra
        </Link>
      </aside>
    </div>
  )
}

function CarrinhoSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px]" aria-busy="true" aria-label="Carregando carrinho">
      <div className="space-y-3">
        <Skeleton className="mb-4 h-8 w-40" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-30 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}

<Link to="/checkout" className="block rounded-md bg-[#D28A4C] py-3 text-center font-semibold text-[#140D0A]">
  Finalizar compra
</Link>