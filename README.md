# Kurio — NFT Marketplace

Desafio técnico de Frontend da **Jungle Gaming**: marketplace de NFTs "Kurio" em React + TypeScript, fiel ao Figma em desktop e mobile, com API REST e tempo real simulados no navegador via MSW.

- Desafio: https://github.com/junglegaming/frontend-challenge
- Autor: Leonardo Luca — [@LeonardoLucaa](https://github.com/LeonardoLucaa)

---

## Stack

| Área | Tecnologia |
| --- | --- |
| UI | React 19, TypeScript 6, Vite 8 |
| Estilo | Tailwind CSS 4, shadcn/ui (Radix), tw-animate-css |
| Roteamento | TanStack Router (file-based, `routeTree.gen.ts`) |
| Dados | TanStack Query + Axios (REST) |
| Tempo real | Socket.IO client |
| Mocks | MSW 2 + `@mswjs/socket.io-binding` |
| Validação | zod |
| Testes | Playwright (E2E e regressão visual) |
| Qualidade | ESLint, Lighthouse |

---

## Como rodar

Pré-requisitos: **Node 20+** e npm.

```bash
git clone https://github.com/LeonardoLucaa/nft-marketplace.git
cd nft-marketplace
npm install
```

Crie um arquivo `.env` na raiz:

```env
VITE_USE_MOCKS=true
```

Suba o projeto:

```bash
npm run dev
```

Acesse http://localhost:5173.

### Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Apenas checagem de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes Playwright |
| `npm run test:e2e:update` | Atualiza os snapshots visuais |

Na primeira execução do Playwright, instale os navegadores:

```bash
npx playwright install --with-deps chromium
```

---

## Dados de teste

| Item | Valor |
| --- | --- |
| Usuário 1 | `ana@kurio.dev` / `Senha@123` |
| Usuário 2 | `bruno@kurio.dev` / `Senha@123` |
| Cupons | `KURIO10` (10%), `BEMVINDO5` (5%) |

O banco simulado fica salvo no `localStorage` (chave `kurio-msw-db-v2`). Para voltar ao estado inicial, limpe o `localStorage` do site no DevTools.

---

## Telas

| Tela | Rota | Status |
| --- | --- | --- |
| Início (catálogo) | `/` | ✅ |
| Detalhe do NFT | `/nft/$id` | ✅ |
| Carrinho | `/carrinho` | ✅ |
| Pagamento | — | ✅ |
| Confirmação | `/pedido/$id` | ✅ |
| Login | `/login` | ✅ |
| Cadastro | — | ✅ |
| Perfil | `/perfil` | ⏳ |
| Carteiras | `/carteiras` | ⏳ |

---

## Arquitetura

```
src/
├── components/      # UI compartilhada (shadcn/ui, layout: header, footer, wallet badge)
├── features/        # Módulos por domínio (nfts, carrinho, pedidos, auth)
├── lib/             # Utilitários (axios, eth: toWei/fromWei, cn)
├── mocks/           # MSW: handlers REST, socket, db simulado, fixtures
├── routes/          # Rotas file-based do TanStack Router
├── router/          # Instância do router e do queryClient
└── types/           # Contratos da API (api.ts)
```

- **Rotas** são geradas pelo plugin do TanStack Router. Parâmetros de busca (filtros, página, `redirect`) são tipados e validados.
- **Estado de servidor** fica no TanStack Query. Não há store global para dados da API.
- **Contratos** em `src/types/api.ts` são a fonte única de tipos entre UI e mocks.

---

## Decisões técnicas

### Valores em ETH como string decimal
Preços trafegam como string (`"1.19"`), nunca como `number`. Comparações e somas usam conversão para wei com `bigint` (`toWei`/`fromWei` em `@/lib/eth`), o que evita erros de ponto flutuante.

### Pedidos idempotentes
A criação de pedido envia o header `Idempotency-Key`. Uma repetição com a mesma chave devolve o mesmo pedido, sem duplicar. A cotação (quote) tem TTL. Se o preço mudar ou a cotação expirar, a API responde `QUOTE_OUTDATED` e a UI pede uma nova cotação.

### Tempo real
O Socket.IO é simulado com `@mswjs/socket.io-binding`. Eventos:

| Evento | Uso |
| --- | --- |
| `nft.updated` | Atualiza preço e estoque no cache do Query |
| `order.updated` | Atualiza o status do pedido (processing → confirmed/failed) |

Os eventos carregam `id` e `version`. O cliente descarta eventos com versão menor ou igual à que já está no cache, para não aplicar atualizações fora de ordem.

### Carrinho de visitante
Visitantes têm um carrinho próprio. No login, ele é mesclado ao do usuário, respeitando o estoque disponível de cada edição.

### Sessão
A sessão expirada redireciona para `/login?expired=true&redirect=<rota>`. Depois do login, o usuário volta à rota de origem.

### Loading e acessibilidade
- Skeletons com efeito shimmer em listas e detalhes.
- Componentes Radix com navegação por teclado, foco visível e `aria-label` em controles sem texto (ex.: thumbs do slider de preço).
- Contraste conferido sobre a paleta do Figma (`#140D0A`, `#D28A4C`, `#CFB28C`).

---

## Testes

```bash
npm run test:e2e
```

| Cenário | Tipo |
| --- | --- |
| Filtrar catálogo e abrir detalhe | E2E |
| Adicionar ao carrinho → pagamento → confirmação | E2E |
| Login com redirect para rota protegida | E2E |
| Início em 1440px e 390px | Regressão visual |

---

## Lighthouse

| Métrica | Meta | Resultado |
| --- | --- | --- |
| Performance | ≥ 90 | — |
| Acessibilidade | ≥ 95 | — |
| Boas práticas | ≥ 95 | — |
| SEO | ≥ 90 | — |

Medido sobre o build de produção (`npm run build && npm run preview`), em aba anônima.

---

## Limitações e próximos passos

- Itens fora do escopo do desafio aparecem como "em breve" na interface.
- Toda a API é simulada no navegador. Com `VITE_USE_MOCKS=false`, a aplicação espera uma API real nas mesmas rotas.