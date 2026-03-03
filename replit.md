# UNIO Performance OS — Painel Web B2B

## Overview
Plataforma web para profissionais de saúde (médicos, nutricionistas, personal trainers) acompanharem seus clientes. Centraliza o Painel de Longevidade (scores fisiológicos e biomarcadores) e ferramentas de Nutrição (prescrição alimentar, catálogo de alimentos).

## Terminologia
- **Frontend (textos visíveis):** usa "Cliente(s)" em telas estruturais (listagem, sidebar, filtros, botões, empty states)
- **Telas clínicas/operacionais:** usa o nome da pessoa ou linguagem técnica neutra (sem "cliente" nem "paciente")
- **Backend / API / variáveis internas:** mantém "paciente" nas rotas e queryKeys (compatibilidade com Django backend)

## Architecture
- **Frontend:** React (Vite) + TypeScript + Shadcn/ui + Tailwind CSS + Recharts
- **Backend:** Express.js servindo mock API (simula Django Ninja API)
- **Routing:** wouter (frontend SPA routing)
- **State Management:** TanStack Query (React Query)
- **Auth:** JWT mock (Registro Profissional + UF / CPF)

## Design System
- Paleta verde/terra baseada nos Design Tokens UNIO v2.0
- Fontes: Playfair Display (display/títulos), Inter (body)
- Cores por módulo: Nutrição (#5B8C6F), Treino (#D97952), Biometria (#3D7A8C), Hidratação (#6BA3BE), Longevidade (#4A5899)
- Design Tokens Longevidade: `--mod-longevidade-*` (Deep Indigo), `--score-*` (4 faixas: excellent/good/attention/risk)
- Design Tokens Globais: `--sys-bg-primary/secondary`, `--sys-border-light`, `--sys-text-primary/secondary/muted`, `--sys-shadow-sm/md`, `--sys-success`
- CSS Classes: `.section-label-longevidade` (uppercase via CSS), `.axis-sublabel` (eixo fisiológico), `.badge-status-ativo` (verde semântico)
- Dark mode dinâmico via classe CSS (tokens longevidade e sys têm variantes dark)

## Structure
```
client/src/
  App.tsx                 - Root component with routing and auth
  lib/auth.tsx           - Auth context provider (JWT)
  lib/formatters.ts      - Shared formatters: formatFoodName, formatNutrient, formatUnit, formatHorario
  lib/api-normalizers.ts - Normalização de responses do backend (TBCA, planos, refeições, alimentos)
  components/
    app-sidebar.tsx      - Main navigation sidebar (Clientes, Dashboard, Prescrição Alimentar, Configurações)
    theme-toggle.tsx     - Dark mode toggle
    empty-state.tsx      - Reusable empty state component
    longevidade/
      aba-cockpit.tsx              - Cockpit: Score Cardiovascular + 3 scores futuros + biomarcadores + tendência
      aba-cardiometabolico.tsx     - Sistema Cardiometabólico: 4 biomarcadores CV + seção metabólica (bloqueada)
      card-score.tsx               - Card principal do score (0–100, badge classificação, delta, atualização)
      card-biomarcador.tsx         - Mini-card biomarcador + GradeBiomarcadores (grid 4col responsivo)
      grafico-tendencia-score.tsx  - Gráfico AreaChart (Recharts) tendência 30d/90d
      aba-trancada.tsx             - Estado bloqueado para abas futuras (cadeado + mensagem contextual)
      estado-dia-zero.tsx          - Onboarding dia zero (checklist + progresso)
    dashboard/
      overview-tab.tsx          - (legado) Patient overview
      nutrition-tab.tsx         - (legado) Nutrition data
      biometry-tab.tsx          - (legado) Body composition
      training-tab.tsx          - (legado) Training sessions
      sheet-plano-alimentar.tsx - Sheet lateral read-only do plano alimentar (via CTA Nutrição)
      aba-plano-alimentar.tsx   - Prescrição: edição de plano alimentar com refeições e nutrientes
      modal-dias-semana.tsx     - Modal para editar dias ativos do plano alimentar
      modal-nova-refeicao.tsx   - Modal para adicionar nova refeição ao plano alimentar
      modal-adicionar-alimento.tsx - Modal para buscar, selecionar e adicionar alimento à refeição
  pages/
    login.tsx                  - Login page (Registro + UF / CPF)
    patients.tsx               - Lista de clientes com tabs (Ativos/Todos/Inativos), filtros, ordenação, tags, período
    patient-dashboard.tsx      - Painel de Longevidade: 5 abas (Cockpit, Cardiometabólico, Recuperação & Sono 🔒, Performance 🔒, Nutrição 🔒)
    patient-settings.tsx       - Configuração de metas individuais
    prescricao-alimentar.tsx        - Prescrição Alimentar page (edição para paciente específico)
    prescricao-alimentar-lista.tsx  - Lista de clientes para selecionar e prescrever plano alimentar

server/
  routes.ts             - Mock API endpoints
  storage.ts            - In-memory mock data storage

shared/
  schema.ts             - TypeScript types and Zod schemas
```

## Key Concepts
- **Painel de Longevidade (V1)**: substitui o dashboard antigo de 4 abas comportamentais. Organizado por sistemas fisiológicos com 5 abas: Cockpit, Sistema Cardiometabólico, Recuperação & Sono (🔒), Performance (🔒), Nutrição (🔒).
- **Score Cardiovascular (V1 ativo)**: score 0–100 com classificação dinâmica (Excelente ≥80 / Bom ≥60 / Atenção ≥40 / Risco Aumentado <40). Composto por HRV, FCR, VO₂ e Recuperação FC. Score nunca calculado no frontend.
- **Inversão semântica de tendência**: FCR (↓=positivo, ↑=negativo) — prop `invertedSemantics` no CardBiomarcador controla cor da tendência.
- **Scores futuros**: Metabólico, Recuperação, Funcional — visíveis como cards bloqueados com tokens `--sys-*` (não `--mod-longevidade-*`).
- **Design tokens por faixa**: `--score-excellent-*`, `--score-good-*`, `--score-attention-*`, `--score-risk-*` determinados dinamicamente pelo valor. Gráfico exibe faixas coloridas de fundo (ReferenceArea).
- **Decisão de UI**: "Performance" como label da tab; "Performance & Funcionalidade" como título interno da aba.
- **Aba Cardiometabólico (análise)**: diferenciada do Cockpit (resumo) com sparklines de 30 dias em cada card de biomarcador, grid 2×2 por eixo fisiológico (Controle Autonômico: HRV + FCR; Capacidade Aeróbia: VO₂ + Recuperação), e copy expandida (P75 · idade/sexo no VO₂).
- **Decisões de design**: Avatar = global (--sys-primary, não muda por módulo); Email truncado por padrão (privacidade clínica); Badge "Ativo" usa --sys-success (#4CA785); "Metas" removido da V1 (planejado para V2); Títulos de empty states usam --font-sans (Inter) weight 600 (Playfair reservado para scores numéricos).
- **Regra de tokens no Longevidade**: Elementos de identidade do módulo (score, ícones, nomes de biomarcadores, linhas de gráfico, sparklines, bordas de cards ativos) usam exclusivamente `--mod-longevidade-*` (Deep Indigo #4A5899). Verde do sistema (`--sys-primary`) reservado para navegação, avatar e chrome global.
- **Cards bloqueados Metabólico**: % Gordura corporal, Circunferência abdominal, Tendência de peso, Glicemia (CGM). Botão "Me avise quando disponível" por seção.
- **Múltiplos planos por paciente**: cada cliente pode ter vários planos alimentares. Cada plano tem ID, descrição editável, dias ativos e refeições próprias.
- **Prescrição Alimentar (Edição)**: página completa no sidebar (restrita a Nutricionista). Permite selecionar plano via dropdown, editar descrição inline, editar refeições e dias ativos.

## API Endpoints

### Painel de Longevidade (contrato real — doc integração v1)
- GET /api/painel-longevidade/clientes/:id/cockpit — Retorna `RespostaCockpit` { cliente_id, scores: ScorePilar[], data_atualizacao }. Cada score tem: tipo, ativo, score, classificacao (PT-BR: "Bom"), is_partial, mensagem_bloqueio, tendencia
- GET /api/painel-longevidade/clientes/:id/cardiometabolico — Retorna `RespostaCardiometabolico` { metricas_cardio: MetricaCardio[], secao_metabolica_bloqueada, mensagem_bloqueio }. Métricas: metric_type (vo2_max, hrv_rmssd, resting_hr, hr_recovery_1min), valor_atual, unidade, media_30d, tendencia, data_ultima_leitura. Valores podem ser null (ex: hr_recovery_1min)
- GET /api/painel-longevidade/clientes/:id/tendencia-score?periodo=30d|90d|365d — Tendência do score (MOCK — sem correspondente na doc real ainda)
- POST /api/auth/refresh — Refresh JWT token { refresh } → { access, refresh }

### Classificação PT-BR → EN
Backend retorna classificação como texto PT-BR. Frontend converte via `CLASSIFICACAO_FROM_LABEL`: "Excelente"→excellent, "Bom"→good, "Atenção"→attention, "Risco Aumentado"→risk

### Auth: JWT Bearer
Todas as requisições enviam `Authorization: Bearer {token}`. Token lido de localStorage `unio_auth`. Em 401, tenta refresh silencioso antes de redirecionar para login.

### Sparklines
Backend NÃO fornece séries temporais por métrica. Campo `_sparkline_mock` (prefixo _ = não é do contrato real) gerado no mock para desenvolvimento. Componente SparklineMini pronto para quando a API evoluir.

### Null handling
`valor_atual === null` → card mostra "—" + "Aguardando leitura" (não zero gráfico). Tratado via prop `aguardandoLeitura` no CardBiomarcador.

### Erros HTTP
- 401: refresh silencioso → redirect to login
- 403: componente ErroAcessoPaciente "Você não possui acesso clínico autorizado a este paciente."
- 404: componente ErroAcessoPaciente "Cliente não encontrado"

### Outros (mock/legacy)
- POST /api/auth/pair — Login
- GET /api/profissional/pacientes — List patients
- GET /api/profissional/pacientes/:id — Patient details
- GET/PUT /api/profissional/pacientes/:id/metas — Patient goals
- GET /api/profissional/dashboard/pacientes/:id/overview — Overview
- GET /api/profissional/dashboard/pacientes/:id/nutricao — Nutrition
- GET /api/profissional/dashboard/pacientes/:id/biometria — Biometry
- GET /api/profissional/dashboard/pacientes/:id/treinamento — Training
- GET /api/profissional/dashboard/pacientes/:id/planos-alimentares — List all plans
- GET /api/profissional/dashboard/pacientes/:id/plano-alimentar?planoId&diaSemana — Plan detail
- PUT /api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/dias — Update active days
- PUT /api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/descricao — Update description
- POST /api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/refeicoes — Create meal
- GET /api/nutricao/catalogo/alimentos?busca&fontes&limite&offset — Search foods from catalog (proxied to staging, paginated response `{ items, total, limite, offset }`)
- GET /api/nutricao/catalogo/alimentos/:id — Food detail with nutrients (proxied to staging)
- GET /api/nutricao/catalogo/alimentos/codigo/:codigo — Search food by code (proxied to staging)
- POST /api/nutricao/catalogo/calcular — Calculate nutrients for quantity (proxied to staging)
- GET /api/nutricao/catalogo/fontes — List available food sources with counts (proxied to staging)
- GET /api/nutricao/catalogo/grupos — List food groups (proxied to staging)
- GET /api/nutricao/catalogo/tipos — List food types (proxied to staging)
- GET /api/nutricao/catalogo/nutrientes — List available nutrients (proxied to staging)

## Cliente App Base (New Repl Package)
A self-contained project scaffold for the UNIO client area lives in `cliente-app-base/`.
It contains all files needed to bootstrap a new Repl: design system (index.css, shadcn components, theme toggle), auth (email+password), sidebar, login page, home page with module cards, mock server, and clean package.json (no DB/passport deps). See `cliente-app-base/README.md` for setup instructions.

## Staging API Integration
The nutrition module endpoints are proxied through Express to the real backend at staging.unio.tec.br.
Authentication is handled server-side using env vars STAGING_API_URL, STAGING_EMAIL, STAGING_PASSWORD.
The proxy module is in `server/staging-proxy.ts` — it manages JWT token caching and renewal.
Available food sources: TBCA, TACO, IBGE, USDA. Planned future sources: Suplementos, Meus alimentos (shown as "Em breve" in UI).
The `fontes` parameter accepts comma-separated values for multi-source filtering (e.g. `fontes=TBCA,TACO`).
