# UNIO Performance OS

Plataforma web B2B para profissionais de saúde acompanharem clientes com dados fisiológicos consolidados, scores de longevidade e prescrição alimentar.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Roteamento | wouter (SPA) |
| UI | shadcn/ui + Tailwind CSS |
| Gráficos | Recharts |
| Data fetching | TanStack Query v5 |
| Backend | Node.js + Express + TypeScript (`tsx`) |
| ORM / Schema | Drizzle ORM + Zod (`drizzle-zod`) |
| Banco de dados | PostgreSQL (Replit) |
| Auth | JWT Bearer — renovação automática via refresh token |
| Observabilidade | Sentry (`@sentry/react`) |
| Fontes | Plus Jakarta Sans (scores/display) · Inter (corpo) |

---

## Estrutura do projeto

```
├── client/
│   └── src/
│       ├── components/
│       │   └── longevidade/       # Painel de Longevidade V3.1
│       │       ├── aba-cockpit.tsx
│       │       ├── aba-cardiometabolico.tsx
│       │       ├── aba-recuperacao-sono.tsx
│       │       ├── aba-performance-funcional.tsx
│       │       ├── aba-nutricao.tsx
│       │       ├── card-score.tsx
│       │       ├── card-biomarcador.tsx
│       │       └── grafico-tendencia-score.tsx
│       ├── pages/
│       │   ├── login.tsx
│       │   ├── client-list.tsx
│       │   └── patient-dashboard.tsx
│       └── index.css              # Design tokens globais e do módulo
├── server/
│   ├── index.ts
│   ├── routes.ts                  # Proxy para staging.unio.tec.br
│   └── storage.ts
└── shared/
    └── schema.ts                  # Tipos, schemas Zod e tokens compartilhados
```

---

## Autenticação

Login via **Registro Profissional + UF** como usuário e **CPF** como senha.

```
POST /api/auth/pair
Body: { registro_profissional, uf_registro, cpf }
```

O token JWT é armazenado em `localStorage` sob a chave `unio_auth` no formato `{ tokens: { access, refresh } }`. O refresh é feito automaticamente pelo interceptor do Express quando o token de acesso expira.

---

## Funcionalidades principais

### Painel de Longevidade V3.1 — `/clientes/:id/dashboard`

5 abas com análise fisiológica completa:

| Aba | Conteúdo |
|-----|----------|
| **Cockpit** | 4 scores consolidados (0–100), grade de 16 biomarcadores, gráfico de tendência multi-linha |
| **Cardiometabólico** | HRV, FC de repouso, VO₂ máximo, Recuperação da FC, composição corporal |
| **Recuperação & Sono** | Sono total, sono REM, sono profundo, HRV noturna, FC noturna |
| **Performance & Funcionalidade** | Volume de treino, velocidade de caminhada, estabilidade, força, zonas de FC, tabela de exercícios |
| **Nutrição** | Aderência calórica, distribuição de macros, proteína relativa, séries 30d, correlações |

### Scores de 0–100

| Faixa | Classificação | Cor |
|-------|--------------|-----|
| 80–100 | Excelente | Verde `#4CA785` |
| 60–79 | Bom | Deep Indigo `#4A5899` |
| 40–59 | Atenção | Dourado `#D9A441` |
| 0–39 | Risco aumentado | Terracota `#D97952` |

Cada score tem cor de accent bar própria no cockpit:

| Score | Cor |
|-------|-----|
| Cardiovascular | `#4A5899` |
| Metabólico | `#AD8C48` |
| Recuperação | `#3D7A8C` |
| Funcional | `#648D4A` |

### Inversão semântica de tendência

Biomarcadores onde o decréscimo é clinicamente positivo usam `invertedSemantics: true`:

- FC de repouso, FC noturna, Gordura corporal, Cintura

---

## Endpoints de API

Todos os endpoints do Painel de Longevidade são proxiados para `staging.unio.tec.br` com o Bearer token do profissional.

```
GET  /api/painel-longevidade/clientes/:id/cockpit
GET  /api/painel-longevidade/clientes/:id/cardiometabolico
GET  /api/painel-longevidade/clientes/:id/recuperacao-sono
GET  /api/painel-longevidade/clientes/:id/performance-funcional?intervalo=7d|30d|90d
GET  /api/painel-longevidade/clientes/:id/historico-scores?intervalo=30d|90d|365d
GET  /api/painel-longevidade/clientes/:id/nutricao?periodo=7
POST /api/painel-longevidade/interesse

GET  /api/profissional/clientes
GET  /api/profissional/pacientes/:id

POST /api/auth/pair
POST /api/auth/refresh
```

---

## Design tokens

Definidos em `client/src/index.css`. Os principais grupos:

```css
--sys-bg-primary / secondary      /* Fundos */
--sys-text-primary / secondary / muted
--sys-border-light
--sys-success / warning / danger

--mod-longevidade-base             /* #4A5899 Deep Indigo */
--mod-longevidade-text / border / bg

--score-excellent-* / good-* / attention-* / risk-*
```

---

## Rodando localmente

```bash
npm install
npm run dev
```

O servidor sobe na porta `5000` (Express + Vite em conjunto). Acesse `http://localhost:5000`.

As credenciais de acesso são as mesmas do ambiente de staging UNIO (Registro Profissional + UF + CPF).

---

## Convenção de terminologia

| Contexto | Termo usado |
|----------|-------------|
| UI (telas, botões, labels) | **Cliente(s)** |
| Backend, API, variáveis internas | `paciente` / `pacienteId` |
