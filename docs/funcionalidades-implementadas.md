# UNIO Performance OS — Funcionalidades Implementadas

> Documento de validacao para alinhamento frontend x backend.
> Ultima atualizacao: 27/02/2026

---

## 1. Autenticacao

### 1.1. Login do Profissional

| Item | Detalhe |
|------|---------|
| Rota frontend | `/login` |
| Endpoint | `POST /api/auth/pair` |
| Campos enviados | `registrationNumber` (Registro Profissional, ex: "CRM-12345"), `uf` (sigla do estado), `password` (CPF, somente digitos) |
| Validacoes no frontend | Registro obrigatorio, UF obrigatoria, CPF com minimo 11 digitos |
| Resposta esperada | `{ professional: { id, name, email, registrationType, registrationNumber, uf }, tokens: { access, refresh } }` |
| Persistencia | Tokens armazenados em `localStorage` (`unio_auth`) |
| Recuperacao de senha | Link para `suporte@unio.tec.br` |

### 1.2. Sessao

- Token JWT enviado no header `Authorization: Bearer <token>` em todas as requisicoes autenticadas
- Frontend verifica presenca de tokens no `localStorage` para manter estado de autenticacao
- Logout limpa `localStorage` e redireciona para `/login`

---

## 2. Navegacao e Sidebar

### 2.1. Menu Principal

| Item | Rota | Descricao |
|------|------|-----------|
| Clientes | `/pacientes` | Lista de clientes do profissional |
| Visao geral | `/dashboard` | Alias para lista de clientes |
| Prescricao alimentar | `/prescricao-alimentar` | Lista de clientes para prescricao |
| Configuracoes | `/configuracoes` | Pagina de configuracoes (placeholder "Em breve") |

### 2.2. Funcionalidades da Sidebar

- Sidebar colapsavel (toggle)
- Indicador visual de pagina ativa
- Dados do profissional logado no rodape (nome, tipo de registro)
- Botao de logout
- Toggle de tema claro/escuro

---

## 3. Gestao de Clientes

### 3.1. Listagem de Clientes

| Item | Detalhe |
|------|---------|
| Rota frontend | `/pacientes` |
| Endpoint | `GET /api/profissional/pacientes` |

**Funcionalidades implementadas:**

- Tabela com colunas: Nome, Email, Genero, Idade, Tags, Adesao (Dieta/Treino), Ultima atividade, Data cadastro, Ultima consulta
- **Abas de status:** Ativos / Todos / Inativos (com contagem por aba)
- **Busca em tempo real** por nome ou email
- **Filtro por tags** (dropdown multi-selecao): Emagrecimento, Low Carb, Hipertrofia, Suplementacao, Gestante, Acompanhamento, Diabetes T2, Reabilitacao, Performance
- **Filtro por periodo:** Data de Cadastro ou Ultima Consulta, com campos De/Ate
- **Ordenacao:** Nome (A-Z / Z-A), Adesao (Maior/Menor), Ultima Atividade
- **Cards resumo no topo:** Total de Clientes, Clientes Ativos, Adesao Media

**Resposta esperada do endpoint:**

```json
[
  {
    "id": "p1",
    "name": "Ana Carolina Silva",
    "email": "ana.silva@email.com",
    "phone": "(11) 98765-4321",
    "birthDate": "1992-03-15",
    "gender": "F",
    "age": 33,
    "adherenceTraining": 85,
    "adherenceDiet": 72,
    "lastActivity": "Ha 2 horas",
    "status": "active",
    "tags": ["Emagrecimento", "Low Carb"],
    "dataCadastro": "10/01/2026",
    "ultimaConsulta": "25/02/2026"
  }
]
```

### 3.2. Detalhe do Cliente (Acesso)

- Clique na linha da tabela navega para `/pacientes/:id/dashboard`

---

## 4. Dashboard Individual do Cliente

| Item | Detalhe |
|------|---------|
| Rota frontend | `/pacientes/:id/dashboard` |
| Endpoint base | `GET /api/profissional/pacientes/:id` |

