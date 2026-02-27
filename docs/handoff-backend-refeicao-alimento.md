# Handoff Backend — Nova Refeição + Adicionar Alimento

> Documento de referência para implementação dos endpoints de backend (Django Ninja) consumidos pelas telas **Nova Refeição** e **Adicionar Alimento** do painel UNIO Performance OS.

---

## 1. Visão geral

O frontend já está implementado e consome os endpoints listados abaixo. Atualmente, parte deles é servida por um mock Express local e parte é um proxy transparente para o staging (`staging.unio.tec.br`). O objetivo deste handoff é que o backend real substitua ambos.

### Fluxo do usuário

1. Profissional acessa a **Prescrição Alimentar** de um paciente
2. Clica em **Adicionar refeição** → abre o modal "Nova refeição"
3. Preenche **Horário** (select), **Nome da refeição** (combobox com sugestões) e **Observação** (opcional)
4. Clica em **Adicionar alimento** → abre o modal de busca de alimentos
5. Busca alimentos por nome na TBCA (debounce 300ms, mín. 2 caracteres)
6. Seleciona um alimento → informa quantidade → vê macros calculados em tempo real
7. Confirma o alimento (pode adicionar vários antes de fechar)
8. De volta ao modal "Nova refeição", salva a refeição completa

---

## 2. Endpoints necessários

### 2.1. Buscar alimentos — TBCA

Já existe no staging e é usado via proxy.

```
GET /api/nutricao/tbca/alimentos
```

**Query params:**

| Param   | Tipo   | Obrigatório | Descrição                                      |
|---------|--------|-------------|-------------------------------------------------|
| busca   | string | sim         | Termo de busca (mín. 2 caracteres no frontend) |
| fonte   | string | não         | Filtro por fonte: `"TBCA"`, `"IBGE"`, etc.      |
| grupo   | string | não         | Filtro por grupo alimentar                      |
| limite  | string | não         | Máx. resultados (frontend envia `"30"`)         |
| offset  | string | não         | Paginação                                       |

**Response `200 OK`** — array de objetos:

```jsonc
[
  {
    "id": "63da4a38-fd01-4d80-a5e4-c238ba4529ed",       // UUID — usado como identificador único do alimento
    "codigo_tbca": "BRC0732F",
    "descricao": "Carne, boi, de segunda (...), c/ sal", // Nome completo do alimento
    "nome_cientifico": "Bos taurus",                     // Opcional
    "grupo_alimentar": {
      "id": "e7acb656-...",
      "codigo_tbca": "F",
      "nome": "Carnes e derivados"
    },
    "fonte_dados": "TBCA"                                // Enum: "TBCA" | "IBGE" | "TUCUNDUVA" | "SUPLEMENTOS" | "MEUS_ALIMENTOS"
  }
]
```

> **Nota:** O frontend aplica `formatFoodName()` para limpeza visual (remove ", Brasil", ", todas as variedades", ", cru", expande `c/` → "com", `s/` → "sem"). Isso é feito no client — o backend deve retornar a descrição original completa.

---

### 2.2. Detalhe de alimento — TBCA

```
GET /api/nutricao/tbca/alimentos/:id
```

**Path params:**

| Param | Tipo   | Descrição     |
|-------|--------|---------------|
| id    | UUID   | ID do alimento |

**Response `200 OK`** — objeto completo do alimento com composição nutricional. Formato atual do staging.

---

### 2.3. Calcular macros por quantidade

Recalcula a composição nutricional para uma quantidade específica de alimento.

```
POST /api/nutricao/tbca/calcular
```

**Request body:**

```json
{
  "alimento_id": "63da4a38-fd01-4d80-a5e4-c238ba4529ed",
  "quantidade_consumida": 100
}
```

| Campo                 | Tipo   | Obrigatório | Descrição                          |
|-----------------------|--------|-------------|------------------------------------|
| alimento_id           | string | sim         | UUID do alimento (da busca)        |
| quantidade_consumida  | number | sim         | Quantidade em gramas (> 0)         |

**Response `200 OK`:**

