# Handoff Backend — UNIO Painel Web B2B

**De:** Frontend (React SPA)
**Para:** Backend (Django Ninja API)
**Data:** 24/02/2026

---

## 1. Resumo

Este documento descreve todos os endpoints REST que o frontend do UNIO consome, incluindo os contratos de request/response em formato JSON. O frontend está 100% funcional usando dados mock. O objetivo é que o backend Django Ninja implemente esses mesmos contratos para que a integração seja direta.

**Autenticação:** Todas as rotas (exceto `/api/auth/pair`) devem exigir o header `Authorization: Bearer <access_token>`.

---

## 2. Autenticação

### `POST /api/auth/pair`

Autentica o profissional e retorna tokens JWT.

**Request Body:**
```json
{
  "registrationNumber": "CRM-12345",
  "uf": "SP",
  "password": "12345678901"
}
```

| Campo              | Tipo   | Obrigatório | Descrição                                      |
|--------------------|--------|-------------|------------------------------------------------|
| registrationNumber | string | Sim         | Número do registro profissional (CRM/CRN/CREF) |
| uf                 | string | Sim         | Estado (UF) — 2 caracteres                     |
| password           | string | Sim         | CPF do profissional (11 dígitos)               |

**Response 200:**
```json
{
  "tokens": {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi..."
  },
  "professional": {
    "id": "uuid",
    "name": "Dr. Rafael Mendes",
    "registrationNumber": "CRM-12345",
    "uf": "SP",
    "specialty": "Médico do Esporte",
    "email": "rafael.mendes@unio.health"
  }
}
```

**Response 400:**
```json
{ "message": "Preencha todos os campos." }
```

**Response 401:**
```json
{ "message": "Credenciais inválidas." }
```

---

## 3. Pacientes

### `GET /api/profissional/pacientes`

