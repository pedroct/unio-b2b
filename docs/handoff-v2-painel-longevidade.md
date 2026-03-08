# Handoff — Painel de Longevidade V2

**Data:** 2026-03-07
**Responsável frontend:** UNIO Performance OS (Replit)
**Objetivo:** Documentar o contrato de dados esperado pelo frontend V2 para que o backend valide e implemente os endpoints correspondentes.

---

## 1. Visão Geral das Mudanças V1 → V2

| Aspecto | V1 | V2 |
|---|---|---|
| **Pilares ativos** | Apenas `cardiovascular` | Qualquer pilar pode ser `ativo: true` |
| **Componentes do score** | Fixos: `hrv`, `fcr`, `vo2`, `recuperacao` | Dinâmicos: `Record<string, ComponenteScore>`, chaves variam por pilar |
| **Gráfico de tendência** | Linha única (cardiovascular) | Multi-linha: cardiovascular, metabólico, recuperação |
| **Prefixo de rotas** | `/api/painel-longevidade/` | Aceita `/api/longevidade/` **e** `/api/painel-longevidade/` (aliases) |
| **Perfil do profissional** | Não retornado no login | Login retorna `nome`, `tipo_profissional`, `registro_profissional` na raiz do JSON |

---

## 2. Endpoints Consumidos pelo Frontend

### 2.1. `GET /api/painel-longevidade/clientes/:id/cockpit`

**Alias aceito:** `/api/longevidade/clientes/:id/cockpit`

**Response esperada:**

```json
{
  "cliente_id": 3,
  "scores": [
    {
      "tipo": "cardiovascular",
      "ativo": true,
      "score": 83.19,
      "classificacao": "good",
      "is_partial": false,
      "mensagem_bloqueio": null,
      "tendencia": "estavel",
      "tendencia_score": "estavel",
      "delta_30d": -1.2,
      "componentes": {
        "hrv": { "valor": 18.1, "unidade": "ms", "tendencia": "subindo", "referencia": "Ref: 20-60ms" },
        "fcr": { "valor": 60, "unidade": "bpm", "tendencia": "estavel", "referencia": "Ref: 50-70bpm" },
        "vo2": { "valor": 37.57, "unidade": "mL/kg/min", "tendencia": "estavel", "referencia": null },
        "recuperacao": { "valor": 68, "unidade": "bpm", "tendencia": "estavel", "referencia": "Média das últimas 5 sessões" }
      }
    },
    {
      "tipo": "metabolic",
      "ativo": true,
      "score": 71.5,
      "classificacao": "good",
      "is_partial": false,
      "mensagem_bloqueio": null,
      "tendencia": "subindo",
      "tendencia_score": "subindo",
      "delta_30d": 2.3,
      "componentes": {
        "gordura": { "valor": 18.5, "unidade": "%", "tendencia": "descendo", "referencia": "Ref: 10-20%" },
        "cintura": { "valor": 82, "unidade": "cm", "tendencia": "estavel", "referencia": null },
        "massa_magra": { "valor": 68.2, "unidade": "kg", "tendencia": "subindo", "referencia": null },
        "tendencia_peso": { "valor": -0.3, "unidade": "kg", "tendencia": "descendo", "referencia": "Últimos 30 dias" }
      }
    },
    {
      "tipo": "recovery",
      "ativo": true,
      "score": 65.0,
      "classificacao": "good",
      "is_partial": true,
      "mensagem_bloqueio": null,
      "tendencia": "estavel",
      "tendencia_score": "estavel",
      "delta_30d": 0.5,
      "componentes": {
        "sono_total": { "valor": 420, "unidade": "min", "tendencia": "subindo", "referencia": "Ref: 420-480min" },
        "sono_rem_profundo": { "valor": 180, "unidade": "min", "tendencia": "estavel", "referencia": null },
        "hrv_noturna": { "valor": 45.2, "unidade": "ms", "tendencia": "subindo", "referencia": null },
        "fc_noturna": { "valor": 54, "unidade": "bpm", "tendencia": "estavel", "referencia": "Média noturna" }
      }
    },
    {
      "tipo": "functional",
      "ativo": false,
      "score": null,
      "classificacao": null,
      "is_partial": false,
      "mensagem_bloqueio": "Score Funcional estará disponível em breve.",
      "tendencia": null,
      "tendencia_score": null,
      "delta_30d": null,
      "componentes": null
    }
  ],
  "data_atualizacao": "2026-03-07T14:27:38.241565+00:00"
}
```

#### Tipos TypeScript (contrato no frontend):

