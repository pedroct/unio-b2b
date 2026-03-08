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
- **Autenticação:** JWT via staging (Registro Profissional + UF / CPF). Login retorna `nome`, `tipo_profissional`, `registro_profissional` na raiz do JSON.

### Backend
- **Mock API:** Express.js (simula Django Ninja API)

### Design System
- **Paleta de Cores:** Baseada nos Design Tokens UNIO v2.0 (verde/terra). Cores específicas por módulo: Nutrição (#5B8C6F), Treino (#D97952), Biometria (#3D7A8C), Hidratação (#6BA3BE), Longevidade (#4A5899).
- **Fontes:** Playfair Display (títulos), Inter (corpo).
- **Design Tokens Longevidade:** `--mod-longevidade-*` (Deep Indigo), `--score-*` (para 4 faixas: excellent/good/attention/risk).
- **Design Tokens Globais:** `--sys-bg-primary/secondary`, `--sys-border-light`, `--sys-text-primary/secondary/muted`, `--sys-shadow-sm/md`, `--sys-success`.
- **Modo Escuro:** Implementado dinamicamente via classe CSS.

### Key Features
- **Painel de Longevidade (V2):** Substitui o dashboard antigo, organizado por sistemas fisiológicos com 5 abas: Cockpit, Sistema Cardiometabólico, Recuperação & Sono (🔒), Performance (🔒), Nutrição (🔒).
- **Multi-Pilar Cockpit (V2):** Cada pilar (cardiovascular, metabolic, recovery, functional) é renderizado dinamicamente: pilares com `ativo: true` mostram CardScore com score/classificação/tendência + grade de componentes; pilares com `ativo: false` mostram card bloqueado com botão "Me avise".
- **Componentes Dinâmicos por Pilar (V2):** `ComponentesCockpit` é `Record<string, ComponenteScore>` — chaves variam por pilar:
  - Cardiovascular: `hrv`, `fcr`, `vo2`, `recuperacao`
  - Metabólico: `gordura`, `cintura`, `massa_magra`, `tendencia_peso`
  - Recuperação: `sono_total`, `sono_rem_profundo`, `hrv_noturna`, `fc_noturna`
  - Funcional: `velocidade_caminhada`, `forca` (nullable/optional), `volume_treino`, `estabilidade`
- **Score de 0–100:** Classificação dinâmica (Excelente ≥80 / Bom ≥60 / Atenção ≥40 / Risco Aumentado <40), usado por todos os pilares.
- **Inversão Semântica de Tendência:** Controlada para biomarcadores onde o decréscimo é positivo (ex: FCR, fc_noturna, tendencia_peso).
- **Gráfico Multi-Linha (V3):** Tendência do Score plota linhas separadas para cardiovascular (indigo #4A5899), metabólico (green #5B8C6F), recuperação (blue #3D7A8C) e funcional (laranja #D97952). Legenda aparece quando múltiplas linhas estão ativas. Formatação adaptativa do eixo X por período (DD/MM, DD Mon, Mon AA). Agregação semanal automática para 365d quando >60 pontos.
- **Score Funcional (V3):** Ativo quando backend envia `ativo: true`. Componentes: `velocidade_caminhada`, `forca` (opcional — omitido quando `null`), `volume_treino`, `estabilidade`. Quando `score: null`, exibe mensagem de coleta.
- **`GradeGenerica`:** Substitui `GradeBiomarcadores` — aceita array de `BiomarcadorItem` e renderiza cards para qualquer pilar.
- **Aba Cardiometabólico:** Análise detalhada com sparklines de 30 dias, grid 2x2 por eixo fisiológico e cópia expandida.
- **Prescrição Alimentar:** Ferramenta completa para nutricionistas com múltiplos planos por cliente, edição de descrição, dias ativos, refeições e adição de alimentos de um catálogo.

## External Dependencies
- **API Real de Staging:** `staging.unio.tec.br` para o módulo de Nutrição e autenticação.
- **Catálogo de Alimentos:** Integrado via proxy com o backend real para busca e detalhes de alimentos, cálculo de nutrientes.
- **Fontes de Dados de Alimentos:** TBCA, TACO, IBGE, USDA (com planos para Suplementos e "Meus alimentos").
- **Auth:** JWT Bearer para autenticação e refresh de tokens.
- **Sentry:** Observabilidade de erros no frontend via `@sentry/react`. Inicializado em `client/src/main.tsx` com `sendDefaultPii: true`.

## API Endpoints (contrato real — doc integração v2)

### Painel de Longevidade
Ambos os prefixos `/api/painel-longevidade/` e `/api/longevidade/` são aceitos (aliases no proxy).

- `GET /api/longevidade/clientes/:id/cockpit` → `RespostaCockpit` { cliente_id, scores: ScorePilar[], data_atualizacao }.
  - `ScorePilar` inclui: `tipo` (cardiovascular/metabolic/recovery/functional), `ativo` (boolean), `score`, `classificacao`, `is_partial`, `mensagem_bloqueio`, `tendencia_score` (preferido) ou `tendencia` (fallback), `delta_30d`, `componentes: Record<string, ComponenteScore>` (chaves variam por pilar).
  - Se `componentes` presente, cockpit exibe biomarcadores diretamente sem fetch cardiometabólico separado.
  - classificacao: EN ("good") ou PT-BR ("bom"/"Bom"). Normalizado via `CLASSIFICACAO_FROM_LABEL` e `TENDENCIA_FROM_API`.
- `GET /api/longevidade/clientes/:id/cardiometabolico` → `RespostaCardiometabolico` { metricas_cardio, secao_metabolica_bloqueada, mensagem_bloqueio ou mensagem_bloqueio_metabolico }. Fallback para cockpit cardiovascular sem `componentes`.
- `GET /api/longevidade/clientes/:id/historico-scores?intervalo=30d|90d|365d` → `RespostaHistoricoScores`. Frontend usa `?intervalo=`; proxy converte para `?dias=` para staging. Histórico inclui campos `cardiovascular`, `metabolico`, `recuperacao`, `funcional` por data. Gráfico plota linhas para cada pilar com dados não-nulos.
- `POST /api/longevidade/interesse` → { componente: string }. Registra interesse do profissional em módulos inativos. Retorna 204.

### Listagem de Clientes
- `GET /api/profissional/clientes` → array de Patient. Campos: id, name, email, phone, birthDate, gender (F/M/N), age, avatarUrl (string|null), adherenceTraining, adherenceDiet, lastActivity, status. Filtros client-side (busca, status, ordenação).
- `GET /api/profissional/pacientes` → alias para /clientes
- `GET /api/profissional/pacientes/:id` → busca da lista /clientes e filtra por ID

### Auth
- `POST /api/auth/pair` → proxy para `/api/nucleo/profissional-auth` { registro_profissional, uf_registro, cpf }
  - `registro_profissional`: somente dígitos (proxy remove letras/prefixos como "CRM")
  - `uf_registro`: maiúsculas (proxy aplica `.toUpperCase()`)
  - `cpf`: somente dígitos, sem máscara (proxy aplica `.replace(/\D/g, "")`)
  - Resposta staging inclui `nome`, `tipo_profissional`, `registro_profissional` na raiz. Frontend mapeia `tipo_profissional` para label PT-BR (medico→"Médico(a)", personal→"Personal Trainer", nutricionista→"Nutricionista").
- `POST /api/auth/refresh` → proxy para `/api/auth/refresh`
- `stagingPassthrough()` repassa Bearer token do profissional; `stagingFetch()` usa credenciais de serviço
- Endpoint `/api/profissional/me` removido — dados de perfil vêm diretamente do login.

### Nutrição (proxy staging)
- `GET /api/nutricao/catalogo/alimentos?busca&fontes&limite&offset` — Busca alimentos
- `GET /api/nutricao/catalogo/alimentos/:id` — Detalhe do alimento
- `POST /api/nutricao/catalogo/calcular` — Cálculo de nutrientes
- `GET /api/nutricao/catalogo/fontes|grupos|tipos|nutrientes` — Metadados do catálogo