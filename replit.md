# UNIO Performance OS — Painel Web B2B

## Overview
Plataforma web para profissionais de saúde (médicos, nutricionistas, personal trainers) acompanharem seus clientes. Centraliza dados de Nutrição, Treino, Biometria e Hidratação em um único dashboard.

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
- Cores por módulo: Nutrição (#5B8C6F), Treino (#D97952), Biometria (#3D7A8C), Hidratação (#6BA3BE)
- Dark mode dinâmico via classe CSS

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
    dashboard/
      overview-tab.tsx          - Patient overview with insights & charts
      nutrition-tab.tsx         - Nutrition data, macros, food diary + CTA para ver plano alimentar
      biometry-tab.tsx          - Body composition evolution charts
      training-tab.tsx          - Training sessions, volume, RPE
      sheet-plano-alimentar.tsx - Sheet lateral read-only do plano alimentar (via CTA Nutrição)
      aba-plano-alimentar.tsx   - Prescrição: edição de plano alimentar com refeições e nutrientes
      modal-dias-semana.tsx     - Modal para editar dias ativos do plano alimentar
      modal-nova-refeicao.tsx   - Modal para adicionar nova refeição ao plano alimentar
      modal-adicionar-alimento.tsx - Modal para buscar, selecionar e adicionar alimento à refeição
  pages/
    login.tsx                  - Login page (Registro + UF / CPF)
    patients.tsx               - Lista de clientes com tabs (Ativos/Todos/Inativos), filtros, ordenação, tags, período
    patient-dashboard.tsx      - Dashboard individual com 4 tabs (Visão Geral, Nutrição, Biometria, Treinamento)
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
- **Múltiplos planos por paciente**: cada cliente pode ter vários planos alimentares (ex: um para dias de semana, outro para fim de semana). Cada plano tem ID, descrição editável, dias ativos e refeições próprias.
- **Plano Alimentar (Visualização)**: read-only Sheet lateral acessada via CTA "Ver Plano Alimentar" na aba Nutrição. Mostra todos os planos ativos em tabs separadas.
- **Prescrição Alimentar (Edição)**: página completa no sidebar (restrita a Nutricionista). Permite selecionar plano via dropdown, editar descrição inline, editar refeições e dias ativos.
- O dashboard individual tem 4 abas: Visão Geral, Nutrição, Biometria, Treinamento.

## API Endpoints (Mock)
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

## Staging API Integration
The nutrition module endpoints are proxied through Express to the real backend at staging.unio.tec.br.
Authentication is handled server-side using env vars STAGING_API_URL, STAGING_EMAIL, STAGING_PASSWORD.
The proxy module is in `server/staging-proxy.ts` — it manages JWT token caching and renewal.
Available food sources: TBCA, TACO, IBGE, USDA. Planned future sources: Suplementos, Meus alimentos (shown as "Em breve" in UI).
The `fontes` parameter accepts comma-separated values for multi-source filtering (e.g. `fontes=TBCA,TACO`).
