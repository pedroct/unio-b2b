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
    app-sidebar.tsx      - Main navigation sidebar
    theme-toggle.tsx     - Dark mode toggle
    empty-state.tsx      - Reusable empty state component
    dashboard/
      overview-tab.tsx          - Patient overview with insights & charts
      nutrition-tab.tsx         - Nutrition data, macros, food diary
      biometry-tab.tsx          - Body composition evolution charts
      training-tab.tsx          - Training sessions, volume, RPE
      aba-plano-alimentar.tsx   - Plano alimentar com refeições e nutrientes
  pages/
    login.tsx            - Login page (Registro + UF / CPF)
    patients.tsx         - Patient list with adherence status
    patient-dashboard.tsx - Patient dashboard with 5 tabs
    patient-settings.tsx  - Patient goals configuration

server/
  routes.ts             - Mock API endpoints
  storage.ts            - In-memory mock data storage

shared/
  schema.ts             - TypeScript types and Zod schemas
```

## API Endpoints (Mock)
- POST /api/auth/pair — Login
- GET /api/profissional/pacientes — List patients
- GET /api/profissional/pacientes/:id — Patient details
- GET/PUT /api/profissional/pacientes/:id/metas — Patient goals
- GET /api/profissional/dashboard/pacientes/:id/overview — Overview
- GET /api/profissional/dashboard/pacientes/:id/nutricao — Nutrition
- GET /api/profissional/dashboard/pacientes/:id/biometria — Biometry
- GET /api/profissional/dashboard/pacientes/:id/treinamento — Training
- GET /api/profissional/dashboard/pacientes/:id/plano-alimentar?diaSemana=segunda — Meal Plan