```jsonc
{
  "alimento": "Carne, boi, de segunda (...)",
  "quantidade_consumida": "100",
  "unidade": "g",
  "composicao": [
    {
      "nutriente": "Energia",
      "categoria": "Energia",
      "valor": "279.0000",        // string numérica ou null
      "valor_texto": null,        // alternativa textual (ex: "TR" = traço)
      "unidade": "kcal"
    },
    {
      "nutriente": "Proteína",
      "categoria": "Macronutriente",
      "valor": "31.2000",
      "valor_texto": null,
      "unidade": "g"
    }
    // ... demais nutrientes
  ],
  "resumo_macros": {
    "calorias": "279.00",
    "proteinas": "31.20",
    "carboidratos": "0.00",
    "gorduras": "17.20",
    "fibras": "0.00"
  }
}
```

> **Atenção:** Os valores em `resumo_macros` são retornados como **strings** (ex: `"279.00"`, `"31.20"`). O frontend já trata a conversão para número via `formatNutrient()`. Se o backend mudar para `number`, o frontend aceita ambos os tipos.

---

### 2.4. Criar refeição em um plano alimentar

```
POST /api/profissional/dashboard/pacientes/:pacienteId/planos-alimentares/:planoId/refeicoes
```

**Path params:**

| Param      | Tipo   | Descrição                    |
|------------|--------|------------------------------|
| pacienteId | string | ID do paciente               |
| planoId    | string | ID do plano alimentar        |

**Request body:**

```json
{
  "nome": "Café da manhã",
  "horario": "08:00",
  "alimentos": [
    {
      "id": "63da4a38-...-1709312000000",
      "nome": "Arroz integral",
      "quantidade": 150,
      "unidade": "g",
      "grupo": "Cereais e leguminosas"
    }
  ],
  "observacao": "Orientações opcionais"
}
```

| Campo      | Tipo             | Obrigatório | Validação                                                          |
|------------|------------------|-------------|--------------------------------------------------------------------|
| nome       | string           | sim         | Não pode ser vazio. Trim aplicado.                                 |
| horario    | string           | sim         | Formato `"HH:mm"`. Aceita intervalos de 30 min: `"00:00"` a `"23:30"`. |
| alimentos  | AlimentoPlano[]  | sim*        | Array de alimentos. Frontend exige >= 1, mas o backend pode aceitar array vazio se necessário. |
| observacao | string           | não         | Texto livre. Trim aplicado. `undefined` ou string vazia = sem observação. |

**Estrutura de `AlimentoPlano`:**

```typescript
interface AlimentoPlano {
  id: string;        // Formato: "{alimentoUUID}-{timestamp}" — gerado no frontend
  nome: string;      // Nome original do alimento (sem formatação)
  quantidade: number; // Quantidade informada pelo usuário (> 0)
  unidade: string;   // Ex: "g", "Fatia", "Colher De Sopa"
  grupo?: string;    // Grupo alimentar (opcional, informativo)
}
```

> **Nota sobre o `id` do alimento:** O frontend gera IDs no formato `{alimentoUUID}-{timestamp}` para garantir unicidade quando o mesmo alimento é adicionado mais de uma vez. O backend pode gerar seu próprio ID ao persistir; o `id` enviado serve apenas como chave temporária no frontend.

**Response `201 Created`:**

```jsonc
{
  "id": "ref-7",                     // ID gerado pelo backend
  "nome": "Café da manhã",
  "horario": "08:00",
  "alimentos": [ /* ... */ ],
  "observacao": "Orientações opcionais"
}
```

**Erros esperados:**

| Status | Condição                           | Body                                               |
|--------|------------------------------------|-----------------------------------------------------|
| 400    | `nome` ausente ou vazio            | `{ "message": "nome é obrigatório." }`             |
| 400    | `horario` ausente ou inválido      | `{ "message": "horario é obrigatório." }`          |
| 404    | Plano alimentar não encontrado     | `{ "message": "Plano alimentar não encontrado." }` |

---

### 2.5. Listar planos alimentares (leitura — já existe)

```
GET /api/profissional/dashboard/pacientes/:pacienteId/planos-alimentares
```

