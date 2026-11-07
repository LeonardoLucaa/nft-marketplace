import { useState, type FormEvent } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { getToken } from '@/lib/session'
import { errosDosCampos, mensagemDeErro } from '@/lib/api'
import { Campo } from '@/components/campo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useConnectWallet,
  useCreateWallet,
  useDeleteWallet,
  useDisconnectWallet,
  useSetPrimaryWallet,
  useUpdateWallet,
  useWallets,
} from '@/features/wallets/queries'
import { NETWORKS, type Network, type Wallet } from '@/types/api'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: ({ location }) => {
    if (!getToken()) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Carteiras,
})

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'
const SECAO = 'rounded-lg border border-border bg-card p-4 sm:p-6'
const MAX_CARTEIRAS = 4
const EVM = /^0x[a-fA-F0-9]{40}$/
const ENDERECO: Record<Network, RegExp> = {
  Ethereum: EVM,
  Polygon: EVM,
  Solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
}
const SELECT =
  'h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30'

const encurtar = (a: string) => (a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a)

function Carteiras() {
  const { data: carteiras, isPending, isError, error, refetch } = useWallets()
  const [formulario, setFormulario] = useState<'nova' | Wallet | null>(null)

  const cheia = (carteiras?.length ?? 0) >= MAX_CARTEIRAS

  return (
    <div className={`${CONTAINER} space-y-6 pb-16 pt-8`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Minhas carteiras</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre uma carteira principal e até {MAX_CARTEIRAS - 1} secundárias. O checkout usa uma carteira conectada.
          </p>
        </div>
        {!formulario && (
          <Button type="button" onClick={() => setFormulario('nova')} disabled={cheia}>
            Adicionar carteira
          </Button>
        )}
      </div>

      {cheia && !formulario && (
        <p className="text-sm text-muted-foreground">Limite de {MAX_CARTEIRAS} carteiras atingido. Remova uma para adicionar outra.</p>
      )}

      {formulario && (
        <FormularioCarteira
          key={formulario === 'nova' ? 'nova' : formulario.id}
          carteira={formulario === 'nova' ? undefined : formulario}
          onFechar={() => setFormulario(null)}
        />
      )}

      {isPending && (
        <div className="space-y-4" aria-busy="true" aria-label="Carregando carteiras">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {isError && (
        <div role="alert" className={`${SECAO} space-y-3`}>
          <p>{mensagemDeErro(error, 'Não foi possível carregar suas carteiras.')}</p>
          <Button type="button" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {carteiras && carteiras.length === 0 && !formulario && (
        <div className={`${SECAO} space-y-2 text-center`}>
          <p className="font-medium">Você ainda não tem carteiras.</p>
          <p className="text-sm text-muted-foreground">Adicione uma para poder finalizar compras.</p>
        </div>
      )}

      {carteiras && carteiras.length > 0 && (
        <ul className="space-y-4">
          {[...carteiras]
            .sort((a, b) => Number(b.primary) - Number(a.primary))
            .map((w) => (
              <CartaoCarteira key={w.id} carteira={w} unica={carteiras.length === 1} onEditar={() => setFormulario(w)} />
            ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground">
        <Link to="/perfil" className="underline">
          Voltar ao perfil
        </Link>
      </p>
    </div>
  )
}

function CartaoCarteira({ carteira: w, unica, onEditar }: { carteira: Wallet; unica: boolean; onEditar: () => void }) {
  const conectar = useConnectWallet()
  const desconectar = useDisconnectWallet()
  const principal = useSetPrimaryWallet()
  const remover = useDeleteWallet()

  // Simula o pop-up da carteira (como o MetaMask) pedindo aprovação.
  const [solicitando, setSolicitando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const ocupada = conectar.isPending || desconectar.isPending || remover.isPending

  function aprovar() {
    setSolicitando(false)
    setAviso(null)
    conectar.mutate(w.id, { onError: (err) => setAviso(mensagemDeErro(err)) })
  }

  function recusar() {
    setSolicitando(false)
    setAviso('Conexão recusada na carteira. Nada foi alterado.')
  }

  return (
    <li className={`${SECAO} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{w.label}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                w.primary ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {w.primary ? 'Principal' : 'Secundária'}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs">{w.network}</span>
          </div>
          <p className="break-all font-mono text-sm text-muted-foreground" title={w.address}>
            <span className="sm:hidden">{encurtar(w.address)}</span>
            <span className="hidden sm:inline">{w.address}</span>
          </p>
        </div>
        <p
          role="status"
          className={`text-sm font-medium ${w.connected ? 'text-green-500' : 'text-muted-foreground'}`}
        >
          {conectar.isPending ? 'Conectando…' : w.connected ? 'Conectada' : 'Desconectada'}
        </p>
      </div>

      {solicitando && (
        <div role="dialog" aria-label="Solicitação de conexão" className="space-y-3 rounded-md border border-primary/40 bg-background p-4">
          <p className="text-sm font-medium">Carteira simulada</p>
          <p className="text-sm text-muted-foreground">
            O Kurio quer se conectar a <strong>{w.label}</strong> ({w.network}). Você aprova?
          </p>
          <div className="flex gap-2">
            <Button type="button" onClick={aprovar}>
              Aprovar
            </Button>
            <Button type="button" variant="outline" onClick={recusar}>
              Recusar
            </Button>
          </div>
        </div>
      )}

      <div role="alert">
        {aviso && <p className="text-sm text-destructive">{aviso}</p>}
        {principal.isError && <p className="text-sm text-destructive">{mensagemDeErro(principal.error)}</p>}
        {desconectar.isError && <p className="text-sm text-destructive">{mensagemDeErro(desconectar.error)}</p>}
        {remover.isError && <p className="text-sm text-destructive">{mensagemDeErro(remover.error)}</p>}
      </div>

      {confirmando ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm">
            Remover <strong>{w.label}</strong>?
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={remover.isPending}
            onClick={() => remover.mutate(w.id, { onSuccess: () => setConfirmando(false) })}
          >
            {remover.isPending ? 'Removendo…' : 'Sim, remover'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConfirmando(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {w.connected ? (
            <Button type="button" variant="outline" disabled={ocupada} onClick={() => desconectar.mutate(w.id)}>
              {desconectar.isPending ? 'Desconectando…' : 'Desconectar'}
            </Button>
          ) : (
            <Button type="button" disabled={ocupada || solicitando} onClick={() => { setAviso(null); setSolicitando(true) }}>
              Conectar
            </Button>
          )}
          {!w.primary && !unica && (
            <Button type="button" variant="outline" disabled={principal.isPending} onClick={() => principal.mutate(w.id)}>
              Tornar principal
            </Button>
          )}
          <Button type="button" variant="outline" disabled={ocupada} onClick={onEditar}>
            Editar
          </Button>
          <Button type="button" variant="destructive" disabled={ocupada} onClick={() => setConfirmando(true)}>
            Remover
          </Button>
        </div>
      )}
    </li>
  )
}

function FormularioCarteira({ carteira, onFechar }: { carteira?: Wallet; onFechar: () => void }) {
  const criar = useCreateWallet()
  const atualizar = useUpdateWallet()
  const mutacao = carteira ? atualizar : criar

  const [label, setLabel] = useState(carteira?.label ?? '')
  const [network, setNetwork] = useState<Network>(carteira?.network ?? 'Ethereum')
  const [address, setAddress] = useState(carteira?.address ?? '')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)

  function enviar(e: FormEvent) {
    e.preventDefault()
    const novo: Record<string, string> = {}
    const nome = label.trim()
    const endereco = address.trim()
    if (nome.length < 2 || nome.length > 30) novo.label = 'Dê um nome de 2 a 30 caracteres.'
    if (!ENDERECO[network].test(endereco)) {
      novo.address =
        network === 'Solana'
          ? 'Endereço Solana inválido (32 a 44 caracteres base58).'
          : 'Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais.'
    }
    setErros(novo)
    setGeral(null)
    if (Object.keys(novo).length) return

    const dados = { label: nome, address: endereco, network }
    const opcoes = {
      onSuccess: onFechar,
      onError: (err: unknown) => {
        const campos = errosDosCampos(err)
        setErros(campos)
        if (!Object.keys(campos).length) setGeral(mensagemDeErro(err))
      },
    }
    if (carteira) atualizar.mutate({ id: carteira.id, ...dados }, opcoes)
    else criar.mutate(dados, opcoes)
  }

  return (
    <section aria-labelledby="titulo-form-carteira" className={SECAO}>
      <h2 id="titulo-form-carteira" className="mb-4 text-lg font-semibold">
        {carteira ? 'Editar carteira' : 'Nova carteira'}
      </h2>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo id="carteira-nome" label="Nome" value={label} onChange={(e) => setLabel(e.target.value)} erro={erros.label} autoComplete="off" />

        <div className="space-y-1">
          <label htmlFor="carteira-rede" className="text-sm font-medium">
            Rede
          </label>
          <select
            id="carteira-rede"
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
            aria-invalid={erros.network ? true : undefined}
            className={SELECT}
          >
            {NETWORKS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {erros.network && <p className="text-sm text-destructive">{erros.network}</p>}
        </div>

        <Campo
          id="carteira-endereco"
          label="Endereço"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          erro={erros.address}
          placeholder={network === 'Solana' ? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' : '0x0000000000000000000000000000000000000000'}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />

        {carteira && (carteira.network !== network || carteira.address !== address.trim()) && carteira.connected && (
          <p className="text-sm text-muted-foreground">Alterar rede ou endereço desconecta a carteira.</p>
        )}
        {geral && (
          <p role="alert" className="text-sm text-destructive">
            {geral}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={mutacao.isPending}>
            {mutacao.isPending ? 'Salvando…' : carteira ? 'Salvar alterações' : 'Adicionar carteira'}
          </Button>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  )
}