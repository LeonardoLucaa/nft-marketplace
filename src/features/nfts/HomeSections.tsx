import { Link } from '@tanstack/react-router'
import { FiArrowRight } from 'react-icons/fi'
import type { CatalogTab } from '@/types/api'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'

const PROMOS: { img: string; titulo: string; texto: string; tab: CatalogTab }[] = [
  {
    img: '/images/emerald-ape.png',
    titulo: 'Lançamentos gênesis de edição limitada',
    texto: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    tab: 'new',
  },
  {
    img: '/images/ivory-baron.png',
    titulo: 'Arte digital selecionada e muito mais',
    texto: 'Explore novos artistas, coleções verificadas e obras digitais que definem a nova cultura.',
    tab: 'trending',
  },
]

const POSTS = [
  {
    img: '/images/ivory-baron.png',
    data: '12 de setembro',
    leitura: 6,
    titulo: 'Como funciona a propriedade de NFTs',
    resumo: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    img: '/images/emerald-ape.png',
    data: '13 de setembro',
    leitura: 2,
    titulo: '10 artistas digitais para acompanhar',
    resumo: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    img: '/images/violet-nomad.png',
    data: '15 de setembro',
    leitura: 3,
    titulo: 'Raridade, atributos e procedência',
    resumo: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    img: '/images/golden-beat.png',
    data: '15 de setembro',
    leitura: 2,
    titulo: 'Como proteger sua carteira',
    resumo: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

export function PromoBanners() {
  return (
    <section id="destaques" aria-label="Destaques" className={`${CONTAINER} mt-24 grid scroll-mt-24 gap-6 md:grid-cols-2`}>
      {PROMOS.map((p) => (
        <article key={p.titulo} className="flex overflow-hidden bg-card">
          <img
            src={p.img}
            alt=""
            loading="lazy"
            width={285}
            height={250}
            className="w-[45%] shrink-0 rounded-r-2xl object-cover sm:w-[48%]"
          />
          <div className="flex flex-1 flex-col items-end justify-center gap-3 p-4 text-right sm:p-6">
            <h2 className="text-base font-bold leading-snug sm:text-lg">{p.titulo}</h2>
            <p className="text-xs leading-relaxed text-primary sm:text-sm">{p.texto}</p>
            <Link
              to="/"
              search={{ tab: p.tab, sort: 'recent', page: 1 }}
              hash="catalogo"
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explorar
              <span className="sr-only">: {p.titulo}</span>
              <FiArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

export function MintJournal() {
  return (
    <section id="diario" aria-labelledby="diario-titulo" className={`${CONTAINER} mt-24 scroll-mt-24`}>
      <h2 id="diario-titulo" className="text-center text-2xl font-bold sm:text-3xl">
        Diário da Cunhagem
      </h2>
      <p className="mt-3 text-center text-sm text-primary">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((p) => (
          <li key={p.titulo}>
            <article className="flex h-full flex-col overflow-hidden bg-card">
              <img
                src={p.img}
                alt=""
                loading="lazy"
                width={270}
                height={195}
                className="aspect-[270/195] w-full object-cover object-top"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-[11px] text-muted-foreground">
                  {p.data} <span aria-hidden="true">|</span> Leitura de {p.leitura} min
                </p>
                <h3 className="text-base font-bold leading-snug">{p.titulo}</h3>
                <p className="text-xs leading-relaxed text-primary">{p.resumo}</p>
                <span className="mt-auto pt-1 text-xs font-bold text-primary">
                  Ler mais <span aria-hidden="true">→</span>
                  <span className="sr-only"> (em breve)</span>
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}