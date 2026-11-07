import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiMinus, FiPlus, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/features/cart/queries'
import { useSession } from '@/features/auth/queries'
import { quoteOptions } from '@/features/checkout/queries'
import { erroDeCampo, mensagemErro } from '@/features/checkout/api'
import { useNfts } from '@/features/nfts/queries'
import { NftCard } from '@/features/nfts/NftCard'
import { NftCardSkeleton } from '@/features/nfts/NftCardSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/api'
import { multiplicarEth } from '@/lib/eth'
import type { Cart } from '@/types/api'

export const Route = createFileRoute('/carrinho')({ component: Carrinho })

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'
const GRADE = 'sm:grid-cols-[48px_minmax(0,2fr)_1fr_1fr_1fr_32px]'
const BOTAO_PRIMARIO =
  'inline-flex h-10 w-full items-center justify-center rounded-sm bg-primary px-6 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
const BOTAO_QTD =
  'grid size-5 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40'

type Mudanca = { nome: string; de: string; para: string }

function Carrinho() {
  const { data: cart, isPending, isError, refetch } = useCart()

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
          <li aria-hidden="true">/</li>
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>

      <h1 className="sr-only">Carrinho de NFTs</h1>

      {isPending ? (
        <CarrinhoSkeleton />
      ) : isError ? (
        <section role="alert" className={`${CONTAINER} max-w-md space-y-4 py-16 text-center`}>
          <p>Não foi possível carregar o carrinho.</p>
          <button type="button" onClick={() => refetch()} className={`${BOTAO_PRIMARIO} w-auto`}>
            Tentar novamente
          </button>
        </section>
      ) : cart.items.length === 0 ? (
        <section className={`${CONTAINER} max-w-md space-y-4 py-16 text-center`}>
          <FiShoppingCart className="mx-auto size-10 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold">Seu carrinho está vazio</h2>
          <p className="text-sm text-muted-foreground">Explore o mercado e adicione NFTs à sua coleção.</p>
          <Link to="/" hash="catalogo" className={`${BOTAO_PRIMARIO} w-auto`}>
            Explorar NFTs
          </Link>
        </section>
      ) : (
        <div className={`${CONTAINER} mt-2 grid gap-10 lg:grid-cols-[1fr_310px] lg:gap-14`}>
          <ItensCarrinho cart={cart} />
          <ResumoCarteira cart={cart} />
        </div>
      )}

      <TambemViram excluir={cart?.items.map((i) => i.nftId) ?? []} />
    </div>
  )
}

