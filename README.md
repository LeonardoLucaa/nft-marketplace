# Kurio — NFT Marketplace

Desafio técnico de Frontend da **Jungle Gaming**: marketplace de NFTs "Kurio" em React + TypeScript, fiel ao Figma em desktop e mobile, com API REST e tempo real simulados no navegador via MSW.

- **Deploy:** https://nft-marketplace-omega-three.vercel.app
- Desafio: https://github.com/junglegaming/frontend-challenge
- Autor: Leonardo Luca — [@LeonardoLucaa](https://github.com/LeonardoLucaa)

---

## Stack

| Área | Tecnologia |
| --- | --- |
| UI | React 19, TypeScript 6, Vite 8 |
| Estilo | Tailwind CSS 4, shadcn/ui (Radix) |
| Roteamento | TanStack Router (file-based, `routeTree.gen.ts`) |
| Dados | TanStack Query + Axios (REST) |
| Tempo real | Socket.IO client |
| Mocks | MSW 2 + `@mswjs/socket.io-binding` |
| Validação | zod |
| Testes | Playwright (E2E, desktop e mobile) |
| Deploy | Vercel (SPA rewrite em `vercel.json`) |

---

## Como rodar

Pré-requisitos: **Node 20+** e npm.

```bash
git clone https://github.com/LeonardoLucaa/nft-marketplace.git
cd nft-marketplace
npm install
npm run dev
```

Acesse http://localhost:5173.

O arquivo `.env` com `VITE_USE_MOCKS=true` já está versionado: a API e o Socket.IO são simulados pelo MSW, sem backend.

### Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Apenas checagem de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes Playwright (faz o build e sobe o preview sozinho) |

---

## Dados de teste

| Item | Valor |
| --- | --- |
| Usuário 1 | `ana@kurio.dev` / `Senha@123` |
| Usuário 2 | `bruno@kurio.dev` / `Senha@123` |
| Cupons | `KURIO10` (10%), `BEMVINDO5` (5%) |

Para pagar é preciso ter uma carteira conectada: cadastre uma em **/carteiras** antes do checkout.

O banco simulado fica no `localStorage` (chaves `kurio-msw-db-v4` e `kurio-msw-wallets-v1`). Para voltar ao estado inicial, rode `__mock.reset()` no console ou limpe o `localStorage` do site.

---

## Telas

| Tela | Rota |
| --- | --- |
| Início (catálogo com filtros, busca, ordenação e paginação na URL) | `/` |
| Detalhe do NFT | `/nft/$id` (ex.: `/nft/nft-042`) |
| Carrinho | `/carrinho` |
| Pagamento (revisão, cupom e carteira) | `/checkout` |
| Comprovante (processando → confirmado/falhou) | `/pedido/$id` |
| Login | `/login` |
| Cadastro | `/cadastro` |
| Perfil | `/perfil` |
| Carteiras | `/carteiras` |

`/checkout`, `/pedido/$id`, `/perfil` e `/carteiras` são protegidas: sem sessão, redirecionam para `/login?redirect=<rota>` e voltam para a rota após o login.

---

## Arquitetura

```
src/
├── components/   # UI compartilhada (shadcn/ui, header, footer)
├── features/     # Módulos por domínio: auth, cart, checkout, nfts, profile, realtime, wallets
├── lib/          # api (axios), session, socket, eth (toWei/fromWei), utils
├── mocks/        # MSW: handlers REST por domínio, socket, db simulado, fixtures
├── routes/       # Rotas file-based do TanStack Router
└── types/        # Contratos da API (api.ts)
e2e/              # Testes Playwright
```

- **Estado de servidor** fica no TanStack Query. Não há store global para dados da API.
- **Parâmetros de busca** (filtros, página, ordenação, `redirect`) são tipados e validados no router. O filtro sobrevive a recarregar e a compartilhar o link.
- **Contratos** em `src/types/api.ts` são a fonte única de tipos entre UI e mocks.

---

## Política de cache e retry

| Dado | staleTime | Retry | Observação |
| --- | --- | --- | --- |
| Padrão (todas as queries) | 30 s | 3 (padrão do Query) | `QueryClient` em `src/router.ts` |
| Lista de NFTs | 30 s | padrão | `keepPreviousData`: a lista anterior fica na tela ao trocar filtro/página. O loader da rota faz prefetch. |
| Detalhe do NFT | 30 s | até 2, **nunca em 404** | 404 mostra "não encontrado" na hora |
| Sessão | 5 min | sem retry | 401 não deve ser repetido |
| Perfil | 60 s | padrão | |
| Carteiras | 30 s | padrão | |
| Cotação do checkout | 60 s (gcTime 30 s) | **sem retry**, sem refetch no foco | Cotação tem TTL no servidor; erro de cotação gera uma nova cotação, não uma repetição |
| Pedido | — | até 2, nunca em 404 | Polling enquanto `processing`: 5 s com socket conectado, 1 s sem socket |

- **Axios:** `baseURL /api`, timeout de 10 s.
- **Mutations não têm retry automático.** A criação de pedido usa `Idempotency-Key`, então reenviar o mesmo pedido não duplica a compra.
- **Tempo real atualiza o cache em vez de refazer tudo:** `nft.updated` aplica preço e estoque direto no detalhe e nas listas, e invalida carrinho e cotação (o servidor recalcula totais).
- **Após reconexão do socket**, as queries ativas (`nfts`, `cart`, `order`) são invalidadas: a REST volta a ser a fonte da verdade.

---

## Decisões técnicas

### Valores em ETH como string decimal
Preços trafegam como string (`"1.19"`), nunca como `number`. Somas e comparações usam wei com `bigint` (`toWei`/`fromWei` em `src/lib/eth.ts`), sem erros de ponto flutuante.

### Pedidos idempotentes e cotação
O checkout cria uma cotação (quote) com TTL. A criação do pedido envia `Idempotency-Key`: repetir com a mesma chave devolve o mesmo pedido. Se o preço mudar ou a cotação expirar, a API responde `QUOTE_OUTDATED`/`QUOTE_EXPIRED` e a UI pede uma nova cotação antes de confirmar.

### Tempo real
Socket.IO simulado com `@mswjs/socket.io-binding`. Conecta só com sessão ativa e desconecta no logout ou na troca de usuário.

| Evento | Uso |
| --- | --- |
| `nft.updated` | Atualiza preço e estoque no cache |
| `order.updated` | Atualiza o status do pedido (`processing` → `confirmed`/`failed`) |

- Eventos de NFT com `updatedAt` menor ou igual ao último aplicado são descartados (duplicados e fora de ordem).
- Estados terminais do pedido (`confirmed`, `failed`) nunca regridem.
- Reconexão automática com backoff de até 5 s.

### Carrinho de visitante
Visitantes têm carrinho próprio. No login, ele é mesclado ao do usuário, respeitando o estoque de cada edição.

### Sessão
Um 401 em requisição autenticada limpa o token e dispara `session:expired`. O app redireciona para `/login?expired=true&redirect=<rota>`, mostra o aviso e, após o login, volta à rota de origem.

---

## Cenários de falha

| Cenário | Comportamento | Como simular |
| --- | --- | --- |
| Erro de rede ou servidor ao listar NFTs | Mensagem "Não foi possível carregar os NFTs" com botão **Tentar novamente** | DevTools → Network → Offline |
| Resposta não-JSON (ex.: service worker do MSW parado e o servidor devolvendo `index.html`) | O interceptor do Axios rejeita com `ERR_BAD_RESPONSE`; a tela mostra erro com retry em vez de quebrar | — |
| NFT inexistente | Tela de "não encontrado", sem retry | `/nft/nao-existe` |
| Sessão expirada | Redireciona ao login com aviso e volta à rota de origem | `__mock.expirarSessao()` e abrir `/carrinho` |
| Preço muda durante o checkout | O ticker simulado altera preços a cada 10 s; a cotação fica desatualizada e a UI pede nova cotação | Esperar o ticker ou `__mock.alterarPreco('nft-042', '2.5')` |
| Cotação expirada (TTL de 5 min) | Ao confirmar, a API responde 409 `QUOTE_EXPIRED` e a UI busca uma nova cotação | Esperar 5 min na tela de checkout |
| Pedido falha no processamento | Comprovante mostra estado de falha; o carrinho é mantido | `__mock.falharProximoPedido()` antes de confirmar |
| Falha ao conectar carteira | Erro na tela de carteiras com nova tentativa | `__mock.falharProximaConexao()` |
| Clique duplo em "Confirmar compra" | Mesma `Idempotency-Key`: um único pedido | — |
| Socket desconectado | Pedido continua por polling (1 s); ao reconectar, o cache é reconciliado com a REST | DevTools → Network → Offline e voltar |

Todos os atalhos ficam em `window.__mock` (console do navegador): `reset`, `expirarSessao`, `falharProximoPedido`, `falharProximaConexao`, `alterarPreco`, `pausarTicker`, `retomarTicker`.

---

## Testes E2E

```bash
npx playwright install chromium   # só na primeira vez
npm run test:e2e
```

O Playwright faz o build de produção, sobe o `vite preview` na porta 4173 e roda cada cenário em **desktop (1440×900)** e **mobile (Pixel 7)**: 7 cenários, 14 testes. O ticker de preços é pausado em cada teste para o resultado ser determinístico.

| Arquivo | Cenário |
| --- | --- |
| `e2e/catalogo.spec.ts` | Filtrar por coleção e abrir o detalhe (gaveta de filtros no mobile) |
| `e2e/catalogo.spec.ts` | Filtro na URL sobrevive ao recarregar |
| `e2e/compra.spec.ts` | Visitante: detalhe → carrinho → login → checkout com cupom → comprovante confirmado → carrinho vazio |
| `e2e/compra.spec.ts` | Cupom inválido mostra erro no campo e não altera o total |
| `e2e/auth.spec.ts` | Rota protegida redireciona ao login e volta depois de entrar |
| `e2e/auth.spec.ts` | Senha errada mostra erro e mantém na página |
| `e2e/auth.spec.ts` | Sessão expirada leva ao login com aviso e retorna à rota de origem |

Resultado local: **14 passed**.

---

## Lighthouse

Medido no deploy de produção, perfil Mobile.

| Categoria | Resultado |
| --- | --- |
| Performance | 95 |
| Acessibilidade | 100 |
| Boas práticas | 100 |
| SEO | 83 |

---

## Deploy

Vercel, preset Vite. O `vercel.json` define:

- rewrite de todas as rotas para `index.html` (acesso direto a `/nft/nft-042`, `/perfil` etc. funciona);
- cache imutável de 1 ano em `/assets/*` (arquivos com hash);
- `no-cache` e `Service-Worker-Allowed: /` em `/mockServiceWorker.js`, para o MSW sempre usar a versão atual.

---

## Limitações e próximos passos

- Toda a API e o Socket.IO são simulados no navegador. Com `VITE_USE_MOCKS=false`, o app espera uma API real nas mesmas rotas (`/api/*`).
- Os dados ficam no `localStorage` de cada navegador: não há persistência entre dispositivos.
- Carteiras são simuladas (endereço informado pelo usuário), sem integração com MetaMask/WalletConnect.
- Se o navegador encerrar o service worker do MSW após muito tempo ocioso, a próxima requisição mostra erro com **Tentar novamente**; recarregar a página reativa os mocks.
- Próximos passos: testes de regressão visual, testes unitários dos utilitários de wei e do merge de carrinho, e uma API real.