import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FiSliders } from 'react-icons/fi'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CATEGORIES, NETWORKS, type Category, type Network, type NftFacets } from '@/types/api'

export const PRICE_MIN = 0
export const PRICE_MAX = 15

export type FiltersValue = {
  category?: Category
  network?: Network
  minPrice?: string
  maxPrice?: string
}

type Props = {
  value: FiltersValue
  facets?: NftFacets
  onChange: (patch: Partial<FiltersValue>) => void
}

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Estilos do slider aplicados por fora, sem editar o componente do shadcn
const SLIDER_CLASSES = [
  '[&_[data-slot=slider-track]]:h-1',
  '[&_[data-slot=slider-track]]:w-full',
  '[&_[data-slot=slider-track]]:bg-primary/30',
  '[&_[data-slot=slider-range]]:h-full',
  '[&_[data-slot=slider-range]]:bg-primary',
  '[&_[data-slot=slider-thumb]]:size-4',
  '[&_[data-slot=slider-thumb]]:border-2',
  '[&_[data-slot=slider-thumb]]:border-background',
  '[&_[data-slot=slider-thumb]]:bg-primary',
].join(' ')

function contarFiltros(v: FiltersValue) {
  return [v.category, v.network, v.minPrice, v.maxPrice].filter(Boolean).length
}

export function CatalogFilters({ value, facets, onChange }: Props) {
  const id = useId()
  const [faixa, setFaixa] = useState<number[]>([
    value.minPrice ? Number(value.minPrice) : PRICE_MIN,
    value.maxPrice ? Number(value.maxPrice) : PRICE_MAX,
  ])

  function aplicarPreco() {
    const [min, max] = faixa
    onChange({
      minPrice: min > PRICE_MIN ? min.toFixed(2) : undefined,
      maxPrice: max < PRICE_MAX ? max.toFixed(2) : undefined,
    })
  }

  return (
    <div className="space-y-8 bg-card px-5 py-6">
      <section aria-labelledby={`${id}-colecoes`}>
        <h2 id={`${id}-colecoes`} className="text-lg font-bold">
          Coleções
        </h2>
        <ul className="mt-4 space-y-1">
          {CATEGORIES.map((c) => {
            const ativo = value.category === c
            return (
              <li key={c}>
                <button
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onChange({ category: ativo ? undefined : c })}
                  className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-[15px] transition-colors hover:bg-secondary ${
                    ativo ? 'bg-secondary font-bold text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <span>{c}</span>
                  <span className="font-bold tabular-nums text-primary">({facets?.categories[c] ?? 0})</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby={`${id}-preco`}>
        <h2 id={`${id}-preco`} className="text-lg font-bold">
          Faixa de preço
        </h2>
        <Slider
          className={`mt-5 ${SLIDER_CLASSES}`}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={0.01}
          value={faixa}
          onValueChange={setFaixa}
        />
        <p className="mt-4 px-3 text-sm" aria-live="polite">
          Preço: {fmt.format(faixa[0])} - {fmt.format(faixa[1])} ETH
        </p>
        <button
          type="button"
          onClick={aplicarPreco}
          className="ml-3 mt-3 rounded-sm bg-primary px-3 py-1.5 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Aplicar
        </button>
      </section>

      <section aria-labelledby={`${id}-rede`}>
        <h2 id={`${id}-rede`} className="text-lg font-bold">
          Rede
        </h2>
        <ul className="mt-4 space-y-1">
          {NETWORKS.map((n) => {
            const ativo = value.network === n
            return (
              <li key={n}>
                <button
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onChange({ network: ativo ? undefined : n })}
                  className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-[15px] transition-colors hover:bg-secondary ${
                    ativo ? 'bg-secondary font-bold text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <span>{n}</span>
                  <span className="tabular-nums">({facets?.networks[n] ?? 0})</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {contarFiltros(value) > 0 && (
        <button
          type="button"
          onClick={() => onChange({ category: undefined, network: undefined, minPrice: undefined, maxPrice: undefined })}
          className="px-3 text-sm text-primary underline underline-offset-4"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export function FeaturedNft() {
  return (
    <Link
      to="/nft/$id"
      params={{ id: 'nft-314' }}
      aria-label="NFT em destaque: Violet Nomad #314, oferta limitada"
      className="group block overflow-hidden bg-card"
    >
      <div className="px-4 pt-6">
        <p className="text-2xl font-bold uppercase tracking-wide text-primary">NFT em destaque</p>
        <p className="mt-2 text-center text-xl font-bold uppercase tracking-wide">Oferta limitada</p>
      </div>
      <img
        src="/images/violet-nomad.png"
        alt=""
        loading="lazy"
        width={310}
        height={360}
        className="mt-3 aspect-[310/360] w-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    </Link>
  )
}

export function MobileFilters(props: Props) {
  const [aberto, setAberto] = useState(false)
  const total = contarFiltros(props.value)

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-primary/60 px-3 text-sm text-primary lg:hidden"
        >
          <FiSliders className="size-4" aria-hidden="true" />
          Filtros{total > 0 ? ` (${total})` : ''}
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        aria-describedby={undefined}
        className="w-[85vw] max-w-sm gap-0 overflow-y-auto border-border bg-card p-0"
      >
        <SheetTitle className="px-5 pt-5 text-lg font-bold">Filtros</SheetTitle>
        <CatalogFilters key={`${props.value.minPrice}-${props.value.maxPrice}`} {...props} />
      </SheetContent>
    </Sheet>
  )
}