function ItensCarrinho({ cart }: { cart: Cart }) {
  const atualizar = useUpdateCartItem()
  const remover = useRemoveCartItem()

  // Últimos preços vistos por item, para avisar mudanças em tempo real
  const precosRef = useRef<Map<string, string>>(new Map())
  const [mudancas, setMudancas] = useState<Mudanca[]>([])

  useEffect(() => {
    const anteriores = precosRef.current
    const novas: Mudanca[] = []
    for (const item of cart.items) {
      const antes = anteriores.get(item.id)
      if (antes !== undefined && antes !== item.price) {
        novas.push({ nome: item.name, de: antes, para: item.price })
      }
    }
    precosRef.current = new Map(cart.items.map((i) => [i.id, i.price]))
    if (novas.length > 0) setMudancas((atual) => [...novas, ...atual].slice(0, 5))
  }, [cart])

  const erroMutation = atualizar.error ?? remover.error

  return (
    <section aria-label="Itens do carrinho" className="min-w-0">
      <div
        aria-hidden="true"
        className={`hidden items-center gap-x-4 border-b border-primary/20 px-2 pb-2 text-xs font-bold sm:grid ${GRADE}`}
      >
        <span className="col-span-2">NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span>Total</span>
        <span />
      </div>

      <div role="status" aria-live="polite">
        {mudancas.length > 0 && (
          <div className="mt-3 space-y-1 border border-primary bg-card p-3 text-xs">
            <p className="font-bold text-primary">O preço de itens do seu carrinho mudou:</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {mudancas.map((m, i) => (
                <li key={`${m.nome}-${i}`}>
                  {m.nome}: {m.de} → {m.para} ETH
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setMudancas([])} className="mt-1 text-primary underline">
              Entendi
            </button>
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="min-h-4 py-1 text-xs text-destructive">
        {erroMutation ? mensagemDeErro(erroMutation) : ''}
      </p>

      <ul className="space-y-2">
        {cart.items.map((item) => {
          const excedeu = item.quantity > item.available
          return (
            <li
              key={item.id}
              className={`grid grid-cols-[48px_1fr_auto] items-center gap-x-4 gap-y-2 bg-card p-2 pr-3 ${GRADE}`}
            >
              <img
                src={item.image}
                alt=""
                width={48}
                height={48}
                className="row-span-2 size-12 object-cover sm:row-span-1"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">Edição: {item.editionLabel}</p>
              </div>
              <p className="hidden text-xs font-bold text-primary sm:block">
                <span className="sr-only">Preço unitário: </span>
                {item.price} ETH
              </p>
              <div className="col-start-2 row-start-2 flex items-center gap-2 sm:col-start-auto sm:row-start-auto">
                <button
                  type="button"
                  aria-label={`Diminuir quantidade de ${item.name}`}
                  disabled={item.quantity <= 1 || atualizar.isPending}
                  onClick={() => atualizar.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                  className={BOTAO_QTD}
                >
                  <FiMinus className="size-3" aria-hidden="true" />
                </button>
                <output aria-label={`Quantidade de ${item.name}`} className="w-5 text-center text-xs">
                  {item.quantity}
                </output>
                <button
                  type="button"
                  aria-label={`Aumentar quantidade de ${item.name}`}
                  disabled={item.quantity >= item.available || atualizar.isPending}
                  onClick={() => atualizar.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                  className={BOTAO_QTD}
                >
                  <FiPlus className="size-3" aria-hidden="true" />
                </button>
              </div>
              <p className="col-start-3 row-start-2 justify-self-end text-xs font-bold text-primary sm:col-start-auto sm:row-start-auto sm:justify-self-start">
                <span className="sr-only">Total do item: </span>
                {multiplicarEth(item.price, item.quantity)} ETH
              </p>
              <button
                type="button"
                aria-label={`Remover ${item.name} do carrinho`}
                disabled={remover.isPending}
                onClick={() => remover.mutate(item.id)}
                className="col-start-3 row-start-1 grid size-8 place-items-center justify-self-end text-muted-foreground transition-colors hover:text-primary disabled:opacity-40 sm:col-start-auto sm:row-start-auto"
              >
                <FiTrash2 className="size-4" aria-hidden="true" />
              </button>
              {excedeu && (
                <p role="alert" className="col-span-full text-xs text-destructive">
                  Só há {item.available} disponível(is) agora. Ajuste a quantidade.
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ResumoCarteira({ cart }: { cart: Cart }) {
  const qc = useQueryClient()
  const { data: session } = useSession()
  const logado = !!session
  const [cupom, setCupom] = useState<string | null>(null)
  const [digitado, setDigitado] = useState('')
  const [erroCupom, setErroCupom] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)

  // Cotação exige login; visitante vê o subtotal e calcula a taxa no checkout
  const quote = useQuery({ ...quoteOptions(cupom), enabled: logado })

  // Carrinho mudou (quantidade, remoção ou preço em tempo real): recotar
  const primeira = useRef(true)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    if (logado) void qc.invalidateQueries({ queryKey: ['checkout', 'quote'] })
  }, [cart.subtotal, cart.count, logado, qc])

  async function aplicar(e: FormEvent) {
    e.preventDefault()
    const code = digitado.trim().toUpperCase()
    if (!code) return
    if (!logado) {
      setErroCupom('Entre na sua conta para aplicar um cupom.')
      return
    }
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

  const q = logado && quote.data ? quote.data : null
  const bloqueado = cart.items.some((i) => i.quantity > i.available)

  return (
    <aside aria-labelledby="resumo-titulo" className="h-fit">
      <h2 id="resumo-titulo" className="border-b border-primary/20 pb-2 text-sm font-bold">
        Resumo da carteira
      </h2>

      <form onSubmit={aplicar} noValidate className="mt-5 space-y-2">
        <label htmlFor="cupom" className="block text-xs font-bold">
          Código promocional
        </label>
        <div className="flex">
          <input
            id="cupom"
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            placeholder="Digite o código promocional..."
            aria-invalid={!!erroCupom}
            aria-describedby={erroCupom ? 'cupom-erro' : undefined}
            className="h-8 min-w-0 flex-1 border border-primary/40 bg-transparent px-2 text-xs uppercase placeholder:normal-case placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={aplicando}
            className="h-8 bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {aplicando ? 'Aplicando…' : 'Aplicar'}
          </button>
        </div>
        {erroCupom && (
          <p id="cupom-erro" role="alert" className="text-xs text-destructive">
            {erroCupom}
          </p>
        )}
        {q?.coupon && (
          <p className="text-xs text-muted-foreground">
            {q.coupon.code} aplicado (−{q.coupon.percentOff}%){' '}
            <button
              type="button"
              onClick={() => {
                setCupom(null)
                setDigitado('')
              }}
              className="text-primary underline"
            >
              remover
            </button>
          </p>
        )}
      </form>

      <dl
        aria-live="polite"
        aria-busy={quote.isFetching}
        className={`mt-6 space-y-3 text-xs transition-opacity ${quote.isFetching ? 'opacity-60' : ''}`}
      >
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{q?.subtotal ?? cart.subtotal} ETH</dd>
        </div>
        <div className="flex justify-between">
          <dt>Desconto do lançamento</dt>
          <dd>(-) {q?.discount ?? '0.00'} ETH</dd>
        </div>
        <div>
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{q ? `${q.networkFee} ETH` : logado ? '…' : 'Calculada ao entrar'}</dd>
          </div>
          <p className="mt-1 text-right text-[10px] text-primary">Taxa estimada</p>
        </div>
        <div className="flex justify-between border-t border-primary/20 pt-4 text-sm font-bold">
          <dt>Total</dt>
          <dd className="text-primary">{q?.total ?? cart.subtotal} ETH</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-3 text-center">
        {bloqueado ? (
          <button type="button" disabled className={BOTAO_PRIMARIO}>
            Ajuste as quantidades
          </button>
        ) : (
          <Link to="/checkout" search={{ cupom: q?.coupon?.code }} className={BOTAO_PRIMARIO}>
            {logado ? 'Conectar e finalizar' : 'Entrar e finalizar'}
          </Link>
        )}
        <Link to="/" hash="catalogo" className="inline-block text-xs text-primary hover:underline">
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}

const POR_PAGINA = 5

function TambemViram({ excluir }: { excluir: string[] }) {
  const { data, isPending, isError } = useNfts({ sort: 'recent', page: 1 })
  const [pagina, setPagina] = useState(0)

  if (isError) return null

  const itens = (data?.items ?? []).filter((n) => !excluir.includes(n.id))
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA))
  const atual = Math.min(pagina, paginas - 1)
  const visiveis = itens.slice(atual * POR_PAGINA, atual * POR_PAGINA + POR_PAGINA)

  if (!isPending && itens.length === 0) return null

  return (
    <section aria-labelledby="viram-titulo" className={`${CONTAINER} mt-16`}>
      <h2 id="viram-titulo" className="text-sm font-bold text-primary">
        Colecionadores também viram
      </h2>
      <ul
        className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6"
        aria-busy={isPending}
      >
        {isPending
          ? Array.from({ length: POR_PAGINA }, (_, i) => (
              <li key={i}>
                <NftCardSkeleton />
              </li>
            ))
          : visiveis.map((n) => (
              <li key={n.id}>
                <NftCard nft={n} />
              </li>
            ))}
      </ul>

      {paginas > 1 && (
        <div role="group" aria-label="Páginas de sugestões" className="mt-6 flex justify-center gap-2">
          {Array.from({ length: paginas }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPagina(i)}
              aria-label={`Página ${i + 1} de ${paginas}`}
              aria-current={i === atual ? 'true' : undefined}
              className={`size-2.5 rounded-full border border-primary transition-colors ${
                i === atual ? 'bg-primary' : 'bg-transparent hover:bg-primary/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CarrinhoSkeleton() {
  return (
    <div
      className={`${CONTAINER} mt-2 grid gap-10 lg:grid-cols-[1fr_310px] lg:gap-14`}
      aria-busy="true"
      aria-label="Carregando carrinho"
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}