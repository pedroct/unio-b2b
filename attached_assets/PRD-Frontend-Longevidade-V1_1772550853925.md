# 📘 PRD Técnico Frontend --- Módulo Longevidade

## Pilar 1 --- Saúde Cardiovascular e Recuperação (V1)

Versão: 1.0\
Data de geração: 2026-03-03

------------------------------------------------------------------------

## 1. Objetivo

Implementar a interface do Pilar Cardiovascular e Recuperação do Painel
de Longevidade em React. O frontend deve consumir os endpoints do
backend (Django + Ninja), inicialmente podendo operar com mock.

Biomarcadores da V1: - HRV (RMSSD) - Frequência Cardíaca de Repouso
(FCR) - VO₂ Máximo - Recuperação da FC (1 minuto)

------------------------------------------------------------------------

## 2. Escopo da V1

### Incluído

-   Card principal com Score Cardiovascular (0--100)
-   Classificação dinâmica por faixa
-   Tendência mensal
-   Mini-cards dos 4 biomarcadores
-   Gráfico 30d / 90d
-   Estado de dados insuficientes
-   Onboarding Dia Zero

### Fora do escopo

-   CGM
-   Sono
-   Machine Learning
-   Correlações avançadas

------------------------------------------------------------------------

## 3. Endpoints Esperados

### GET /cardiovascular-score

``` json
{
  "score": 84,
  "classification": "good",
  "delta_30d": -3,
  "updated_at": "2026-03-03T08:00:00Z",
  "components": {
    "hrv": { "value": 42, "unit": "ms", "trend": "up", "baseline": 38 },
    "rhr": { "value": 58, "unit": "bpm", "trend": "down", "baseline": 62 },
    "vo2": { "value": 46, "unit": "ml/kg/min", "trend": "stable" },
    "recovery": { "value": 24, "unit": "bpm", "trend": "up" }
  }
}
```

### GET /cardiovascular-score/trend?range=90d

``` json
{
  "range": "90d",
  "data": [
    { "date": "2026-01-01", "score": 78 },
    { "date": "2026-01-02", "score": 79 }
  ]
}
```

------------------------------------------------------------------------

## 4. Estrutura de Componentes

    LongevidadePage
     ├── ScoreCard
     ├── BiomarkerGrid
     │     ├── BiomarkerCard (HRV)
     │     ├── BiomarkerCard (FCR)
     │     ├── BiomarkerCard (VO2)
     │     └── BiomarkerCard (Recovery)
     ├── ScoreTrendChart
     └── OnboardingZeroState

------------------------------------------------------------------------

## 5. Classificação Dinâmica

  Score     Faixa       Classe CSS
  --------- ----------- ------------------------
  80--100   Excellent   score-badge--excellent
  60--79    Good        score-badge--good
  40--59    Attention   score-badge--attention
  0--39     Risk        score-badge--risk

Nunca hardcode cores. Usar apenas classes.

------------------------------------------------------------------------

## 6. Props BiomarkerCard

``` ts
interface BiomarkerCardProps {
  name: string
  value: number | null
  unit: string
  trend: "up" | "down" | "stable" | null
  baseline?: number
}
```

Se value for null: - Aplicar classe biomarker-card--insufficient -
Exibir "--" - Exibir texto "Dados insuficientes"

------------------------------------------------------------------------

## 7. Regras de Layout

Responsividade: - Desktop: 4 colunas - Tablet: 2 colunas - Mobile: 1
coluna

Não calcular score no frontend. Classificação sempre determinada pelo
valor retornado.

------------------------------------------------------------------------

## 8. Mock Inicial

``` ts
const mockScore = {
  score: 84,
  classification: "good",
  delta_30d: -3,
  updated_at: new Date().toISOString(),
  components: {
    hrv: { value: 42, unit: "ms", trend: "up", baseline: 38 },
    rhr: { value: 58, unit: "bpm", trend: "down", baseline: 62 },
    vo2: { value: 46, unit: "ml/kg/min", trend: "stable" },
    recovery: { value: 24, unit: "bpm", trend: "up" }
  }
}
```

------------------------------------------------------------------------

## 9. Critérios de Aceite

-   Score renderiza corretamente
-   Badge muda conforme valor
-   Mini-cards funcionais
-   Gráfico renderiza 30d / 90d
-   Estado vazio funcional
-   Nenhuma cor hardcoded
-   Layout responsivo validado

------------------------------------------------------------------------

# Entregável Final

Página React:

    /longevidade

Componentes: - ScoreCard - BiomarkerGrid - ScoreTrendChart -
OnboardingZeroState