```typescript
interface ComponenteScore {
  valor: number | null;
  unidade: string;
  tendencia: string | null;    // "estavel" | "subindo" | "descendo" (PT-BR lowercase)
  referencia: string | null;
}

type ComponentesCockpit = Record<string, ComponenteScore | null>;

interface ScorePilar {
  tipo: string;                    // "cardiovascular" | "metabolic" | "recovery" | "functional"
  ativo: boolean;
  score: number | null;
  classificacao: string | null;    // EN: "excellent" | "good" | "attention" | "risk" — ou PT-BR: "bom" etc.
  is_partial: boolean;
  mensagem_bloqueio: string | null;
  tendencia?: string | null;       // fallback (V1 compat)
  tendencia_score?: string | null; // preferido pelo frontend
  delta_30d?: number | null;
  componentes?: ComponentesCockpit | null;
}

interface RespostaCockpit {
  cliente_id: number | string;
  scores: ScorePilar[];
  data_atualizacao: string;       // ISO 8601
}
```

#### Regras de leitura no frontend:

| Campo | Comportamento |
|---|---|
| `ativo` | Se `true` → renderiza CardScore ativo com score/classificação. Se `false` → card bloqueado com "Me avise". Se **ausente/undefined** → tratado como `true` (backward compat). |
| `tendencia_score` vs `tendencia` | Frontend usa `tendencia_score` primeiro; se ausente, faz fallback para `tendencia`. |
| `classificacao` | Aceita EN lowercase (`"good"`) ou PT-BR (`"bom"`, `"Bom"`). Frontend normaliza para EN via lookup interno. |
| `tendencia` (string) | Aceita `"estavel"`, `"subindo"`, `"descendo"` (PT-BR). Frontend normaliza via `TENDENCIA_FROM_API`. |
| `componentes` | Se presente e não-vazio → frontend exibe grade de biomarcadores inline (sem fetch adicional). Se ausente → faz fallback para endpoint `/cardiometabolico` (apenas para cardiovascular). |

---

### 2.2. Chaves de `componentes` por pilar

O frontend espera as seguintes chaves no objeto `componentes` de cada pilar:

#### Cardiovascular (`tipo: "cardiovascular"`)
| Chave | Nome exibido | Unidade default | Semântica invertida |
|---|---|---|---|
| `hrv` | HRV (RMSSD) | ms | Não |
| `fcr` | FC de Repouso | bpm | **Sim** (menor = melhor) |
| `vo2` | VO₂ Máximo | mL/kg/min | Não |
| `recuperacao` | Recuperação da FC | bpm | Não |

#### Metabólico (`tipo: "metabolic"`)
| Chave | Nome exibido | Unidade default | Semântica invertida |
|---|---|---|---|
| `gordura` | % Gordura Corporal | % | Não |
| `cintura` | Cintura | cm | Não |
| `massa_magra` | Massa Magra | kg | Não |
| `tendencia_peso` | Tendência Peso | kg | **Sim** (negativo = melhor) |

#### Recuperação (`tipo: "recovery"`)
| Chave | Nome exibido | Unidade default | Semântica invertida |
|---|---|---|---|
| `sono_total` | Sono Total | min | Não |
| `sono_rem_profundo` | REM + Profundo | min | Não |
| `hrv_noturna` | HRV Noturna | ms | Não |
| `fc_noturna` | FC Noturna | bpm | **Sim** (menor = melhor) |

#### Funcional (`tipo: "functional"`)
Ainda sem config de componentes no frontend. Quando ativado, será necessário definir as chaves.

> **Nota:** Se o backend enviar chaves não listadas acima, o frontend as ignora silenciosamente. Se enviar chaves a menos, os cards correspondentes aparecem com "—" e status "Aguardando leitura".

---

### 2.3. `GET /api/painel-longevidade/clientes/:id/cardiometabolico`

**Alias aceito:** `/api/longevidade/clientes/:id/cardiometabolico`

**Uso:** Fallback — só chamado quando o cockpit cardiovascular **não** contém `componentes`.

**Response (sem alterações V2):**

```json
{
  "cliente_id": 3,
  "metricas_cardio": [
    { "metric_type": "hrv_rmssd", "valor_atual": 18.1, "unidade": "ms", "media_30d": 2.5, "tendencia": "subindo", "data_ultima_leitura": "..." },
    { "metric_type": "resting_hr", "valor_atual": 60, "unidade": "bpm", "media_30d": 62.9, "tendencia": "estavel", "data_ultima_leitura": "..." },
    { "metric_type": "vo2_max", "valor_atual": 37.57, "unidade": "mL/kg/min", "media_30d": 38.34, "tendencia": "estavel", "data_ultima_leitura": "..." },
    { "metric_type": "hr_recovery_1min", "valor_atual": 68, "unidade": "bpm", "media_30d": 101.3, "tendencia": "estavel", "data_ultima_leitura": "..." }
  ],
  "secao_metabolica_bloqueada": true,
  "mensagem_bloqueio_metabolico": "A análise metabólica completa e composição corporal estarão disponíveis em breve."
}
```