**Cabecalho do dashboard:**
- Avatar, nome completo, status (Ativo/Inativo), idade, genero
- Link para pagina de Metas (`/pacientes/:id/configuracoes`)

### 4.1. Aba Visao Geral

| Endpoint | `GET /api/profissional/dashboard/pacientes/:id/overview` |
|----------|----------------------------------------------------------|

**Funcionalidades:**

- **Snapshot semanal:** Calorias medias/dia, Sessoes de treino/semana, Hidratacao media/dia — cada um com barra de progresso em relacao a meta
- **Variacao de peso:** Exibicao da variacao (kg) na semana com indicador visual (seta para cima/baixo/estavel)
- **Motor de Insights:** Cards categorizados (Alerta, Sucesso, Info) com contexto clinico (Nutricao, Treino, Biometria, Hidratacao)
- **Graficos de correlacao:**
  - Calorias vs. Treino (grafico de barras)
  - Evolucao de peso (grafico de area)

**Resposta esperada do endpoint:**

```json
{
  "snapshot": {
    "caloriasMedia": 1850,
    "caloriasMeta": 2200,
    "sessoesTreino": 4,
    "sessoesMeta": 5,
    "hidratacaoMedia": 1800,
    "hidratacaoMeta": 2500
  },
  "pesoVariacao": { "valor": -0.3, "unidade": "kg" },
  "insights": [
    {
      "tipo": "alerta",
      "categoria": "nutricao",
      "titulo": "...",
      "descricao": "..."
    }
  ],
  "graficos": {
    "caloriasVsTreino": [...],
    "evolucaoPeso": [...]
  }
}
```

### 4.2. Aba Nutricao

| Endpoint | `GET /api/profissional/dashboard/pacientes/:id/nutricao` |
|----------|----------------------------------------------------------|

**Funcionalidades:**

- **Meta calorica:** Display grande com calorias atuais vs. meta, percentual de adesao
- **Macronutrientes:** Barras de progresso individuais para Proteinas, Carboidratos e Gorduras (gramas atuais vs. meta)
- **Distribuicao de macros:** Grafico de pizza com percentuais
- **Diario alimentar historico:** Grafico de area (calorias e proteinas ao longo do tempo)
- **CTA "Ver Plano Alimentar":** Abre o sheet lateral (`SheetPlanoAlimentar`) com planos ativos

### 4.3. Aba Biometria

| Endpoint | `GET /api/profissional/dashboard/pacientes/:id/biometria` |
|----------|-----------------------------------------------------------|

**Funcionalidades:**

- **Cards de metricas:** Gordura Corporal (%), Massa Muscular (kg), Agua Corporal (%) — cada um com indicador de tendencia (Reduzindo/Aumentando/Estavel)
- **Grafico de evolucao corporal:** Linhas de Peso, Gordura Corporal e Massa Muscular ao longo do tempo
- **Historico de capturas:** Lista cronologica de todas as medicoes registradas

### 4.4. Aba Treinamento

| Endpoint | `GET /api/profissional/dashboard/pacientes/:id/treinamento` |
|----------|--------------------------------------------------------------|

**Funcionalidades:**

- **Resumo de sessoes:** Total de sessoes, media semanal, percentual de adesao
- **PSE (Percepcao Subjetiva de Esforco):** Media com badge colorido por intensidade
- **Volume de carga:** Grafico de barras (kg por sessao)
- **Sessoes recentes:** Lista detalhada com status (concluido/faltou), duracao e numero de exercicios

---

## 5. Configuracoes do Cliente (Metas)

| Item | Detalhe |
|------|---------|
| Rota frontend | `/pacientes/:id/configuracoes` |
| Endpoints | `GET /api/profissional/pacientes/:id/metas`, `PUT /api/profissional/pacientes/:id/metas` |

**Funcionalidades:**

- **Metas nutricionais:** Formulario para definir Meta Calorica Diaria (kcal), Proteinas (g), Carboidratos (g), Gorduras (g)
- **Meta de hidratacao:**
  - Modo automatico: calcula com base no peso (35ml/kg)
  - Modo manual: toggle para sobrescrever com valor personalizado (ml)