**Response `200 OK`:**

```jsonc
[
  {
    "id": "plano-p2-1",
    "descricao": "Dieta hiperproteica",
    "status": "ativo",                                    // "ativo" | "rascunho"
    "diasAtivos": ["segunda", "terca", "quarta", "quinta", "sexta"],
    "dataCriacao": "26/02/2026",
    "calorias": 2050
  }
]
```

---

### 2.6. Detalhe de plano alimentar com refeições (leitura — já existe)

```
GET /api/profissional/dashboard/pacientes/:pacienteId/plano-alimentar?planoId=X&diaSemana=Y
```

**Query params:**

| Param     | Tipo   | Obrigatório | Descrição                                  |
|-----------|--------|-------------|---------------------------------------------|
| planoId   | string | sim         | ID do plano                                 |
| diaSemana | string | não         | Default: `"segunda"`. Enum `DiaSemana`.     |

**Response `200 OK`:**

```jsonc
{
  "id": "plano-p2-1",
  "pacienteId": "p2",
  "descricao": "Dieta hiperproteica",
  "status": "ativo",
  "diaSemana": "segunda",
  "diasAtivos": ["segunda", "terca", "quarta", "quinta", "sexta"],
  "dataCriacao": "26/02/2026",
  "refeicoes": [
    {
      "id": "ref-1",
      "nome": "Desjejum",
      "horario": "07:00",
      "alimentos": [
        {
          "id": "a1",
          "nome": "Pão, aveia, forma",
          "quantidade": 2,
          "unidade": "Fatia",
          "grupo": "Cereais e derivados"
        }
      ],
      "observacao": null
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

> O frontend espera que os `nutrientes` sejam recalculados automaticamente pelo backend sempre que a composição de refeições/alimentos mudar. Após criar uma refeição via POST, o frontend invalida a cache e refaz GET neste endpoint.

---

## 3. Tipos de referência (TypeScript)

```typescript
type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

type FonteAlimento = "TBCA" | "IBGE" | "TUCUNDUVA" | "SUPLEMENTOS" | "MEUS_ALIMENTOS";

interface AlimentoPlano {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  grupo?: string;
}

interface Refeicao {
  id: string;
  nome: string;
  horario: string;         // "HH:mm"
  alimentos: AlimentoPlano[];
  observacao?: string;
  substitutas?: Refeicao[]; // Futuro — refeições substitutas
}

interface ResumoMacros {
  calorias: number | string;   // Backend retorna string, frontend aceita ambos
  proteinas: number | string;
  carboidratos: number | string;
  gorduras: number | string;
  fibras: number | string;
}

interface MacroNutrientePlano {
  gramas: number;
  percentual: number;       // Ex: 26.9 (não 0.269)
}

interface NutrientesPlano {
  calorias: number;
  proteina: MacroNutrientePlano;
  carboidrato: MacroNutrientePlano;
  gordura: MacroNutrientePlano;
  fibra: number;
}

