import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { FiChevronRight, FiHeart, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi'
import { toast } from 'sonner'
import { useNft, useNfts } from '@/features/nfts/queries'
import { NftCard } from '@/features/nfts/NftCard'
import { NftCardSkeleton } from '@/features/nfts/NftCardSkeleton'
import { useAddToCart } from '@/features/cart/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { multiplicarEth } from '@/lib/eth'
import { mensagemDeErro } from '@/lib/api'
import type { Nft } from '@/types/api'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'

const TAB_TRIGGER =
  'relative rounded-none bg-transparent px-0 pb-2 text-sm text-foreground shadow-none transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary'

export const Route = createFileRoute('/nft/$id')({
  component: DetalheNft,
})

function DetalheNft() {
  const { id } = Route.useParams()
  const { data: nft, isPending, isError, error, refetch } = useNft(id)
  const [edicaoId, setEdicaoId] = useState<string>()
  const [quantidade, setQuantidade] = useState(1)
  const [favorito, setFavorito] = useState(false)
  const adicionar = useAddToCart()

  if (isPending) return <DetalheSkeleton />

  if (isError) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return (
        <section className={`${CONTAINER} max-w-md space-y-4 py-24 text-center`}>
          <h1 className="text-xl font-bold">NFT não encontrado</h1>
          <p className="text-muted-foreground">O NFT "{id}" não existe ou foi removido.</p>
          <Link
            to="/"
            className="inline-block rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
          >
            Voltar ao catálogo
          </Link>
        </section>
      )
    }
    return (
      <section role="alert" className={`${CONTAINER} max-w-md space-y-4 py-24 text-center`}>
        <p>Não foi possível carregar este NFT.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  const edicao =
    nft.editions.find((e) => e.id === edicaoId) ?? nft.editions.find((e) => e.available > 0)
  const disponivel = edicao?.available ?? 0
  const esgotado = disponivel === 0
  const qtd = Math.min(Math.max(quantidade, 1), Math.max(disponivel, 1))

  function addCarrinho() {
    if (!edicao || !nft) return
    adicionar.mutate(
      { nftId: nft.id, editionId: edicao.id, quantity: qtd },
      {
        onSuccess: () => toast.success(`${qtd}x ${nft.name} adicionado ao carrinho`),
        onError: (erro) => toast.error(mensagemDeErro(erro)),
      },
    )
  }

  return (
    <div className="pb-16">
      <nav aria-label="Trilha de navegação" className={`${CONTAINER} pt-8`}>
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="transition-colors hover:text-primary">
              Início
            </Link>
          </li>
          <li aria-hidden="true">
            <FiChevronRight className="size-4" />
          </li>
          <li>
            <Link to="/" search={{ category: nft.category }} className="transition-colors hover:text-primary">
              {nft.category}
            </Link>
          </li>
          <li aria-hidden="true">
            <FiChevronRight className="size-4" />
          </li>
          <li aria-current="page" className="truncate text-foreground">
            {nft.name}
          </li>
        </ol>
      </nav>

      <article className={`${CONTAINER} mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16`}>
        <div className="relative self-start bg-card p-4 sm:p-6">
          <img
            src={nft.image}
            alt={`${nft.name}, da coleção ${nft.collection}`}
            width={560}
            height={560}
            fetchPriority="high"
            className="aspect-square w-full rounded-2xl object-cover"
          />
          {nft.rare && (
            <span className="absolute left-0 top-4 bg-primary px-3 py-0.5 text-sm font-medium tracking-wide text-primary-foreground sm:top-6">
              RARO
            </span>
          )}
        </div>

        <div className="space-y-6">
          <header className="space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{nft.collection}</span>
              <span aria-hidden="true">·</span>
              <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs text-foreground">{nft.network}</span>
            </p>
            <h1 className="text-2xl font-bold uppercase tracking-wide sm:text-4xl">{nft.name}</h1>
            <div className="flex items-center gap-2 text-sm">
              <Estrelas nota={nft.rating} />
              <span>
                <span className="sr-only">Nota </span>
                {nft.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">({nft.ratingCount} avaliações)</span>
            </div>
          </header>

          <p className="text-3xl font-bold text-primary" aria-live="polite">
            {nft.price} ETH
            {nft.oldPrice && (
              <s className="ml-3 text-lg font-normal text-muted-foreground">
                <span className="sr-only">Preço anterior: </span>
                {nft.oldPrice} ETH
              </s>
            )}
          </p>

          <p className="leading-relaxed text-muted-foreground">{nft.description}</p>

          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-bold">Edição</legend>
            <div className="flex flex-wrap gap-2">
              {nft.editions.map((e) => {
                const selecionada = e.id === edicao?.id
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={e.available === 0}
                    aria-pressed={selecionada}
                    onClick={() => {
                      setEdicaoId(e.id)
                      setQuantidade(1)
                    }}
                    className={`rounded-sm border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selecionada
                        ? 'border-primary bg-primary font-bold text-primary-foreground'
                        : 'border-primary/40 hover:border-primary'
                    }`}
                  >
                    {e.label}{' '}
                    <span className={selecionada ? '' : 'text-muted-foreground'}>
                      {e.available === 0 ? '(esgotada)' : `(${e.available} disp.)`}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="space-y-3">
            <label htmlFor="qtd" className="block text-sm font-bold">
              Quantidade
            </label>
            <div className="flex flex-wrap items-center gap-6">
              <div className="inline-flex items-center border border-primary/40">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={esgotado || qtd <= 1}
                  onClick={() => setQuantidade(qtd - 1)}
                  className="grid size-10 place-items-center transition-colors hover:text-primary disabled:opacity-40"
                >
                  <FiMinus className="size-4" aria-hidden="true" />
                </button>
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
                  className="h-10 w-14 bg-transparent text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={esgotado || qtd >= disponivel}
                  onClick={() => setQuantidade(qtd + 1)}
                  className="grid size-10 place-items-center transition-colors hover:text-primary disabled:opacity-40"
                >
                  <FiPlus className="size-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm">
                Total: <strong className="text-lg text-primary">{multiplicarEth(nft.price, qtd)} ETH</strong>
              </p>
            </div>
            <p id="qtd-ajuda" className="text-xs text-muted-foreground" aria-live="polite">
              {esgotado ? 'Edição indisponível.' : `Máximo de ${disponivel} para esta edição.`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={esgotado || adicionar.isPending}
              onClick={addCarrinho}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-8 text-sm font-bold uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <FiShoppingCart className="size-4" aria-hidden="true" />
              {adicionar.isPending ? 'Adicionando...' : esgotado ? 'Esgotado' : 'Adicionar ao carrinho'}
            </button>
            <button
              type="button"
              aria-pressed={favorito}
              aria-label={favorito ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
              onClick={() => setFavorito((v) => !v)}
              className="grid size-12 place-items-center rounded-sm border border-primary/40 transition-colors hover:border-primary"
            >
              <FiHeart className={`size-5 ${favorito ? 'fill-primary text-primary' : ''}`} aria-hidden="true" />
            </button>
          </div>

          <Tabs defaultValue="detalhes" className="pt-4">
            <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-primary/20 bg-transparent p-0">
              <TabsTrigger value="detalhes" className={TAB_TRIGGER}>
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="atributos" className={TAB_TRIGGER}>
                Atributos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="pt-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Token ID</dt>
                <dd>#{nft.tokenId}</dd>
                <dt className="text-muted-foreground">Rede</dt>
                <dd>{nft.network}</dd>
                <dt className="text-muted-foreground">Coleção</dt>
                <dd>{nft.collection}</dd>
                <dt className="text-muted-foreground">Categoria</dt>
                <dd>{nft.category}</dd>
                <dt className="text-muted-foreground">Edições</dt>
                <dd>{nft.editions.length}</dd>
              </dl>
            </TabsContent>

            <TabsContent value="atributos" className="pt-4">
              {nft.attributes.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {nft.attributes.map((a) => (
                    <li key={a} className="rounded-sm bg-card px-3 py-1.5 text-sm text-muted-foreground">
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Este NFT não possui atributos.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </article>

      <Relacionados nft={nft} />
    </div>
  )
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="flex gap-0.5 text-primary" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        const v = nota - i
        if (v >= 1) return <FaStar key={i} className="size-4" />
        if (v >= 0.5) return <FaStarHalfAlt key={i} className="size-4" />
        return <FaRegStar key={i} className="size-4" />
      })}
    </span>
  )
}

function Relacionados({ nft }: { nft: Nft }) {
  const { data, isPending, isError } = useNfts({ sort: 'recent', page: 1 })

  if (isError) return null

  // mesma categoria primeiro, depois os mais recentes
  const itens = (data?.items ?? [])
    .filter((n) => n.id !== nft.id)
    .sort((a, b) => Number(b.category === nft.category) - Number(a.category === nft.category))
    .slice(0, 4)

  if (!isPending && itens.length === 0) return null

  return (
    <section aria-labelledby="relacionados-titulo" className={`${CONTAINER} mt-20`}>
      <h2 id="relacionados-titulo" className="text-xl font-bold uppercase tracking-wide sm:text-2xl">
        Você também pode gostar
      </h2>
      <ul
        className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8"
        aria-busy={isPending}
      >
        {isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <NftCardSkeleton />
              </li>
            ))
          : itens.map((n) => (
              <li key={n.id}>
                <NftCard nft={n} />
              </li>
            ))}
      </ul>
    </section>
  )
}

function DetalheSkeleton() {
  return (
    <div className="pb-16" aria-busy="true" aria-label="Carregando NFT">
      <div className={`${CONTAINER} pt-8`}>
        <Skeleton className="h-4 w-56" />
      </div>
      <div className={`${CONTAINER} mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16`}>
        <div className="bg-card p-4 sm:p-6">
          <Skeleton className="aspect-square w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-12 w-64" />
        </div>
      </div>
    </div>
  )
}