- **Persistencia:** Salvar invalida caches do dashboard para refletir metas atualizadas imediatamente
- **Toast de confirmacao** ao salvar com sucesso

---

## 6. Plano Alimentar — Visualizacao (Sheet Lateral)

| Item | Detalhe |
|------|---------|
| Componente | `SheetPlanoAlimentar` |
| Acionamento | CTA "Ver Plano Alimentar" na aba Nutricao |
| Endpoint (lista) | `GET /api/profissional/dashboard/pacientes/:id/planos-alimentares` |
| Endpoint (detalhe) | `GET /api/profissional/dashboard/pacientes/:id/plano-alimentar?planoId=X` |

**Funcionalidades:**

- Sheet deslizante lateral (read-only)
- Seletor para alternar entre planos ativos
- Exibicao de refeicoes com horario, nome e lista de alimentos
- Cada alimento mostra: nome formatado, quantidade e unidade
- Total calorico do plano
- Skeleton loading durante carregamento

---

## 7. Prescricao Alimentar — Edicao

### 7.1. Lista de Clientes para Prescricao

| Item | Detalhe |
|------|---------|
| Rota frontend | `/prescricao-alimentar` |
| Endpoint | `GET /api/profissional/pacientes` |

- Lista simplificada de clientes para selecionar quem prescrever
- Clique navega para `/prescricao-alimentar/:pacienteId`

### 7.2. Pagina de Prescricao

| Item | Detalhe |
|------|---------|
| Rota frontend | `/prescricao-alimentar/:pacienteId` |
| Componente principal | `AbaPlanoAlimentar` |

**Funcionalidades:**

- **Dropdown de planos:** Selecionar entre multiplos planos do cliente
- **Edicao de descricao inline:** Clicar no titulo do plano permite editar o nome
  - Endpoint: `PUT .../planos-alimentares/:planoId/descricao`
  - Body: `{ descricao: "Novo nome" }`
- **Gerenciamento de dias ativos:** Modal para selecionar dias da semana em que o plano esta ativo
  - Atalhos: Dias uteis, Fim de semana, Todos
  - Deteccao de conflito com outros planos ativos
  - Endpoint: `PUT .../planos-alimentares/:planoId/dias`
  - Body: `{ diasAtivos: ["segunda", "terca", ...] }`
- **Seletor de dia da semana:** Abas para navegar entre os dias (Seg, Ter, Qua, etc.)
- **Cards de refeicao:** Cada refeicao mostra:
  - Horario (formato HH:mm)
  - Nome da refeicao
  - Tabela de alimentos (nome formatado, quantidade, unidade)
  - Botoes: Editar, Duplicar, Excluir (visuais, funcionalidade futura)
  - Link "Adicionar substituta" (funcionalidade futura)
- **Resumo nutricional:** Painel lateral com:
  - Total de calorias
  - Macronutrientes em gramas e percentual (Proteina, Carboidrato, Gordura)
  - Fibra total
  - Grafico de pizza com distribuicao de macros
- **Botao "Adicionar refeicao":** Abre o modal de nova refeicao

---

## 8. Modal Nova Refeicao

| Item | Detalhe |
|------|---------|
| Componente | `ModalNovaRefeicao` |
| Endpoint | `POST .../planos-alimentares/:planoId/refeicoes` |

**Funcionalidades:**

- **Horario:** Select com intervalos de 30 min (00:00 a 23:30)
  - Frontend envia no formato `HH:mm:00` (com segundos)
- **Nome da refeicao:** Combobox com sugestoes padrao + texto livre
  - Sugestoes: Cafe da manha, Colacao, Almoco, Lanche da tarde, Pre-treino, Pos-treino, Jantar
- **Observacao:** Campo de texto opcional
- **Lista de alimentos adicionados:** Tabela com nome, quantidade, unidade e botao de remover
- **Botao "Adicionar alimento":** Abre o modal de busca de alimentos
- **Validacao:** Botoes de salvar desabilitados ate preencher horario + nome + pelo menos 1 alimento
- **Acoes de salvamento:**
  - "Salvar": salva e fecha o modal
  - "Salvar e adicionar outra": salva e limpa o formulario para nova refeicao