interface PlanoAlimentar {
  id: string;
  pacienteId: string;
  descricao: string;
  status: "ativo" | "rascunho";
  diaSemana: DiaSemana;
  diasAtivos: DiaSemana[];
  dataCriacao: string;       // Formato: "dd/mm/yyyy"
  refeicoes: Refeicao[];
  nutrientes: NutrientesPlano;
}
```

---

## 4. Comportamento do frontend

### 4.1. Busca de alimentos
- Debounce de **300ms** sobre o input de busca
- Mínimo **2 caracteres** para disparar request
- Envia `limite=30` como padrão
- Filtra por `fonte` quando o profissional seleciona uma aba específica (TBCA, IBGE, etc.)
- Deduplicação por `id` no client (para quando múltiplas fontes retornam o mesmo alimento)

### 4.2. Cálculo de macros
- Dispara `POST /api/nutricao/tbca/calcular` com debounce de **300ms** ao alterar quantidade
- Exibe 5 MacroCards: Calorias (kcal), Proteína (g), Carboidrato (g), Gordura (g), Fibra (g)
- Valores formatados no client: inteiro sem decimal, fracionário com 1 casa e vírgula (ex: `"279"`, `"31,2"`)

### 4.3. Validação no frontend (antes do POST)
O frontend **não envia** o request se:
- `horario` está vazio
- `nome` (descrição da refeição) está vazio
- `alimentos` está vazio (array com 0 itens)

Os botões "Salvar" e "Salvar e adicionar outra" ficam **desabilitados** até que as 3 condições sejam satisfeitas.

### 4.4. Cache invalidation
Após `POST .../refeicoes` com sucesso, o frontend invalida:
- `GET .../planos-alimentares` (lista de planos — para atualizar totais de calorias)
- `GET .../plano-alimentar` (detalhe — para mostrar a nova refeição)

### 4.5. Horários aceitos
O select de horários apresenta intervalos de 30 minutos de `"00:00"` a `"23:30"` (48 opções). O backend deve aceitar qualquer valor `"HH:mm"` nesse range.

### 4.6. Nomes de refeição sugeridos
O frontend sugere uma lista fixa via combobox, mas aceita texto livre:
- Café da manhã, Colação, Almoço, Lanche da tarde, Pré-treino, Pós-treino, Jantar

---

## 5. Endpoints futuros (fora de escopo atual)

Estes endpoints já estão mapeados no frontend mas ainda não implementados:

| Ação                     | Método | Endpoint sugerido                                                          |
|--------------------------|--------|----------------------------------------------------------------------------|
| Editar refeição          | PUT    | `.../planos-alimentares/:planoId/refeicoes/:refeicaoId`                    |
| Excluir refeição         | DELETE | `.../planos-alimentares/:planoId/refeicoes/:refeicaoId`                    |
| Duplicar refeição        | POST   | `.../planos-alimentares/:planoId/refeicoes/:refeicaoId/duplicar`           |
| Remover alimento         | DELETE | `.../planos-alimentares/:planoId/refeicoes/:refeicaoId/alimentos/:alimentoId` |
| Busca legado (não-TBCA)  | GET    | `/api/nutricao/alimentos/buscar?q=...&limite=...`                          |

---

## 6. Autenticação

Todos os endpoints sob `/api/profissional/...` devem ser autenticados via **Bearer token JWT** no header `Authorization`. O frontend envia o token obtido no login (`POST /api/auth/pair`).

Os endpoints sob `/api/nutricao/...` (busca e cálculo de alimentos) são chamados pelo frontend sem auth header — a autenticação com o serviço TBCA é feita server-side (o Express proxy adiciona o token do staging). O backend real deve manter esse comportamento ou exigir o mesmo token do profissional.

---

## 7. Proxy atual (referência)

O Express mock em `server/staging-proxy.ts` faz proxy para `staging.unio.tec.br` usando credenciais server-side:

```
STAGING_API_URL=https://staging.unio.tec.br
STAGING_EMAIL=...
STAGING_PASSWORD=...
```

Token JWT cacheado por 25 minutos. Endpoints proxied:
- `GET /api/nutricao/tbca/alimentos` → `GET staging/api/nutricao/tbca/alimentos`
- `GET /api/nutricao/tbca/alimentos/:id` → `GET staging/api/nutricao/tbca/alimentos/:id`
- `POST /api/nutricao/tbca/calcular` → `POST staging/api/nutricao/tbca/calcular`
- `GET /api/nutricao/alimentos/buscar` → `GET staging/api/nutricao/alimentos/buscar`

---

## 8. Contrato real do backend (v3 — Fev/2026)

Esta seção documenta as diferenças entre o contrato original (seções 2–3 acima) e o contrato real implementado pelo backend Django. O frontend foi adaptado com uma camada de normalização (`client/src/lib/api-normalizers.ts`) para tratar essas diferenças.

### 8.1. Busca TBCA — Diferenças

| Campo | Handoff original | Backend real | Impacto |
|-------|-----------------|--------------|---------|
| `grupo_alimentar` | `{ id, codigo_tbca, nome }` (objeto) | `"grupo": "Carnes..."` (string direta) | Normalizado em `normalizarAlimentoTBCA()` |
| `fonte_dados` | `"TBCA"` (uppercase) | `"tbca"` (lowercase) | Normalizado via `toUpperCase()` |
| `apresentacao` | Não existia | Novo bloco: `{ nome_exibicao, detalhes, modo_preparo, categoria, fonte }` | Preservado no tipo `ApresentacaoAlimento` |
| `confianca_parse` | Não existia | `"alta"` / `"media"` / `"baixa"` | Disponível no response, não consumido na UI ainda |

### 8.2. Calcular — Diferenças

| Campo | Handoff original | Backend real | Impacto |
|-------|-----------------|--------------|---------|
| `composicao[].categoria` | Presente | Removido | Sem impacto (frontend não consome) |
| `composicao[].simbolo` | Não existia | Adicionado (ex: `"PROT"`) | Disponível mas não consumido |

### 8.3. Planos Alimentares (leitura) — Diferenças

| Campo | Handoff original | Backend real | Impacto |
|-------|-----------------|--------------|---------|
| `pacienteId` | `string` | `paciente_id: number` | Normalizado para `String(paciente_id)` |
| `profissional_id` | Não existia | `number` | Novo campo, ignorado no frontend |
| `diasAtivos` | Array de `DiaSemana` | Ausente | Fallback: `[]` |
| `diaSemana` | `DiaSemana` | Ausente | Fallback: `"segunda"` |
| `dataCriacao` | `string` | Ausente | Fallback: `new Date().toISOString()` |
| `calorias` (resumo) | `number` | Ausente | Fallback: `0` |
| `nutrientes` | `NutrientesPlano` | Ausente | Fallback: objeto zerado |

### 8.4. Alimentos dentro de Refeição (leitura) — Diferenças

| Campo | Handoff original | Backend real | Impacto |
|-------|-----------------|--------------|---------|
| `nome` | `string` | `alimento_nome: string` | Normalizado: `alimento_nome → nome` |
| `quantidade` | `number` | `string` (ex: `"150.50"`) | Normalizado: `parseFloat()` |
| `alimento_tbca_id` | Não existia | UUID do catálogo TBCA | Preservado em `alimentoTbcaId` |
| `grupo` | Opcional | Ausente | Sem impacto (já era opcional) |

### 8.5. Horário — Diferenças

| Contexto | Handoff original | Backend real | Impacto |
|----------|-----------------|--------------|---------|
| Response (leitura) | `"HH:mm"` | `"HH:mm:ss"` (ex: `"12:30:00"`) | Normalizado para `"HH:mm"` na leitura |
| Request (escrita) | `"HH:mm"` | `"HH:mm:ss"` | Frontend appenda `:00` ao enviar |

### 8.6. POST Criar Refeição — Diferenças

| Campo | Handoff original | Backend real | Impacto |
|-------|-----------------|--------------|---------|
| Chaves do payload | PT-BR (`nome`, `horario`, `alimentos`, `observacao`) | PT-BR (idêntico) | Sem mudança necessária |
| `alimentos[].alimento_tbca_id` | Não existia | UUID TBCA obrigatório | Adicionado via `montarPayloadRefeicao()` |
| `alimentos[].nome` | Enviado | Não esperado | Removido do payload |
| `alimentos[].grupo` | Enviado | Não esperado | Removido do payload |

### 8.7. Camada de normalização

Arquivo: `client/src/lib/api-normalizers.ts`

Funções exportadas:
- `normalizarAlimentoTBCA(raw)` — normaliza um resultado de busca TBCA
- `normalizarResultadosTBCA(dados)` — normaliza array de resultados
- `normalizarAlimentoPlano(raw)` — normaliza alimento dentro de refeição
- `normalizarRefeicao(raw)` — normaliza refeição com alimentos e horário
- `normalizarPlanoAlimentar(raw)` — normaliza plano alimentar completo
- `normalizarResumoPlano(raw)` — normaliza resumo de plano (para listagem)
- `montarPayloadRefeicao(nome, horario, alimentos, observacao?)` — monta payload para POST

Todas as funções detectam automaticamente o formato (mock vs backend real) e aplicam normalização adequada, permitindo transição suave sem quebrar a UI durante a migração
