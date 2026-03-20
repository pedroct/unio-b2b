# Contrato de API — Edição de Refeição no Plano Alimentar

**Solicitante:** UNIO Performance OS — Frontend (Panel Web)  
**Data:** 2026-03-20  
**Prioridade:** Alta  
**Tag:** `nutricao` / `planos-alimentares`

---

## 1. Contexto e Motivação

O painel web do profissional permite visualizar e editar refeições prescritas dentro de um plano alimentar de um cliente. O fluxo de edição inclui:

- Alterar o nome da refeição
- Alterar o horário
- Adicionar/remover alimentos
- **Alterar a quantidade de um alimento já vinculado**

A API atual (OpenAPI v1.0.0) **não fornece nenhum endpoint capaz de realizar a edição completa de uma refeição já vinculada a um plano**, incluindo seus alimentos e quantidades.

---

## 2. Diagnóstico dos Endpoints Existentes

| Endpoint | Método | Limitação |
|---|---|---|
| `/api/nutricao/planos-alimentares/{cliente_id}/{plano_id}` | `PATCH` | Aceita apenas `descricao`, `dias_ativos`, `status`. **Não aceita `refeicoes`.** |
| `/api/nutricao/refeicoes/{refeicao_id}` | `PATCH` | Aceita apenas `nome`, `horario_lembrete`, `ordem`, `ativa`. **Não aceita `alimentos`.** |
| `/api/nutricao/refeicoes/{refeicao_id}` | `DELETE` | Remove refeição do **catálogo pessoal** do profissional (ID inteiro), **não** do plano de um cliente. |
| `/api/nutricao/planos-alimentares/{cliente_id}/{plano_id}/refeicoes` | `POST` | Cria uma **nova** refeição no plano. Não atualiza uma existente. |

**Conclusão:** Não existe endpoint para substituir ou atualizar uma refeição (com seus alimentos e quantidades) já vinculada a um plano de cliente.

---

## 3. Endpoints Solicitados

### 3.1 — `PUT /api/nutricao/planos-alimentares/{cliente_id}/{plano_id}/refeicoes/{refeicao_id}` *(Preferencial)*

**Descrição:**  
Substitui completamente uma refeição existente de um plano alimentar, incluindo todos os seus alimentos e quantidades. A refeição é identificada por `refeicao_id` (UUID).

**Comportamento esperado:**
- Substitui os dados da refeição (nome, horário, observação) pelos valores informados.
- Remove todos os `AlimentoPlano` vinculados à refeição atual.
- Cria os novos `AlimentoPlano` com os dados fornecidos.
- Se `alimento.id` for um UUID novo (não existente na base), cria um novo registro.
- Se `alimento.id` corresponder a um registro existente vinculado a esta refeição, **atualiza** `quantidade` e `unidade` no lugar.
- Retorna a refeição completa atualizada.

**Request Schema — `RefeicaoPlanoAtualizarSchema`:**

```json
{
  "nome": "Café da manhã",
  "horario": "07:00:00",
  "observacao": "Comer devagar",
  "alimentos": [
    {
      "id": "2a7de2a6-a2ae-4728-837f-235128844470",
      "alimento_id": "b541c940-693e-414f-8b3c-343c02d4b7a5",
      "quantidade": 30,
      "unidade": "g"
    }
  ]
}
```

**Campos do Schema:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | `string` | Sim | Nome da refeição |
| `horario` | `string` (format: time) | Sim | Horário no formato `HH:MM:SS` |
| `observacao` | `string` | Não | Observação visível ao cliente. Default: `""` |
| `alimentos` | `AlimentoPlanoInSchema[]` | Não | Lista completa de alimentos. Default: `[]` |

**`AlimentoPlanoInSchema` (já existente no spec):**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` (UUID) | Sim | ID do registro `AlimentoPlano`. Se novo UUID → cria. Se existente → atualiza. |
| `alimento_id` | `string` (UUID) | Sim | ID do alimento no catálogo (TBCA/IBGE/USDA/Manual) |
| `quantidade` | `number \| string` | Sim | Quantidade prescrita |
| `unidade` | `string` | Sim | Unidade de medida (ex.: `"g"`, `"ml"`, `"unidade"`) |

**Response `200 OK` — `RefeicaoPlanoOutSchema` (já existente):**

```json
{
  "id": "cc79bd55-3864-4495-a30d-b6e595623906",
  "nome": "Café da manhã",
  "horario": "07:00:00",
  "observacao": "Comer devagar",
  "alimentos": [
    {
      "id": "2a7de2a6-a2ae-4728-837f-235128844470",
      "alimento_id": "b541c940-693e-414f-8b3c-343c02d4b7a5",
      "alimento_nome": "Abacate",
      "quantidade": "30.00",
      "unidade": "g"
    }
  ]
}
```

**Response de Erro:**

| Status | Condição |
|---|---|
| `400 Bad Request` | Body inválido (campo obrigatório ausente, formato incorreto) |
| `404 Not Found` | `cliente_id`, `plano_id` ou `refeicao_id` não encontrado |
| `403 Forbidden` | Profissional não vinculado ao plano do cliente |

---

### 3.2 — `DELETE /api/nutricao/planos-alimentares/{cliente_id}/{plano_id}/refeicoes/{refeicao_id}` *(Alternativa)*

**Descrição:**  
Remove uma refeição específica de um plano alimentar de um cliente (hard ou soft-delete). Permite ao frontend implementar o padrão DELETE + POST como workaround enquanto o `PUT` acima não estiver disponível.

**Parâmetros:**

| Parâmetro | Tipo | Local | Obrigatório |
|---|---|---|---|
| `cliente_id` | `integer` | path | Sim |
| `plano_id` | `string` (UUID) | path | Sim |
| `refeicao_id` | `string` (UUID) | path | Sim |

**Response `204 No Content`** — sucesso sem body.

**Response de Erro:**

| Status | Condição |
|---|---|
| `404 Not Found` | Refeição ou plano não encontrado |
| `403 Forbidden` | Profissional não vinculado ao plano |

---

## 4. Prioridade de Implementação

| Opção | Endpoint | Esforço estimado | Impacto no frontend |
|---|---|---|---|
| **1 (Preferencial)** | `PUT .../refeicoes/{refeicao_id}` | Médio | Resolve tudo em 1 chamada. Preserva o `refeicao_id` para rastreamento de progresso. |
| **2 (Alternativa)** | `DELETE .../refeicoes/{refeicao_id}` | Baixo | Frontend faz DELETE + POST. `refeicao_id` muda → histórico de progresso não vinculado à nova refeição. |

---

## 5. Workaround Atual (enquanto aguarda implementação)

O frontend **não tem como persistir alterações de quantidade de alimentos** com a API atual. A tela exibe o toast de "salvo" mas o staging devolve o valor antigo pois o `PATCH` do plano ignora `refeicoes`.

Enquanto aguarda, o campo de quantidade na tela de edição será marcado como **somente leitura** para não enganar o profissional.

---

## 6. Integração Esperada no Frontend

Após implementação do `PUT`, o frontend irá:

1. Chamar `PUT /api/nutricao/planos-alimentares/{cliente_id}/{plano_id}/refeicoes/{refeicao_id}` com o body completo da refeição.
2. Em caso de `200 OK`, invalidar o cache local do plano e exibir toast de sucesso.
3. Em caso de erro, exibir mensagem com o detalhe retornado.

O proxy do servidor interno (`server/routes.ts`) já tem a estrutura necessária para encaminhar esta chamada ao staging assim que o endpoint estiver disponível.

---

*Documento gerado pelo time de frontend — UNIO Performance OS Panel Web.*