- **Toast de confirmacao** apos salvar
- **Invalidacao de cache:** Apos POST com sucesso, invalida queries de planos-alimentares e plano-alimentar

**Payload enviado ao backend (formato final v3):**

```json
{
  "nome": "Almoco",
  "horario": "12:30:00",
  "observacao": "Sem pele e grelhado na agua",
  "alimentos": [
    {
      "id": "f51c...",
      "alimento_tbca_id": "e21b76df-c7c4-4d80-bae3-23a936af8d82",
      "quantidade": 150.5,
      "unidade": "g"
    }
  ]
}
```

**Resposta esperada (201 Created):**

```json
{
  "id": "d04d...",
  "nome": "Almoco",
  "horario": "12:30:00",
  "observacao": "Sem pele e grelhado na agua",
  "alimentos": [
    {
      "id": "f51c...",
      "alimento_tbca_id": "e21b76df-...",
      "alimento_nome": "Frango, peito, sem pele, grelhado",
      "quantidade": "150.50",
      "unidade": "g"
    }
  ]
}
```

---

## 9. Modal Adicionar Alimento

| Item | Detalhe |
|------|---------|
| Componente | `ModalAdicionarAlimento` |
| Endpoints | `GET /api/nutricao/tbca/alimentos`, `POST /api/nutricao/tbca/calcular` |

### 9.1. Busca de Alimentos

| Parametro | Detalhe |
|-----------|---------|
| Endpoint | `GET /api/nutricao/tbca/alimentos?busca=X&limite=30` |
| Debounce | 300ms |
| Minimo | 2 caracteres |

**Funcionalidades:**

- Campo de busca com placeholder "Buscar alimento por nome"
- Abas de fonte de dados: TBCA (ativa), IBGE, Tucunduva, Suplementos, Meus alimentos (marcadas "Em breve" com tooltips)
- Lista de resultados com:
  - Nome do alimento (formatado: `c/` -> "com", `s/` -> "sem", remove ", Brasil", ", todas as variedades", ", cru")
  - Badge com grupo alimentar
  - Indicador de selecao
- Estado vazio: "Digite ao menos 2 letras para buscar"
- Sem resultados: icone de busca + "Nenhum alimento encontrado para '{termo}'" + "Tente outro nome ou verifique a ortografia."

**Resposta esperada do endpoint (busca):**

```json
[
  {
    "id": "e21b76df-c7c4-4d80-bae3-23a936af8d82",
    "codigo_tbca": "BR281G",
    "descricao": "Frango, peito, sem pele, grelhado",
    "grupo": "Carnes e derivados",
    "fonte_dados": "tbca",
    "confianca_parse": "alta",
    "apresentacao": {
      "nome_exibicao": "Frango",
      "detalhes": "peito, sem pele, grelhado",
      "modo_preparo": "Grelhado",
      "categoria": "Carnes e derivados",
      "fonte": "tbca"
    }
  }
]
```

### 9.2. Calculo de Macros

| Parametro | Detalhe |
|-----------|---------|
| Endpoint | `POST /api/nutricao/tbca/calcular` |
| Debounce | 300ms (ao alterar quantidade) |

**Funcionalidades:**

- Ao selecionar um alimento, exibe painel com:
  - 5 MacroCards: Calorias (kcal), Proteina (g), Carboidrato (g), Gordura (g), Fibra (g)
  - Valores formatados: inteiro sem decimal (ex: "279"), fracionario com 1 casa e virgula (ex: "31,2")
- Campo de quantidade (default: 100g) com validacao inline:
  - Vazio: "Informe a quantidade."
  - Zero: "A quantidade deve ser maior que zero."
  - Negativo: "A quantidade deve ser um valor positivo."
- Recalculo automatico ao alterar quantidade

**Request body:**

```json
{
  "alimento_id": "e21b76df-...",
  "quantidade_consumida": 150.5
}
```

**Resposta esperada:**

