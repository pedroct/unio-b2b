# SPEC Backend — Endpoint: Histórico de Estágios de Sono
**Módulo:** Painel de Longevidade — Aba Recuperação & Sono  
**Solicitante:** Frontend Web B2B (UNIO Performance OS)  
**Data:** 2026-03-24

---

## 1. Objetivo

Criar um novo endpoint que retorne o histórico diário de estágios de sono do cliente,
para renderização de gráfico de barras empilhadas com filtros temporais.

O frontend precisa dos seguintes intervalos:
- **hoje** (`hoje`) — dados da noite mais recente registrada
- **7 dias** (`7d`) — últimos 7 dias
- **30 dias** (`30d`) — últimos 30 dias
- **6 meses** (`180d`) — últimos 180 dias

---

## 2. Endpoint

```
GET /api/painel-longevidade/clientes/{cliente_id}/sono/historico
```

**Método:** `GET`  
**Acesso:** Protegido — requer `Authorization: Bearer <JWT>` do profissional  

### 2.1 Path Params

| Parâmetro    | Tipo  | Obrigatório | Descrição              |
|:-------------|:------|:------------|:-----------------------|
| `cliente_id` | `int` | Sim         | ID do cliente/paciente |

### 2.2 Query Params

| Parâmetro   | Tipo     | Obrigatório | Valores aceitos             | Default |
|:------------|:---------|:------------|:----------------------------|:--------|
| `intervalo` | `string` | Não         | `hoje`, `7d`, `30d`, `180d` | `7d`    |

---

## 3. Resposta de Sucesso — `200 OK`

### 3.1 Estrutura geral

```json
{
  "cliente_id": 10,
  "intervalo": "7d",
  "data_referencia": "2026-03-24",
  "total_noites_com_dados": 6,
  "historico": [ "..." ],
  "resumo": { "..." }
}
```

### 3.2 Objeto `historico[]` — um item por noite/dia

```json
{
  "data": "2026-03-23",
  "total_min": 427,
  "sem_dormir_min": 10,
  "rem_min": 92,
  "essencial_min": 293,
  "profundo_min": 42,
  "hora_inicio": "22:47",
  "hora_fim": "05:54",
  "fonte": "apple_health"
}
```

| Campo            | Tipo     | Nullable | Descrição                                                  |
|:-----------------|:---------|:---------|:-----------------------------------------------------------|
| `data`           | `string` | Não      | Data da noite (formato `YYYY-MM-DD`, dia em que acordou)   |
| `total_min`      | `int`    | Sim      | Total de minutos dormindo (soma dos 3 estágios de sono)    |
| `sem_dormir_min` | `int`    | Sim      | Minutos acordado dentro da janela de sono                  |
| `rem_min`        | `int`    | Sim      | Minutos de sono REM                                        |
| `essencial_min`  | `int`    | Sim      | Minutos de sono essencial/leve (core sleep no HK)          |
| `profundo_min`   | `int`    | Sim      | Minutos de sono profundo                                   |
| `hora_inicio`    | `string` | Sim      | Horário de início da sessão de sono (`HH:MM`, local)       |
| `hora_fim`       | `string` | Sim      | Horário de fim da sessão de sono (`HH:MM`, local)          |
| `fonte`          | `string` | Sim      | Origem do dado (`apple_health`, `garmin`, etc.)            |

> **Regra de `data`:** usar a data em que o cliente **acordou** (não em que dormiu),
> no timezone `America/Fortaleza`. Assim uma noite que começa em 23:00 do dia 22
> e termina às 06:00 do dia 23 deve ser registrada com `data: "2026-03-23"`.

> **Campos nullable:** se nenhum dado de sono existir para aquela noite,
> o item ainda deve aparecer no array com `total_min: null` e demais campos `null`,
> para que o frontend possa exibir o dia sem barra (gap visual).

### 3.3 Objeto `resumo` — médias do intervalo

```json
{
  "media_total_min": 391,
  "media_sem_dormir_min": 12,
  "media_rem_min": 85,
  "media_essencial_min": 261,
  "media_profundo_min": 43,
  "noites_sem_dados": 1
}
```

### 3.4 Comportamento do `intervalo=hoje`

Retorna **apenas a noite mais recente** com dados disponíveis:

```json
{
  "cliente_id": 10,
  "intervalo": "hoje",
  "data_referencia": "2026-03-24",
  "total_noites_com_dados": 1,
  "historico": [
    {
      "data": "2026-03-24",
      "total_min": 427,
      "sem_dormir_min": 10,
      "rem_min": 92,
      "essencial_min": 293,
      "profundo_min": 42,
      "hora_inicio": "22:47",
      "hora_fim": "05:54",
      "fonte": "apple_health"
    }
  ],
  "resumo": {
    "media_total_min": 427,
    "media_sem_dormir_min": 10,
    "media_rem_min": 92,
    "media_essencial_min": 293,
    "media_profundo_min": 42,
    "noites_sem_dados": 0
  }
}
```

> Para `hoje`, se não houver dado da noite atual, retornar a noite imediatamente
> anterior disponível. Se não houver nenhuma noite disponível, retornar
> `historico: []` e `total_noites_com_dados: 0`.

---

## 4. Códigos de Resposta

| Código | Situação                                        |
|:-------|:------------------------------------------------|
| `200`  | Sucesso (mesmo que `historico` esteja vazio)    |
| `400`  | `intervalo` com valor inválido                  |
| `403`  | Profissional sem vínculo com o cliente          |
| `404`  | Cliente não encontrado                          |

---

## 5. Exemplos de Chamada

```bash
# Noite de hoje
GET /api/painel-longevidade/clientes/10/sono/historico?intervalo=hoje

# Últimos 7 dias (default)
GET /api/painel-longevidade/clientes/10/sono/historico?intervalo=7d

# Últimos 30 dias
GET /api/painel-longevidade/clientes/10/sono/historico?intervalo=30d

# Últimos 6 meses
GET /api/painel-longevidade/clientes/10/sono/historico?intervalo=180d
```

---

## 6. Notas de Implementação

- **Timezone:** todos os horários e datas devem ser calculados em `America/Fortaleza` (UTC-3, sem horário de verão).
- **Agrupamento:** se o cliente tiver múltiplas sessões registradas em uma mesma noite (ex: cochilo + sono noturno), somar os minutos de cada estágio na entrada do dia correspondente.
- **Mapeamento HealthKit:**
  | Campo HK                                    | Campo resposta   |
  |:--------------------------------------------|:-----------------|
  | `HKCategoryValueSleepAnalysisAwake`         | `sem_dormir_min` |
  | `HKCategoryValueSleepAnalysisREM`           | `rem_min`        |
  | `HKCategoryValueSleepAnalysisCore`          | `essencial_min`  |
  | `HKCategoryValueSleepAnalysisDeep`          | `profundo_min`   |
- **Ordenação do `historico`:** crescente por `data` (mais antigo primeiro), para facilitar renderização direta no gráfico.
- **Cache:** ETag/304 aceito normalmente junto aos demais endpoints do painel.
