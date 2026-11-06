import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from 'react-icons/fa'
import { toast } from 'sonner'
import type { Category } from '@/types/api'
import { WalletBadge } from './WalletBadge'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'

const DESTAQUES = [
  { letra: 'W', titulo: 'Segurança da carteira', texto: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letra: 'C', titulo: 'Criadores em destaque', texto: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letra: 'D', titulo: 'Alertas de lançamentos', texto: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const PERFIL = ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']
const AJUDA = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']
const COLECOES: Category[] = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']

const REDES = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FaFacebookF },
  { label: 'Instagram', href: 'https://instagram.com', Icon: FaInstagram },
  { label: 'Twitter', href: 'https://twitter.com', Icon: FaTwitter },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: FaLinkedinIn },
  { label: 'YouTube', href: 'https://youtube.com', Icon: FaYoutube },
]

function FooterCol({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{titulo}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  const [email, setEmail] = useState('')

  function inscrever(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    toast.success('Inscrição confirmada! Você vai receber os próximos lançamentos.')
    setEmail('')
  }

  return (
    <footer className="mt-24">
      <div className={CONTAINER}>
        <div className="grid gap-10 bg-card px-6 py-8 sm:px-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {DESTAQUES.map((d) => (
            <div key={d.letra} className="lg:border-r lg:border-primary lg:px-6 lg:first:pl-0">
              <span
                aria-hidden="true"
                className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
              >
                {d.letra}
              </span>
              <h2 className="mt-4 text-lg font-bold">{d.titulo}</h2>
              <p className="mt-3 text-sm leading-relaxed text-primary">{d.texto}</p>
            </div>
          ))}

          <div className="lg:pl-6">
            <h2 className="text-lg font-bold leading-tight">Antecipe-se ao próximo lançamento</h2>
            <form onSubmit={inscrever} className="mt-4 flex">
              <label htmlFor="newsletter-email" className="sr-only">
                Seu e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="digite seu e-mail..."
                className="h-10 min-w-0 flex-1 bg-secondary px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                className="h-10 bg-primary px-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Enviar
              </button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </div>
        </div>

        <div className="grid gap-4 bg-[#3A2314] px-6 py-6 text-sm sm:px-8 md:grid-cols-4 md:items-center">
          <span className="font-bold tracking-[0.2em]">KURIO</span>
          <p>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a href="mailto:contato@email.com" className="transition-colors hover:text-primary">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="transition-colors hover:text-primary">
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid gap-8 bg-card px-6 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <FooterCol titulo="Meu perfil" itens={PERFIL} />
          <FooterCol titulo="Central de ajuda" itens={AJUDA} />

          <div>
            <h2 className="text-lg font-bold">Coleções</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {COLECOES.map((c) => (
                <li key={c}>
                  <Link
                    to="/"
                    search={{ category: c, sort: 'recent', page: 1 }}
                    hash="catalogo"
                    className="transition-colors hover:text-primary"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold">Redes sociais</h2>
            <ul className="mt-3 flex gap-2">
              {REDES.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-8 place-items-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 text-lg font-bold">Carteiras compatíveis</h2>
            <WalletBadge className="mt-3" />
          </div>
        </div>

        <p className="py-6 text-center text-xs">© 2026 Kurio. Propriedade digital para todos.</p>
      </div>
    </footer>
  )
}