```json
{
  "alimento": "Frango, peito, sem pele, grelhado",
  "quantidade_consumida": "150.5",
  "unidade": "g",
  "resumo_macros": {
    "calorias": "279.00",
    "proteinas": "45.00",
    "carboidratos": "0.00",
    "gorduras": "11.00",
    "fibras": "0.00"
  },
  "composicao": [
    {
      "nutriente": "Proteina",
      "simbolo": "PROT",
      "valor": "45.00",
      "valor_texto": null,
      "unidade": "g"
    }
  ]
}
```

> **Nota:** Todos os valores numericos em `resumo_macros` e `composicao.valor` sao strings. O frontend converte para numero via `formatNutrient()`.

### 9.3. Adicao de Alimento

- **"Adicionar e fechar":** Adiciona o alimento a refeicao, exibe toast "Alimento adicionado a refeicao", fecha o modal
- **"Adicionar e buscar outro":** Adiciona o alimento, exibe toast "Alimento adicionado. Busque o proximo.", limpa campos e foca no input de busca
- Botoes desabilitados enquanto nenhum alimento esta selecionado ou a quantidade e invalida

---

## 10. Camada de Normalizacao Frontend-Backend

O frontend possui uma camada de normalizacao (`client/src/lib/api-normalizers.ts`) que trata diferencas entre o formato mock/staging e o contrato real do backend.

### 10.1. Normalizacoes aplicadas

| Situacao | Tratamento |
|----------|------------|
| `grupo_alimentar.nome` (objeto) vs `grupo` (string) | Detecta automaticamente e extrai o valor correto |
| `fonte_dados` lowercase ("tbca") | Converte para uppercase ("TBCA") |
| `alimento_nome` vs `nome` em alimentos de refeicao | Aceita ambos os campos |
| `quantidade` como string ("150.50") | Converte para numero via `parseFloat` com guard NaN |
| `horario` como "HH:mm:ss" | Remove segundos para exibicao ("HH:mm"), appenda `:00` ao enviar |
| `paciente_id` (int) vs `pacienteId` (string) | Normaliza para string |
| Campos ausentes (`diasAtivos`, `dataCriacao`, `nutrientes`) | Fallbacks seguros (array vazio, data atual, objeto zerado) |
| `alimento_tbca_id` no payload de criacao | Propagado do UUID original da TBCA |
| Bloco `apresentacao` nos resultados de busca | Preservado no tipo `ApresentacaoAlimento` |

### 10.2. Funcoes exportadas

| Funcao | Uso |
|--------|-----|
| `normalizarAlimentoTBCA(raw)` | Normaliza resultado individual da busca TBCA |
| `normalizarResultadosTBCA(dados)` | Normaliza array de resultados |
| `normalizarAlimentoPlano(raw)` | Normaliza alimento dentro de refeicao (leitura) |
| `normalizarRefeicao(raw)` | Normaliza refeicao com alimentos e horario |
| `normalizarPlanoAlimentar(raw)` | Normaliza plano alimentar completo |
| `normalizarResumoPlano(raw)` | Normaliza resumo de plano (listagem) |
| `montarPayloadRefeicao(...)` | Monta payload para POST de criacao de refeicao |

---

## 11. Endpoints Consumidos — Resumo Completo

### 11.1. Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/pair` | Login do profissional |

### 11.2. Gestao de Clientes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/profissional/pacientes` | Listar todos os clientes |
| GET | `/api/profissional/pacientes/:id` | Detalhe de um cliente |
| GET | `/api/profissional/pacientes/:id/metas` | Consultar metas do cliente |
| PUT | `/api/profissional/pacientes/:id/metas` | Atualizar metas do cliente |

