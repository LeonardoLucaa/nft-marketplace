import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type KeyboardEvent } from 'react'
import { isAxiosError } from 'axios'
import { FaLinkedinIn, FaRegStar, FaStar, FaStarHalfAlt, FaTwitter } from 'react-icons/fa'
import { FiHeart, FiMail, FiMinus, FiPlus, FiSearch } from 'react-icons/fi'
import { toast } from 'sonner'
import { useNft, useNfts } from '@/features/nfts/queries'
import { NftCard } from '@/features/nfts/NftCard'
import { NftCardSkeleton } from '@/features/nfts/NftCardSkeleton'
import { useAddToCart } from '@/features/cart/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { multiplicarEth } from '@/lib/eth'
import { mensagemDeErro } from '@/lib/api'
import type { Nft } from '@/types/api'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'
const BOTAO_PRIMARIO =
  'inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-xs font-bold uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

export const Route = createFileRoute('/nft/$id')({
  component: DetalheNft,
})

function DetalheNft() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
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
          <Link to="/" className={BOTAO_PRIMARIO}>
            Voltar ao catálogo
          </Link>
        </section>
      )
    }
    return (
      <section role="alert" className={`${CONTAINER} max-w-md space-y-4 py-24 text-center`}>
        <p>Não foi possível carregar este NFT.</p>
        <button type="button" onClick={() => refetch()} className={BOTAO_PRIMARIO}>
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

  function comprar() {
    if (!edicao || !nft) return
    adicionar.mutate(
      { nftId: nft.id, editionId: edicao.id, quantity: qtd },
      {
        onSuccess: () => {
          toast.success(`${qtd}x ${nft.name} adicionado ao carrinho`)
          void navigate({ to: '/carrinho' })
        },
        onError: (erro) => toast.error(mensagemDeErro(erro)),
      },
    )
  }

  return (
    <div className="pb-16">
      <nav aria-label="Trilha de navegação" className={`${CONTAINER} pt-8`}>
        <ol className="flex items-center gap-1 text-xs font-bold">
          <li>
            <Link to="/" className="transition-colors hover:text-primary">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalogo" className="transition-colors hover:text-primary">
              Mercado
            </Link>
          </li>
          <li className="sr-only" aria-current="page">
            {nft.name}
          </li>
        </ol>
      </nav>

      <article className={`${CONTAINER} mt-4 grid gap-8 lg:grid-cols-2 lg:gap-8`}>
        <Galeria nft={nft} />

        <div className="space-y-4">
          <h1 className="text-xl font-bold sm:text-2xl">{nft.name}</h1>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold text-primary" aria-live="polite">
              {nft.price} ETH
              {nft.oldPrice && (
                <s className="ml-2 text-sm font-normal text-muted-foreground">
                  <span className="sr-only">Preço anterior: </span>
                  {nft.oldPrice} ETH
                </s>
              )}
            </p>
            <p className="flex items-center gap-1.5 text-xs">
              <Estrelas nota={nft.rating} />
              <span className="sr-only">Nota {nft.rating.toFixed(1)} de 5,</span>
              {nft.ratingCount} avaliações de colecionadores
            </p>
          </div>

          <section aria-labelledby="sobre-titulo" className="space-y-2">
            <h2 id="sobre-titulo" className="text-sm font-bold">
              Sobre este NFT:
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{nft.description}</p>
          </section>

          <fieldset>
            <legend className="mb-2 text-sm font-bold">Edição:</legend>
            <div className="flex flex-wrap gap-2">
              {nft.editions.map((e) => {
                const selecionada = e.id === edicao?.id
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={e.available === 0}
                    aria-pressed={selecionada}
                    title={e.available === 0 ? 'Esgotada' : `${e.available} disponíveis`}
                    onClick={() => {
                      setEdicaoId(e.id)
                      setQuantidade(1)
                    }}
                    className={`rounded-full border px-2.5 py-0.5 text-xs uppercase transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                      selecionada
                        ? 'border-foreground text-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {e.label}
                    <span className="sr-only">
                      {e.available === 0 ? ' (esgotada)' : ` (${e.available} disponíveis)`}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={esgotado || qtd <= 1}
                onClick={() => setQuantidade(qtd - 1)}
                className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <FiMinus className="size-4" aria-hidden="true" />
              </button>
              <label htmlFor="qtd" className="sr-only">
                Quantidade
              </label>
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
                className="w-8 bg-transparent text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={esgotado || qtd >= disponivel}
                onClick={() => setQuantidade(qtd + 1)}
                className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <FiPlus className="size-4" aria-hidden="true" />
              </button>
              {qtd > 1 && (
                <span className="text-xs text-muted-foreground">= {multiplicarEth(nft.price, qtd)} ETH</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={esgotado || adicionar.isPending}
                onClick={comprar}
                className={`${BOTAO_PRIMARIO} min-w-[120px]`}
              >
                {adicionar.isPending ? 'Adicionando...' : esgotado ? 'Esgotado' : 'Comprar'}
              </button>
              <button
                type="button"
                aria-pressed={favorito}
                onClick={() => setFavorito((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-primary px-4 text-xs text-primary transition-colors hover:bg-primary/10"
              >
                <FiHeart className={`size-4 ${favorito ? 'fill-primary' : ''}`} aria-hidden="true" />
                {favorito ? 'Favoritado' : 'Favoritar'}
              </button>
            </div>
          </div>
          <p id="qtd-ajuda" className="sr-only" aria-live="polite">
            {esgotado ? 'Edição indisponível.' : `Máximo de ${disponivel} para esta edição.`}
          </p>

          <dl className="space-y-2 pt-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>#{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            {nft.attributes.length > 0 && (
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
            )}
          </dl>

          <Compartilhar nome={nft.name} />
        </div>
      </article>

      <AbasNft nft={nft} />
      <MaisDaColecao nft={nft} />
    </div>
  )
}

function Galeria({ nft }: { nft: Nft }) {
  const [ativa, setAtiva] = useState(0)
  const [zoom, setZoom] = useState(false)
  // A API tem uma imagem por NFT; as miniaturas seguem o layout do Figma
  const imagens = [nft.image, nft.image, nft.image, nft.image]

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <ul className="flex gap-3 sm:flex-col" aria-label="Miniaturas">
        {imagens.map((src, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setAtiva(i)}
              aria-label={`Ver imagem ${i + 1} de ${imagens.length}`}
              aria-pressed={ativa === i}
              className={`block overflow-hidden rounded-sm border-2 transition-colors ${
                ativa === i ? 'border-primary' : 'border-transparent hover:border-primary/50'
              }`}
            >
              <img
                src={src}
                alt=""
                width={68}
                height={68}
                loading="lazy"
                className="size-16 object-cover sm:size-[68px]"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex-1 bg-card p-4 sm:p-3.5">
        <img
          src={imagens[ativa]}
          alt={`${nft.name}, da coleção ${nft.collection}`}
          width={480}
          height={480}
          fetchPriority="high"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Ampliar imagem"
          className="absolute right-6 top-6 grid size-8 place-items-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <FiSearch className="size-4" aria-hidden="true" />
        </button>
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-3xl border-none bg-card p-4">
          <DialogTitle className="sr-only">{nft.name}</DialogTitle>
          <img src={imagens[ativa]} alt={nft.name} className="w-full rounded-xl object-cover" />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Compartilhar({ nome }: { nome: string }) {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const texto = encodeURIComponent(`${nome} na Kurio`)
  const link = encodeURIComponent(url)
  const ICONE = 'grid size-5 place-items-center transition-colors hover:text-primary'

  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      <span>Compartilhar este NFT:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no LinkedIn"
        className={ICONE}
      >
        <FaLinkedinIn className="size-4" aria-hidden="true" />
      </a>
      <a href={`mailto:?subject=${texto}&body=${link}`} aria-label="Compartilhar por e-mail" className={ICONE}>
        <FiMail className="size-4" aria-hidden="true" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${texto}&url=${link}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no Twitter"
        className={ICONE}
      >
        <FaTwitter className="size-4" aria-hidden="true" />
      </a>
    </div>
  )
}

type Aba = 'detalhes' | 'avaliacoes'

const AVALIACOES = [
  { autor: 'Marina Costa', nota: 5, texto: 'Arte impecável e entrega instantânea na carteira. Um dos melhores da coleção.' },
  { autor: 'Rafael Lima', nota: 5, texto: 'Os detalhes em alta resolução são incríveis. Vale cada ETH.' },
  { autor: 'Julia Martins', nota: 4, texto: 'Ótima peça. Gostaria de mais conteúdo desbloqueável, mas recomendo.' },
]

function AbasNft({ nft }: { nft: Nft }) {
  const [aba, setAba] = useState<Aba>('detalhes')
  const abas: { id: Aba; label: string }[] = [
    { id: 'detalhes', label: 'Detalhes do NFT' },
    { id: 'avaliacoes', label: `Avaliações de colecionadores (${nft.ratingCount})` },
  ]

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = abas.findIndex((a) => a.id === aba)
    const prox = abas[(i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length]
    setAba(prox.id)
    document.getElementById(`aba-${prox.id}`)?.focus()
  }

  return (
    <section className={`${CONTAINER} mt-16`}>
      <div
        role="tablist"
        aria-label="Informações do NFT"
        onKeyDown={teclado}
        className="flex gap-6 overflow-x-auto border-b border-primary/20"
      >
        {abas.map((a) => {
          const ativa = aba === a.id
          return (
            <button
              key={a.id}
              id={`aba-${a.id}`}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-controls={`painel-${a.id}`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => setAba(a.id)}
              className={`relative whitespace-nowrap pb-2 text-sm transition-colors hover:text-primary ${
                ativa
                  ? 'font-bold text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                  : ''
              }`}
            >
              {a.label}
            </button>
          )
        })}
      </div>

      <div
        id="painel-detalhes"
        role="tabpanel"
        aria-labelledby="aba-detalhes"
        hidden={aba !== 'detalhes'}
        className="space-y-5 pt-4 text-xs leading-relaxed"
      >
        <p className="text-muted-foreground">
          {nft.name} é uma obra digital da coleção {nft.collection}. {nft.description} Cada atributo fica
          armazenado nos metadados do token e verificado na {nft.network}.
        </p>
        <p className="text-muted-foreground">
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro
          permanente de procedência registrada na rede. O criador recebe 5% de direitos autorais nas vendas
          secundárias, apoiando novos trabalhos e lançamentos da comunidade.
        </p>
        <div>
          <h3 className="font-bold">Rede:</h3>
          <p className="text-muted-foreground">
            Cunhado na {nft.network} com procedência imutável e metadados armazenados no IPFS.
          </p>
        </div>
        <div>
          <h3 className="font-bold">Contrato:</h3>
          <p className="text-muted-foreground">
            Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
          </p>
        </div>
        <div>
          <h3 className="font-bold">Direitos autorais:</h3>
          <p className="text-muted-foreground">
            0x7A{nft.tokenId.slice(-2)}...19E8 · Contrato inteligente ERC-721 verificado.
          </p>
        </div>
      </div>

      <div
        id="painel-avaliacoes"
        role="tabpanel"
        aria-labelledby="aba-avaliacoes"
        hidden={aba !== 'avaliacoes'}
        className="pt-4"
      >
        <p className="flex items-center gap-2 text-sm">
          <Estrelas nota={nft.rating} />
          <strong>{nft.rating.toFixed(1)}</strong>
          <span className="text-muted-foreground">de 5 · {nft.ratingCount} avaliações</span>
        </p>
        <ul className="mt-4 space-y-4">
          {AVALIACOES.map((a) => (
            <li key={a.autor} className="bg-card p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <strong>{a.autor}</strong>
                <span className="flex items-center gap-1">
                  <Estrelas nota={a.nota} />
                  <span className="sr-only">Nota {a.nota} de 5</span>
                </span>
              </div>
              <p className="mt-2 text-muted-foreground">{a.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="flex gap-0.5 text-primary" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        const v = nota - i
        if (v >= 1) return <FaStar key={i} className="size-3" />
        if (v >= 0.5) return <FaStarHalfAlt key={i} className="size-3" />
        return <FaRegStar key={i} className="size-3" />
      })}
    </span>
  )
}

function MaisDaColecao({ nft }: { nft: Nft }) {
  const { data, isPending, isError } = useNfts({ sort: 'recent', page: 1 })

  if (isError) return null

  // mesma coleção primeiro, depois mesma categoria, depois o resto
  const peso = (n: Nft) => (n.collection === nft.collection ? 2 : n.category === nft.category ? 1 : 0)
  const itens = (data?.items ?? [])
    .filter((n) => n.id !== nft.id)
    .sort((a, b) => peso(b) - peso(a))
    .slice(0, 5)

  if (!isPending && itens.length === 0) return null

  return (
    <section aria-labelledby="colecao-titulo" className={`${CONTAINER} mt-16`}>
      <h2 id="colecao-titulo" className="border-b border-primary/20 pb-2 text-sm font-bold text-primary">
        Mais desta coleção
      </h2>
      <ul
        className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6"
        aria-busy={isPending}
      >
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
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
        <Skeleton className="h-3 w-28" />
      </div>
      <div className={`${CONTAINER} mt-4 grid gap-8 lg:grid-cols-2`}>
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          <div className="flex gap-3 sm:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-16 rounded-sm sm:size-[68px]" />
            ))}
          </div>
          <div className="flex-1 bg-card p-4 sm:p-3.5">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-12 rounded-full" />
            ))}
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-10 w-60" />
          </div>
          <Skeleton className="h-16 w-56" />
        </div>
      </div>
    </div>
  )
}