Lista todos os pacientes vinculados ao profissional autenticado.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Ana Carolina Silva",
    "email": "ana.silva@email.com",
    "phone": "(11) 98765-4321",
    "birthDate": "1992-03-15",
    "gender": "F",
    "age": 33,
    "avatarUrl": "https://...",
    "adherenceTraining": 85,
    "adherenceDiet": 72,
    "lastActivity": "Há 2 horas",
    "status": "active"
  }
]
```

| Campo             | Tipo    | Descrição                                                |
|-------------------|---------|----------------------------------------------------------|
| id                | string  | UUID do paciente                                         |
| name              | string  | Nome completo                                            |
| email             | string  | E-mail do paciente                                       |
| phone             | string  | Telefone formatado                                       |
| birthDate         | string  | Data de nascimento (ISO 8601: `YYYY-MM-DD`)              |
| gender            | string  | `"M"` ou `"F"`                                           |
| age               | number  | Idade calculada (anos)                                   |
| avatarUrl         | string? | URL do avatar (opcional, nullable)                       |
| adherenceTraining | number  | Aderência ao treino na última semana (0–100)             |
| adherenceDiet     | number  | Aderência à dieta na última semana (0–100)               |
| lastActivity      | string  | Texto humanizado da última atividade (ex: "Há 2 horas") |
| status            | string  | `"active"` ou `"inactive"`                               |

---

### `GET /api/profissional/pacientes/{id}`

Retorna os dados de um paciente específico.

**Response 200:** Mesmo schema de um item do array acima.

**Response 404:**
```json
{ "message": "Paciente não encontrado." }
```

---

## 4. Metas do Paciente

### `GET /api/profissional/pacientes/{id}/metas`

Retorna as metas nutricionais e de hidratação do paciente.

**Response 200:**
```json
{
  "dailyCalories": 1800,
  "protein": 130,
  "carbs": 200,
  "fat": 55,
  "hydration": 2500,
  "hydrationOverride": false
}
```

| Campo             | Tipo    | Descrição                                                   |
|-------------------|---------|-------------------------------------------------------------|
| dailyCalories     | number  | Meta calórica diária (kcal). Range: 500–10000               |
| protein           | number  | Meta de proteína diária (gramas). Range: 0–500              |
| carbs             | number  | Meta de carboidratos diária (gramas). Range: 0–1000         |
| fat               | number  | Meta de gorduras diária (gramas). Range: 0–500              |
| hydration         | number  | Meta de hidratação diária (ml). Range: 500–10000            |
| hydrationOverride | boolean | Se `true`, valor manual; se `false`, calculado pelo peso    |

---

### `PUT /api/profissional/pacientes/{id}/metas`

Atualiza as metas do paciente. O profissional pode sobrescrever o cálculo automático de hidratação.

**Request Body:** Mesmo schema do GET acima.

**Response 200:** Retorna o objeto de metas atualizado (mesmo schema).

---

## 5. Dashboard — Visão Geral (Overview)

### `GET /api/profissional/dashboard/pacientes/{id}/overview`

Retorna o painel consolidado de inteligência do paciente. Esta é a "Single Source of Truth" que cruza dados de todos os módulos.

**Response 200:**
```json
{
  "patient": { /* ... schema Patient */ },
  "goals": { /* ... schema PatientGoals */ },
  "insights": [
    {
      "id": "ins-1",
      "type": "warning",
      "title": "Queda na ingestão de proteína",
      "description": "A média de consumo de proteína nos últimos 5 dias está 22% abaixo da meta.",
      "module": "nutrition"
    },
    {
      "id": "ins-2",
      "type": "success",
      "title": "Aderência ao treino excelente",
      "description": "O paciente completou 4 de 5 sessões programadas esta semana.",
      "module": "training"
    }
  ],
  "weeklySnapshot": {
    "caloriesAvg": 1620,
    "caloriesTarget": 1800,
    "trainingSessions": 4,
    "trainingTarget": 5,
    "hydrationAvg": 2100,
    "hydrationTarget": 2500,
    "weightChange": -0.3
  }
}
```

#### InsightCard

| Campo       | Tipo   | Descrição                                                       |
|-------------|--------|-----------------------------------------------------------------|
| id          | string | Identificador único do insight                                  |
| type        | string | `"warning"`, `"success"` ou `"info"`                            |
| title       | string | Título curto do insight                                         |
| description | string | Descrição detalhada com dados contextuais                       |
| module      | string | `"nutrition"`, `"training"`, `"biometry"` ou `"hydration"`      |

#### WeeklySnapshot

| Campo            | Tipo   | Descrição                                           |
|------------------|--------|-----------------------------------------------------|
| caloriesAvg      | number | Média de calorias consumidas/dia na semana (kcal)   |
| caloriesTarget   | number | Meta calórica diária (kcal)                         |
| trainingSessions | number | Sessões de treino completadas na semana             |
| trainingTarget   | number | Sessões programadas na semana                       |
| hydrationAvg     | number | Média de hidratação/dia na semana (ml)              |
| hydrationTarget  | number | Meta de hidratação diária (ml)                      |
| weightChange     | number | Variação de peso na semana (kg, negativo = perda)   |

> **Nota para o backend:** Os `insights` devem ser gerados pelo motor de inteligência do Django, cruzando dados de nutrição, treino e biometria. O frontend apenas renderiza o que receber. Exemplos de insights esperados:
> - Correlação proteína vs. massa muscular (queda de ingestão → queda de massa)
> - Aderência a treino vs. evolução de composição corporal
> - Hidratação abaixo da meta por X dias consecutivos

---

## 6. Dashboard — Nutrição

### `GET /api/profissional/dashboard/pacientes/{id}/nutricao`

Retorna o resumo nutricional e histórico do diário alimentar.

**Response 200:**
```json
{
  "dailyCalories": 1750,
  "targetCalories": 1800,
  "protein": { "current": 115, "target": 130 },
  "carbs": { "current": 190, "target": 200 },
  "fat": { "current": 52, "target": 55 },
  "adherencePercent": 82,
  "history": [
    {
      "date": "10/02",
      "calories": 1850,
      "protein": 120,
      "carbs": 210,
      "fat": 55
    },
    {
      "date": "11/02",
      "calories": 1700,
      "protein": 105,
      "carbs": 185,
      "fat": 48
    }
  ]
}
```

| Campo           | Tipo            | Descrição                                                  |
|-----------------|-----------------|-------------------------------------------------------------|
| dailyCalories   | number          | Calorias consumidas hoje (kcal)                             |
| targetCalories  | number          | Meta calórica diária (kcal)                                 |
| protein         | MacroNutrient   | `{ current: number, target: number }` em gramas            |
| carbs           | MacroNutrient   | `{ current: number, target: number }` em gramas            |
| fat             | MacroNutrient   | `{ current: number, target: number }` em gramas            |
| adherencePercent| number          | Aderência semanal à dieta (0–100)                           |
| history         | NutritionEntry[]| Últimos 14 dias do diário alimentar                         |

#### NutritionEntry

| Campo    | Tipo   | Descrição                          |
|----------|--------|------------------------------------|
| date     | string | Data formatada (`DD/MM`)           |
| calories | number | Calorias consumidas no dia (kcal)  |
| protein  | number | Proteína consumida no dia (g)      |
| carbs    | number | Carboidratos consumidos no dia (g) |
| fat      | number | Gorduras consumidas no dia (g)     |

---

## 7. Dashboard — Biometria

### `GET /api/profissional/dashboard/pacientes/{id}/biometria`

Retorna a evolução da composição corporal com histórico e tendências.

**Response 200:**
```json
{
  "current": {
    "weight": 77.8,
    "bodyFat": 17.2,
    "muscleMass": 35.6,
    "water": 57.3
  },
  "history": [
    {
      "date": "01/01",
      "weight": 79.0,
      "bodyFat": 18.5,
      "muscleMass": 34.8,
      "water": 56.1
    },
    {
      "date": "08/01",
      "weight": 78.5,
      "bodyFat": 18.1,
      "muscleMass": 35.0,
      "water": 56.5
    }
  ],
  "trends": {
    "weight": "down",
    "bodyFat": "down",
    "muscleMass": "up"
  }
}
```

#### BiometrySnapshot (current)

| Campo      | Tipo   | Descrição                       |
|------------|--------|---------------------------------|
| weight     | number | Peso corporal (kg)              |
| bodyFat    | number | Gordura corporal (%)            |
| muscleMass | number | Massa muscular (kg)             |
| water      | number | Água corporal (%)               |

#### BiometryEntry (history)

| Campo      | Tipo   | Descrição                              |
|------------|--------|----------------------------------------|
| date       | string | Data formatada (`DD/MM`)               |
| weight     | number | Peso na data (kg)                      |
| bodyFat    | number | Gordura corporal na data (%)           |
| muscleMass | number | Massa muscular na data (kg)            |
| water      | number | Água corporal na data (%)              |

> **Nota:** O `history` deve conter capturas semanais (ou conforme disponível). O frontend renderiza gráficos de linha com esses pontos. Recomendado: últimas 12 semanas.

#### Trends

| Campo      | Tipo   | Valores possíveis           | Descrição                                 |
|------------|--------|-----------------------------|-------------------------------------------|
| weight     | string | `"up"`, `"down"`, `"stable"`| Tendência do peso nas últimas 4 semanas   |
| bodyFat    | string | `"up"`, `"down"`, `"stable"`| Tendência de gordura corporal             |
| muscleMass | string | `"up"`, `"down"`, `"stable"`| Tendência de massa muscular               |

---

## 8. Dashboard — Treinamento

### `GET /api/profissional/dashboard/pacientes/{id}/treinamento`

Retorna o resumo de treinamento e lista de sessões executadas.

**Response 200:**
```json
{
  "totalSessions": 12,
  "weeklyAverage": 4.2,
  "adherencePercent": 85,
  "sessions": [
    {
      "id": "uuid",
      "date": "20/02",
      "name": "Treino A - Superior",
      "duration": 55,
      "volumeLoad": 4520,
      "rpe": 7,
      "completed": true,
      "exercises": 6
    },
    {
      "id": "uuid",
      "date": "19/02",
      "name": "Treino B - Inferior",
      "duration": 48,
      "volumeLoad": 5100,
      "rpe": 8,
      "completed": true,
      "exercises": 5
    }
  ]
}
```

| Campo           | Tipo              | Descrição                                       |
|-----------------|-------------------|-------------------------------------------------|
| totalSessions   | number            | Total de sessões no período                     |
| weeklyAverage   | number            | Média de sessões por semana                     |
| adherencePercent| number            | % de sessões completadas vs. programadas (0–100)|
| sessions        | TrainingSession[] | Lista de sessões (últimas 14–21 dias)           |

#### TrainingSession

| Campo      | Tipo    | Descrição                                     |
|------------|---------|-----------------------------------------------|
| id         | string  | UUID da sessão                                |
| date       | string  | Data formatada (`DD/MM`)                      |
| name       | string  | Nome do treino (ex: "Treino A - Superior")    |
| duration   | number  | Duração em minutos                            |
| volumeLoad | number  | Volume de carga total da sessão (kg)          |
| rpe        | number  | PSE / RPE — Percepção Subjetiva de Esforço (1–10) |
| completed  | boolean | Se a sessão foi concluída                     |
| exercises  | number  | Quantidade de exercícios na sessão            |

---

## 9. Padrões de Erro

Todos os endpoints devem seguir o padrão:

```json
{ "message": "Descrição legível do erro." }
```

| Status | Uso                                           |
|--------|-----------------------------------------------|
| 400    | Request body inválido / campos obrigatórios   |
| 401    | Token ausente, expirado ou credenciais erradas|
| 404    | Recurso não encontrado (paciente, dados, etc) |
| 500    | Erro interno do servidor                      |

---

## 10. Considerações para o Backend

1. **O frontend é Presentation Only.** Nenhum cálculo complexo é feito no client. Médias, tendências, insights e consolidações devem vir prontos na response.

2. **Formato de datas:** O frontend espera datas no `history` como `DD/MM` (string formatada). Se preferir enviar ISO 8601, informe que ajustaremos o frontend para formatar.

3. **Insights são livres:** O motor de inteligência do Django pode gerar quantos insights quiser (inclusive zero). O frontend renderiza todos que receber. Respeite o contrato de `type` (`warning | success | info`) e `module` (`nutrition | training | biometry | hydration`) para que as cores e ícones sejam aplicados corretamente.

4. **Hidratação Override:** Quando `hydrationOverride` for `true`, o valor de `hydration` no PUT deve ser persistido literalmente. Quando `false`, o backend calcula com base no peso (ex: peso × 35ml).

5. **Paginação:** O frontend atualmente não implementa paginação. Se o volume de dados crescer (history, sessions), podemos alinhar query params `?limit=X&offset=Y`.

6. **CORS:** O frontend será servido de domínio diferente em produção. Configurar `Access-Control-Allow-Origin` adequadamente no Django.

7. **Campos opcionais no Patient:**
   - `avatarUrl` pode ser `null` — o frontend exibe iniciais do nome como fallback.
   - `lastActivity` é uma string humanizada — pode ser gerada pelo backend ou pelo frontend se receber um timestamp.

---

## 10. Plano Alimentar

### `GET /api/profissional/dashboard/pacientes/{id}/plano-alimentar?diaSemana=segunda`

Retorna o plano alimentar do paciente para o dia da semana selecionado.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Valores |
|-----------|------|-------------|---------|
| `diaSemana` | string | Não (default: "segunda") | `segunda`, `terca`, `quarta`, `quinta`, `sexta`, `sabado`, `domingo` |

**Response (200):**
```json
{
  "id": "plano-p1-segunda",
  "pacienteId": "p1",
  "descricao": "Dieta Hiperproteica (modelo de cardápio importado)",
  "status": "ativo",
  "diaSemana": "segunda",
  "refeicoes": [
    {
      "id": "ref-1",
      "nome": "Desjejum",
      "horario": "07:00",
      "alimentos": [
        { "id": "a1", "nome": "Pão integral", "quantidade": "2 fatias" },
        { "id": "a2", "nome": "Queijo minas frescal", "quantidade": "2 fatias (30g)" }
      ],
      "substitutas": []
    }
  ],
  "nutrientes": {
    "calorias": 2050,
    "proteina": { "gramas": 138, "percentual": 26.9 },
    "carboidrato": { "gramas": 245, "percentual": 47.8 },
    "gordura": { "gramas": 58, "percentual": 25.3 },
    "fibra": 32
  }
}
```

**Campos:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único do plano |
| `pacienteId` | string | ID do paciente |
| `descricao` | string | Descrição/nome do plano |
| `status` | `"ativo"` \| `"rascunho"` | Status do plano |
| `diaSemana` | string | Dia da semana correspondente |
| `refeicoes` | Refeicao[] | Lista de refeições do dia |
| `refeicoes[].id` | string | ID da refeição |
| `refeicoes[].nome` | string | Nome da refeição (Desjejum, Colação, etc.) |
| `refeicoes[].horario` | string | Horário no formato "HH:mm" |
| `refeicoes[].alimentos` | AlimentoPlano[] | Lista de alimentos |
| `refeicoes[].alimentos[].id` | string | ID do alimento |
| `refeicoes[].alimentos[].nome` | string | Nome do alimento |
| `refeicoes[].alimentos[].quantidade` | string | Quantidade descritiva (ex: "Colher De Sopa: 2") |
| `refeicoes[].alimentos[].grupo` | string (opcional) | Grupo alimentar (ex: "Cereais e derivados", "Laticínios") |
| `refeicoes[].substitutas` | Refeicao[] (opcional) | Refeições substitutas |
| `nutrientes.calorias` | number | Total calórico do dia (kcal) |
| `nutrientes.proteina.gramas` | number | Gramas de proteína |
| `nutrientes.proteina.percentual` | number | Percentual de proteína |
| `nutrientes.carboidrato.gramas` | number | Gramas de carboidrato |
| `nutrientes.carboidrato.percentual` | number | Percentual de carboidrato |
| `nutrientes.gordura.gramas` | number | Gramas de gordura |
| `nutrientes.gordura.percentual` | number | Percentual de gordura |
| `nutrientes.fibra` | number | Gramas de fibra |

**Error (404):**
```json
{ "message": "Plano alimentar não encontrado." }
```

---

## 10.1. Atualizar Dias Ativos do Plano Alimentar

### `PUT /api/profissional/dashboard/pacientes/{id}/plano-alimentar/dias`

Atualiza quais dias da semana o plano alimentar está ativo. Se nenhum dia for selecionado, o plano é considerado inativo.

**Request Body:**
```json
{
  "diasAtivos": ["segunda", "terca", "quarta", "quinta", "sexta"]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `diasAtivos` | string[] | Array de dias da semana ativos. Valores possíveis: `segunda`, `terca`, `quarta`, `quinta`, `sexta`, `sabado`, `domingo` |

**Response (200):**
```json
{
  "diasAtivos": ["segunda", "terca", "quarta", "quinta", "sexta"]
}
```

**Error (400):**
```json
{ "message": "diasAtivos deve ser um array." }
```

**Notas:**
- O campo `diasAtivos` também é retornado em `GET /api/.../plano-alimentar` como parte do objeto `PlanoAlimentar`
- O campo `dataCriacao` (string, formato "dd/mm/aaaa") também foi adicionado ao `PlanoAlimentar`
- Se `diasAtivos` for um array vazio, o plano é considerado inativo no frontend

---

## 11. Mapa Visual de Rotas

```
POST /api/auth/pair                                    → Login (JWT)
GET  /api/profissional/pacientes                       → Lista de pacientes
GET  /api/profissional/pacientes/{id}                  → Detalhe do paciente
GET  /api/profissional/pacientes/{id}/metas            → Metas do paciente
PUT  /api/profissional/pacientes/{id}/metas            → Atualizar metas
GET  /api/profissional/dashboard/pacientes/{id}/overview   → Visão Geral
GET  /api/profissional/dashboard/pacientes/{id}/nutricao   → Nutrição
GET  /api/profissional/dashboard/pacientes/{id}/biometria  → Biometria
GET  /api/profissional/dashboard/pacientes/{id}/treinamento    → Treinamento
GET  /api/profissional/dashboard/pacientes/{id}/plano-alimentar → Plano Alimentar
PUT  /api/profissional/dashboard/pacientes/{id}/plano-alimentar/dias → Dias Ativos do Plano
```

---

*Documento gerado a partir do frontend UNIO Performance OS v1.0 — React SPA com Shadcn/ui + Tailwind CSS*