---

### 2.4. `GET /api/painel-longevidade/clientes/:id/historico-scores`

**Alias aceito:** `/api/longevidade/clientes/:id/historico-scores`

**Query params:**
- `?intervalo=30d|90d|365d` (frontend envia) — proxy converte para `?dias=30|90|365` para o staging
- `?dias=30|90|365` (aceito diretamente, backward compat)

**Response esperada (V2 — multi-pilar):**

```json
{
  "cliente_id": 3,
  "historico": [
    { "data": "2026-02-05", "cardiovascular": 83.32, "metabolico": 72.1, "recuperacao": 65.0, "funcional": null },
    { "data": "2026-02-06", "cardiovascular": 82.72, "metabolico": 71.8, "recuperacao": 64.5, "funcional": null },
    { "data": "2026-02-07", "cardiovascular": 83.78, "metabolico": null,  "recuperacao": 66.2, "funcional": null }
  ]
}
```

#### Tipo TypeScript:

```typescript
interface PontoHistoricoScore {
  data: string;                    // "YYYY-MM-DD"
  cardiovascular: number | null;
  metabolico: number | null;
  recuperacao: number | null;
  funcional: number | null;
}
```

#### Nota sobre o backend (hotfix 2026-03-08):

O campo de filtragem foi corrigido de `calculated_at` (data de execução do motor) para `period_end` (data clínica do score). Após backfill retroativo, dados desde dezembro/2025 estão disponíveis. Os três filtros (30d, 90d, 365d) agora retornam quantidades distintas de dados reais.

#### Comportamento do gráfico:
- Plota uma linha por pilar que tenha **pelo menos um valor não-nulo** na série
- Cores: cardiovascular = `#4A5899` (indigo), metabólico = `#5B8C6F` (verde), recuperação = `#3D7A8C` (azul)
- Legenda aparece quando **mais de uma linha** está visível
- Tooltip mostra todos os valores do ponto na data hover
- `null` cria gap na linha (sem interpolação)
- **Formatação adaptativa do eixo X:** 30d → `DD/MM`, 90d → `DD Mon` (ex: "05 Fev"), 365d → `Mon AA` (ex: "Dez 25")
- **Agregação semanal para 365d:** Quando há mais de 60 pontos diários, dados são agrupados por semana ISO com média dos valores por pilar, reduzindo ~120 pontos para ~17 semanas
- **Ticks adaptativos:** ~7 ticks para 30d, ~6 para 90d, ~12 para 365d

---

### 2.5. `POST /api/painel-longevidade/interesse`

**Alias aceito:** `/api/longevidade/interesse`

**Request body:**

```json
{ "componente": "score_metabolico" }
```

Valores enviados pelo frontend:
- `"score_metabolico"` (pilar `metabolic`)
- `"score_recuperacao"` (pilar `recovery`)
- `"score_funcional"` (pilar `functional`)

**Response esperada:** `204 No Content`

---

### 2.6. `POST /api/nucleo/profissional-auth` *(atualizado — hotfix staging)*

O endpoint de login foi atualizado pelo DevOps para incluir dados do profissional na raiz da resposta.

**Response (200 OK):**