### 11.3. Dashboard

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/profissional/dashboard/pacientes/:id/overview` | Dados da visao geral |
| GET | `/api/profissional/dashboard/pacientes/:id/nutricao` | Dados de nutricao |
| GET | `/api/profissional/dashboard/pacientes/:id/biometria` | Dados de biometria |
| GET | `/api/profissional/dashboard/pacientes/:id/treinamento` | Dados de treinamento |

### 11.4. Planos Alimentares

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `.../pacientes/:id/planos-alimentares` | Listar planos do cliente |
| GET | `.../pacientes/:id/plano-alimentar?planoId=X&diaSemana=Y` | Detalhe de um plano |
| PUT | `.../planos-alimentares/:planoId/dias` | Atualizar dias ativos |
| PUT | `.../planos-alimentares/:planoId/descricao` | Atualizar descricao do plano |
| POST | `.../planos-alimentares/:planoId/refeicoes` | Criar nova refeicao |

### 11.5. Modulo TBCA (Nutricao)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/nutricao/tbca/alimentos?busca&limite` | Buscar alimentos TBCA |
| GET | `/api/nutricao/tbca/alimentos/:id` | Detalhe do alimento |
| POST | `/api/nutricao/tbca/calcular` | Calcular macros por quantidade |
| GET | `/api/nutricao/alimentos/buscar?q&limite` | Busca legado (fallback) |

---

## 12. Funcionalidades Visuais (Nao Dependem de Backend)

| Funcionalidade | Descricao |
|----------------|-----------|
| Tema claro/escuro | Toggle no sidebar, persistido em `localStorage` |
| Sidebar colapsavel | Toggle de expansao/recolhimento |
| Formatacao de nomes de alimentos | `c/` -> "com", `s/` -> "sem", remove sufixos desnecessarios |
| Formatacao de nutrientes | Inteiro sem decimal, fracionario com 1 casa e virgula |
| Skeleton loading | Estados de carregamento em todas as queries |
| Toasts de feedback | Notificacoes de sucesso/erro em todas as acoes |
| Responsividade | Layout adaptavel para diferentes tamanhos de tela |

---

## 13. Funcionalidades Planejadas (Frontend Pronto, Backend Pendente)

| Funcionalidade | Botao/UI visivel | Endpoint sugerido |
|----------------|------------------|-------------------|
| Editar refeicao | Botao de edicao no card | `PUT .../refeicoes/:refeicaoId` |
| Excluir refeicao | Botao de lixeira no card | `DELETE .../refeicoes/:refeicaoId` |
| Duplicar refeicao | Botao de copia no card | `POST .../refeicoes/:refeicaoId/duplicar` |
| Adicionar substituta | Link "Adicionar substituta" | A definir |
| Busca em fontes adicionais | Abas IBGE, Tucunduva, Suplementos, Meus alimentos | Endpoints por fonte |
| Bloco de apresentacao na busca | Tipo `ApresentacaoAlimento` ja definido | Dados ja vem do backend |

---

## 14. Tipos de Referencia (TypeScript)

```typescript
type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
type FonteAlimento = "TBCA" | "IBGE" | "TUCUNDUVA" | "SUPLEMENTOS" | "MEUS_ALIMENTOS";

interface AlimentoPlano {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  grupo?: string;
  alimentoTbcaId?: string;
}

interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  alimentos: AlimentoPlano[];
  observacao?: string;
  substitutas?: Refeicao[];
}

interface ResumoMacros {
  calorias: number | string;
  proteinas: number | string;
  carboidratos: number | string;
  gorduras: number | string;
  fibras: number | string;
}

interface ApresentacaoAlimento {
  nomeExibicao: string;
  detalhes: string;
  modoPreparo: string;
  categoria: string;
  fonte: string;
}

interface PlanoAlimentar {
  id: string;
  pacienteId: string;
  descricao: string;
  status: "ativo" | "rascunho";
  diaSemana: DiaSemana;
  diasAtivos: DiaSemana[];
  dataCriacao: string;
  refeicoes: Refeicao[];
  nutrientes: NutrientesPlano;
}

interface NutrientesPlano {
  calorias: number;
  proteina: { gramas: number; percentual: number };
  carboidrato: { gramas: number; percentual: number };
  gordura: { gramas: number; percentual: number };
  fibra: number;
}

interface ResumoPlanoAlimentar {
  id: string;
  descricao: string;
  status: "ativo" | "rascunho";
  diasAtivos: DiaSemana[];
  dataCriacao: string;
  calorias: number;
}
```
