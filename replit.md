# UNIO Performance OS — Painel Web B2B

## Overview
Plataforma web para profissionais de saúde (médicos, nutricionistas, personal trainers) acompanharem seus pacientes. Centraliza dados de Nutrição, Treino, Biometria e Hidratação em um único dashboard.

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
  components/
    app-sidebar.tsx      - Main navigation sidebar (Pacientes, Dashboard, Prescrição Alimentar, Configurações)
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
  pages/
    login.tsx                  - Login page (Registro + UF / CPF)
    patients.tsx               - Patient list with tabs (Ativos/Todos/Inativos), filtros, ordenação, tags
    patient-dashboard.tsx      - Patient dashboard with 4 tabs (Visão Geral, Nutrição, Biometria, Treinamento)
    patient-settings.tsx       - Patient goals configuration
    prescricao-alimentar.tsx        - Prescrição Alimentar page (edição para paciente específico)
    prescricao-alimentar-lista.tsx  - Lista de pacientes para selecionar e prescrever plano alimentar

server/
  routes.ts             - Mock API endpoints
  storage.ts            - In-memory mock data storage

shared/
  schema.ts             - TypeScript types and Zod schemas
```

## Key Concepts
- **Múltiplos planos por paciente**: cada paciente pode ter vários planos alimentares (ex: um para dias de semana, outro para fim de semana). Cada plano tem ID, descrição editável, dias ativos e refeições próprias.
- **Plano Alimentar (Visualização)**: read-only Sheet lateral acessada via CTA "Ver Plano Alimentar" na aba Nutrição. Mostra todos os planos ativos em tabs separadas.
- **Prescrição Alimentar (Edição)**: página completa no sidebar (restrita a Nutricionista). Permite selecionar plano via dropdown, editar descrição inline, editar refeições e dias ativos.
- O dashboard do paciente tem 4 abas: Visão Geral, Nutrição, Biometria, Treinamento.

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
