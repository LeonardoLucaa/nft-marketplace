import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useNft } from '@/features/nfts/queries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { multiplicarEth } from '@/lib/eth'
import { useAddToCart } from '@/features/cart/queries'
import { mensagemDeErro } from '@/lib/api'

export const Route = createFileRoute('/nft/$id')({
  component: DetalheNft,
})

function DetalheNft() {
  const { id } = Route.useParams()
  const { data: nft, isPending, isError, error, refetch } = useNft(id)
  const [edicaoId, setEdicaoId] = useState<string>()
  const [quantidade, setQuantidade] = useState(1)
  const adicionar = useAddToCart()

  if (isPending) return <DetalheSkeleton />

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return (
        <section className="mx-auto max-w-md space-y-4 py-16 text-center">
          <h1 className="text-xl font-semibold">NFT não encontrado</h1>
          <p className="text-muted-foreground">O NFT "{id}" não existe ou foi removido.</p>
          <Button asChild>
            <Link to="/" search={{ sort: 'recent', page: 1 }}>Voltar ao catálogo</Link>
          </Button>
        </section>
      )
    }
    return (
      <section role="alert" className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p>Não foi possível carregar este NFT.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </section>
    )
  }

  const edicao =
    nft.editions.find((e) => e.id === edicaoId) ?? nft.editions.find((e) => e.available > 0)
  const disponivel = edicao?.available ?? 0
  const esgotado = disponivel === 0
  const qtd = Math.min(Math.max(quantidade, 1), Math.max(disponivel, 1))

  return (
    <article className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
      <img
        src={nft.image}
        alt={`${nft.name}, da coleção ${nft.collection}`}
        width={600}
        height={600}
        className="aspect-square w-full rounded-xl object-cover"
      />

      <div className="space-y-6">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">{nft.collection} · {nft.network}</p>
          <h1 className="text-2xl font-bold">{nft.name}</h1>
          <p className="text-sm text-muted-foreground">
            Nota {nft.rating.toFixed(1)} ({nft.ratingCount} avaliações)
          </p>
        </header>

        <p className="text-2xl font-semibold text-primary">
          {nft.price} ETH{' '}
          {nft.oldPrice && (
            <s className="text-base text-muted-foreground">
              <span className="sr-only">Preço anterior: </span>{nft.oldPrice}
            </s>
          )}
        </p>

        <p className="text-muted-foreground">{nft.description}</p>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Edição</legend>
          <div className="flex flex-wrap gap-2">
            {nft.editions.map((e) => {
              const selecionada = e.id === edicao?.id
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={e.available === 0}
                  aria-pressed={selecionada}
                  onClick={() => { setEdicaoId(e.id); setQuantidade(1) }}
                  className={`rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                    selecionada ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
                  }`}
                >
                  {e.label} {e.available === 0 ? '(esgotada)' : `(${e.available} disp.)`}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="qtd" className="text-sm font-medium">Quantidade</label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" aria-label="Diminuir quantidade"
              disabled={esgotado || qtd <= 1} onClick={() => setQuantidade(qtd - 1)}>−</Button>
            <input
              id="qtd"
              type="number"
              inputMode="numeric"
              min={1}
              max={disponivel}
              value={qtd}
              disabled={esgotado}
              aria-describedby="qtd-ajuda"
              onChange={(ev) => setQuantidade(Math.trunc(Number(ev.target.value)) || 1)}
              className="w-16 rounded-md border border-border bg-card px-2 py-2 text-center"
            />
            <Button type="button" variant="outline" aria-label="Aumentar quantidade"
              disabled={esgotado || qtd >= disponivel} onClick={() => setQuantidade(qtd + 1)}>+</Button>
          </div>
          <p id="qtd-ajuda" className="text-xs text-muted-foreground" aria-live="polite">
            {esgotado ? 'Edição indisponível.' : `Máximo de ${disponivel} para esta edição.`}
          </p>
        </div>

        <p className="text-lg">
          Total: <strong className="text-primary">{multiplicarEth(nft.price, qtd)} ETH</strong>
        </p>

        <div className="flex flex-wrap gap-3">
          {/* Ligados na próxima etapa (carrinho e favoritos) */}
            <Button
              disabled={esgotado || adicionar.isPending}
              onClick={() => edicao && adicionar.mutate({ nftId: nft.id, editionId: edicao.id, quantity: qtd })}
            >
              {adicionar.isPending ? 'Adicionando...' : esgotado ? 'Esgotado' : 'Adicionar ao carrinho'}
            </Button>
        </div>

        <p role="status" aria-live="polite" className="text-sm">
          {adicionar.isSuccess && 'Adicionado ao carrinho.'}
          {adicionar.isError && <span className="text-destructive">
        {mensagemDeErro(adicionar.error)}</span>}
        </p>

        {nft.attributes.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium">Atributos</h2>
            <ul className="flex flex-wrap gap-2">
              {nft.attributes.map((a) => (
                <li key={a} className="rounded-md bg-card px-3 py-1 text-sm text-muted-foreground">{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}

function DetalheSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2" aria-busy="true" aria-label="Carregando NFT">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  )
}