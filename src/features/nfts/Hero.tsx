import { Link } from '@tanstack/react-router'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'

export function Hero() {
  return (
    <section aria-labelledby="hero-titulo" className={`${CONTAINER} pt-6 lg:pt-3`}>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_450px] lg:gap-10">
        <div className="lg:pl-12">
          <p className="text-sm tracking-wider">Bem-vindo à Kurio</p>
          <h1
            id="hero-titulo"
            className="mt-4 text-[26px] font-bold uppercase leading-[1.4] tracking-wide sm:text-4xl lg:text-[44px] lg:leading-[70px]"
          >
            Seja dono do futuro
            <br />
            da arte digital
          </h1>
          <p className="mt-5 max-w-[520px] text-sm leading-6 text-primary">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas
            e tenha uma parte da cultura da internet.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="mt-10 inline-flex h-10 items-center rounded-sm bg-primary px-7 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Explorar
          </Link>
          <div aria-hidden="true" className="mt-10 hidden justify-end gap-1.5 lg:flex">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="size-1.5 rounded-full bg-primary" />
          </div>
        </div>

        <img
          src="/images/emerald-ape.png"
          alt="Emerald Ape #042, NFT em destaque da coleção Kurio Apes"
          width={450}
          height={450}
          fetchPriority="high"
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </div>
    </section>
  )
}