```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci...",
  "nome": "Dr. Nome Completo",
  "tipo_profissional": "medico",
  "registro_profissional": "CRM7683"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `access` | `string` | JWT de acesso |
| `refresh` | `string` | JWT de refresh |
| `nome` | `string` | Nome completo do profissional (exibido na sidebar) |
| `tipo_profissional` | `string` | `"medico"` \| `"personal"` \| `"nutricionista"` |
| `registro_profissional` | `string` | Registro completo (ex: `"CRM7683"`) |

**Mapeamento no frontend:**

| Campo staging | Campo frontend (`Professional`) |
|---|---|
| `nome` | `name` |
| `tipo_profissional` | `tipoProfissional` + `specialty` (label traduzido: `"medico"` → `"Médico(a)"`, `"personal"` → `"Personal Trainer"`, `"nutricionista"` → `"Nutricionista"`) |
| `registro_profissional` | `registrationNumber` |

> **Nota:** O endpoint `GET /api/nucleo/profissional/me` **não** é mais necessário. Todo dado de perfil vem embutido na resposta de login.

---

## 3. Normalização de Campos no Proxy

O proxy BFF (Node/Express) faz as seguintes normalizações antes de enviar ao staging:

| Campo | Normalização |
|---|---|
| `registro_profissional` | Remove letras/prefixos: `"CRM7683"` → `"7683"` |
| `uf_registro` | Força uppercase: `"rj"` → `"RJ"` |
| `cpf` | Remove máscara: `"123.456.789-00"` → `"12345678900"` |
| `?intervalo=30d` | Converte para `?dias=30` no staging |

---

## 4. Classificação e Tendência — Tabela de Mapeamento

### Classificação (score → faixa)

| Score | Classificação (EN) | Label (PT-BR) |
|---|---|---|
| ≥ 80 | `"excellent"` | Excelente |
| ≥ 60 | `"good"` | Bom |
| ≥ 40 | `"attention"` | Atenção |
| < 40 | `"risk"` | Risco Aumentado |

**O backend pode enviar em EN (`"good"`) ou PT-BR (`"bom"`, `"Bom"`). O frontend normaliza ambos.**

### Tendência

| Valor do backend | Mapeamento no frontend |
|---|---|
| `"estavel"` | `"stable"` |
| `"subindo"` | `"up"` |
| `"descendo"` | `"down"` |

---

## 5. Comportamento de Backward Compatibility

O frontend V2 é **totalmente retrocompatível** com o staging V1 atual:

1. **`ativo` ausente:** Tratado como `true` — cardiovascular continua renderizando normalmente.
2. **`componentes` ausente no cockpit:** Frontend faz fallback para `GET .../cardiometabolico` para montar a grade de biomarcadores cardiovasculares.
3. **`tendencia_score` ausente:** Usa `tendencia` como fallback.
4. **Histórico com `metabolico`/`recuperacao`/`funcional` todos `null`:** Gráfico plota apenas a linha cardiovascular (comportamento V1).
5. **Rota `/api/painel-longevidade/`:** Continua funcionando (alias para `/api/longevidade/`).

---

## 6. Checklist para Validação do Backend

- [ ] **Cockpit multi-pilar:** Endpoint `/cockpit` retorna array `scores` com todos os pilares, cada um com `tipo`, `ativo`, `score`, `classificacao`, `componentes`
- [ ] **Componentes dinâmicos:** Cada pilar ativo inclui `componentes` com as chaves esperadas (ver seção 2.2)
- [ ] **Campo `ativo`:** `true` para pilares com dados, `false` para bloqueados
- [ ] **Campo `tendencia_score`:** Presente em cada `ScorePilar` (ou continuar enviando `tendencia` como fallback)
- [ ] **Histórico multi-pilar:** Endpoint `/historico-scores` retorna `metabolico` e `recuperacao` preenchidos quando disponíveis
- [ ] **Interesse:** Endpoint `/interesse` aceita `"score_metabolico"`, `"score_recuperacao"`, `"score_funcional"`
- [x] **Login com perfil profissional:** `POST /api/nucleo/profissional-auth` retorna `nome`, `tipo_profissional`, `registro_profissional` na raiz do JSON (hotfix staging aplicado)
- [ ] **Alias de rotas (opcional):** Aceitar prefixo `/api/longevidade/` além de `/api/painel-longevidade/`

---

## 7. Arquivos Alterados no Frontend (referência)

| Arquivo | Mudança |
|---|---|
| `shared/schema.ts` | `ComponentesCockpit` → `Record<string, ComponenteScore \| null>`; `PontoHistoricoScore` com 4 pilares |
| `server/routes.ts` | Aliases `/api/longevidade/*`; proxy `?intervalo→?dias`; login extrai `nome`/`tipo_profissional` da resposta staging |
| `client/src/components/longevidade/aba-cockpit.tsx` | Cockpit dinâmico multi-pilar; `COMPONENTES_POR_PILAR` config; fallback cardio |
| `client/src/components/longevidade/card-score.tsx` | Prop `pilarTipo` → título/ícone dinâmicos |
| `client/src/components/longevidade/card-biomarcador.tsx` | `GradeGenerica` substituiu `GradeBiomarcadores`; aceita `BiomarcadorItem[]` genérico |
| `client/src/components/longevidade/grafico-tendencia-score.tsx` | Multi-linha (3 pilares); legenda condicional; tooltip multi-valor |
| `client/src/components/app-sidebar.tsx` | Exibe nome real e tipo profissional do login |
| `client/src/lib/auth.tsx` | Simplificado — perfil vem direto do login, sem fetch separado |
| `shared/schema.ts` | `Professional` inclui campo `tipoProfissional` |
