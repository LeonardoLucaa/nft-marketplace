import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '@/lib/session'
import { errosDosCampos, mensagemDeErro } from '@/lib/api'
import { Campo } from '@/components/campo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useChangePassword, useProfile, useUpdateProfile } from '@/features/profile/queries'
import type { User } from '@/types/api'

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ location }) => {
    if (!getToken()) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Perfil,
})

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'
const SECAO = 'rounded-lg border border-border bg-card p-4 sm:p-6'
const TIPOS_AVATAR = ['image/png', 'image/jpeg', 'image/webp']
const EMAIL = /^\S+@\S+\.\S+$/

// Recorta no centro e reduz para 256x256, mantendo o data URL pequeno para o mock.
function reduzirImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const lado = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('canvas indisponível'))
      ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('imagem inválida'))
    }
    img.src = url
  })
}

function Perfil() {
  const { data: user, isPending, isError, error, refetch } = useProfile()

  return (
    <div className={`${CONTAINER} space-y-6 pb-16 pt-8`}>
      <h1 className="text-2xl font-bold">Meu perfil</h1>

      {isPending && (
        <div className="space-y-6" aria-busy="true" aria-label="Carregando perfil">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <div role="alert" className={`${SECAO} space-y-3`}>
          <p>{mensagemDeErro(error, 'Não foi possível carregar seu perfil.')}</p>
          <Button type="button" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {user && (
        <>
          <SecaoAvatar user={user} />
          <SecaoDados user={user} />
          <SecaoSenha />
        </>
      )}
    </div>
  )
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function SecaoAvatar({ user }: { user: User }) {
  const atualizar = useUpdateProfile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!arquivo) return
    setErro(null)
    if (!TIPOS_AVATAR.includes(arquivo.type)) return setErro('Envie uma imagem PNG, JPG ou WebP.')
    if (arquivo.size > 5 * 1024 * 1024) return setErro('A imagem deve ter no máximo 5 MB.')
    try {
      const avatarUrl = await reduzirImagem(arquivo)
      atualizar.mutate(
        { name: user.name, email: user.email, avatarUrl },
        { onError: (err) => setErro(errosDosCampos(err).avatarUrl ?? mensagemDeErro(err)) },
      )
    } catch {
      setErro('Não foi possível ler essa imagem.')
    }
  }

  function remover() {
    setErro(null)
    atualizar.mutate(
      { name: user.name, email: user.email, avatarUrl: null },
      { onError: (err) => setErro(mensagemDeErro(err)) },
    )
  }

  return (
    <section aria-labelledby="titulo-avatar" className={SECAO}>
      <h2 id="titulo-avatar" className="mb-4 text-lg font-semibold">
        Foto de perfil
      </h2>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={`Foto de ${user.name}`} className="size-24 rounded-full object-cover" />
        ) : (
          <div
            role="img"
            aria-label={`Sem foto. Iniciais de ${user.name}`}
            className="grid size-24 place-items-center rounded-full bg-secondary text-2xl font-bold"
          >
            {iniciais(user.name)}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id="avatar-arquivo"
              type="file"
              accept={TIPOS_AVATAR.join(',')}
              onChange={(e) => void aoEscolher(e)}
              className="sr-only"
            />
            <Button type="button" disabled={atualizar.isPending} onClick={() => inputRef.current?.click()}>
              {atualizar.isPending ? 'Salvando...' : user.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
            </Button>
            {user.avatarUrl && (
              <Button type="button" variant="outline" disabled={atualizar.isPending} onClick={remover}>
                Remover foto
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">PNG, JPG ou WebP, até 5 MB.</p>
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function SecaoDados({ user }: { user: User }) {
  const atualizar = useUpdateProfile()
  const [nome, setNome] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  const alterado = nome.trim() !== user.name || email.trim().toLowerCase() !== user.email

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    setSalvo(false)
    setGeral(null)
    const e: Record<string, string> = {}
    if (nome.trim().length < 2) e.name = 'Informe seu nome.'
    if (!EMAIL.test(email.trim())) e.email = 'Informe um e-mail válido.'
    setErros(e)
    if (Object.keys(e).length) return

    atualizar.mutate(
      { name: nome, email },
      {
        onSuccess: () => setSalvo(true),
        onError: (err) => {
          const campos = errosDosCampos(err)
          setErros(campos)
          if (!Object.keys(campos).length) setGeral(mensagemDeErro(err))
        },
      },
    )
  }

  return (
    <section aria-labelledby="titulo-dados" className={SECAO}>
      <h2 id="titulo-dados" className="mb-4 text-lg font-semibold">
        Dados pessoais
      </h2>
      <form onSubmit={enviar} noValidate className="grid gap-4 sm:max-w-md">
        <Campo id="perfil-nome" label="Nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.name} />
        <Campo id="perfil-email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} erro={erros.email} />
        {geral && (
          <p role="alert" className="text-sm text-destructive">
            {geral}
          </p>
        )}
        {salvo && !alterado && (
          <p role="status" className="text-sm text-primary">
            Dados salvos.
          </p>
        )}
        <div>
          <Button type="submit" disabled={atualizar.isPending || !alterado}>
            {atualizar.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function SecaoSenha() {
  const trocar = useChangePassword()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    setSalvo(false)
    setGeral(null)
    const e: Record<string, string> = {}
    if (!atual) e.currentPassword = 'Informe a senha atual.'
    if (nova.length < 8) e.newPassword = 'A nova senha precisa ter pelo menos 8 caracteres.'
    else if (nova === atual) e.newPassword = 'A nova senha deve ser diferente da atual.'
    if (confirma !== nova) e.confirm = 'As senhas não conferem.'
    setErros(e)
    if (Object.keys(e).length) return

    trocar.mutate(
      { currentPassword: atual, newPassword: nova },
      {
        onSuccess: () => {
          setAtual('')
          setNova('')
          setConfirma('')
          setErros({})
          setSalvo(true)
        },
        onError: (err) => {
          const campos = errosDosCampos(err)
          setErros(campos)
          if (!Object.keys(campos).length) setGeral(mensagemDeErro(err))
        },
      },
    )
  }

  return (
    <section aria-labelledby="titulo-senha" className={SECAO}>
      <h2 id="titulo-senha" className="mb-4 text-lg font-semibold">
        Alterar senha
      </h2>
      <form onSubmit={enviar} noValidate className="grid gap-4 sm:max-w-md">
        <Campo id="senha-atual" label="Senha atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} erro={erros.currentPassword} />
        <Campo id="senha-nova" label="Nova senha" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} erro={erros.newPassword} />
        <Campo id="senha-confirma" label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} erro={erros.confirm} />
        {geral && (
          <p role="alert" className="text-sm text-destructive">
            {geral}
          </p>
        )}
        {salvo && (
          <p role="status" className="text-sm text-primary">
            Senha alterada. Suas outras sessões foram encerradas.
          </p>
        )}
        <div>
          <Button type="submit" disabled={trocar.isPending}>
            {trocar.isPending ? 'Salvando...' : 'Alterar senha'}
          </Button>
        </div>
      </form>
    </section>
  )
}