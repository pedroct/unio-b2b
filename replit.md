# UNIO Performance OS — Painel Web B2B

## Overview
A plataforma web UNIO Performance OS é projetada para profissionais de saúde (médicos, nutricionistas, personal trainers) gerenciarem e acompanharem seus clientes. O objetivo principal é centralizar o Painel de Longevidade, que oferece scores fisiológicos e biomarcadores, e ferramentas de Nutrição, incluindo prescrição alimentar e um catálogo abrangente de alimentos.

A visão é capacitar profissionais de saúde com uma ferramenta integrada para otimizar o acompanhamento de saúde de seus clientes, promovendo longevidade e bem-estar através de dados e intervenções personalizadas.

## User Preferences
Eu prefiro que a terminologia do frontend utilize "Cliente(s)" para telas estruturais (listagem, sidebar, filtros, botões, empty states) e o nome da pessoa ou linguagem técnica neutra para telas clínicas/operacionais. No backend, API e variáveis internas, pode-se manter "paciente" para compatibilidade.

## System Architecture
### Frontend
- **Framework:** React (Vite)
- **Linguagem:** TypeScript
- **UI Framework:** Shadcn/ui
- **Estilização:** Tailwind CSS
- **Gráficos:** Recharts
- **Roteamento:** wouter (SPA)
- **Gerenciamento de Estado:** TanStack Query (React Query)
- **Autenticação:** Mock de JWT (Registro Profissional + UF / CPF)

### Backend
- **Mock API:** Express.js (simula Django Ninja API)

### Design System
- **Paleta de Cores:** Baseada nos Design Tokens UNIO v2.0 (verde/terra). Cores específicas por módulo: Nutrição (#5B8C6F), Treino (#D97952), Biometria (#3D7A8C), Hidratação (#6BA3BE), Longevidade (#4A5899).
- **Fontes:** Playfair Display (títulos), Inter (corpo).
- **Design Tokens Longevidade:** `--mod-longevidade-*` (Deep Indigo), `--score-*` (para 4 faixas: excellent/good/attention/risk).
- **Design Tokens Globais:** `--sys-bg-primary/secondary`, `--sys-border-light`, `--sys-text-primary/secondary/muted`, `--sys-shadow-sm/md`, `--sys-success`.
- **Modo Escuro:** Implementado dinamicamente via classe CSS.

### Key Features
- **Painel de Longevidade (V1):** Substitui o dashboard antigo, organizado por sistemas fisiológicos com 5 abas: Cockpit, Sistema Cardiometabólico, Recuperação & Sono (🔒), Performance (🔒), Nutrição (🔒).
- **Score Cardiovascular (V1):** Score de 0–100 com classificação dinâmica (Excelente ≥80 / Bom ≥60 / Atenção ≥40 / Risco Aumentado <40), composto por HRV, FCR, VO₂ e Recuperação FC.
- **Inversão Semântica de Tendência:** Controlada para biomarcadores onde o decréscimo é positivo (ex: FCR).
- **Scores Futuros:** Metabólico, Recuperação, Funcional (cards bloqueados com tokens `--sys-*`).
- **Aba Cardiometabólico:** Análise detalhada com sparklines de 30 dias, grid 2x2 por eixo fisiológico e cópia expandida.
- **Prescrição Alimentar:** Ferramenta completa para nutricionistas com múltiplos planos por cliente, edição de descrição, dias ativos, refeições e adição de alimentos de um catálogo.

## External Dependencies
- **API Real de Staging:** `staging.unio.tec.br` para o módulo de Nutrição e autenticação.
- **Catálogo de Alimentos:** Integrado via proxy com o backend real para busca e detalhes de alimentos, cálculo de nutrientes.
- **Fontes de Dados de Alimentos:** TBCA, TACO, IBGE, USDA (com planos para Suplementos e "Meus alimentos").
- **Auth:** JWT Bearer para autenticação e refresh de tokens.