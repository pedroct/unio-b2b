# PRD – Painel de Longevidade (V3 Consolidada)

> **Versão:** 3.0
> **Última atualização:** 2026-03-03
> **Status:** Em validação
> **Autor:** Pedro Teixeira
> **Documentos relacionados:** [[V1 Escopo Saúde Cardiovascular e Recuperação]], [[UNIO Design Tokens v3]], [[Design Tokens Longevidade V1]]

---

## 1. Visão Geral do Produto

O **Painel de Longevidade** é uma plataforma digital orientada a biomarcadores estruturais de saúde, com foco em prevenção cardiovascular, resiliência autonômica, composição corporal, recuperação e desempenho funcional.

O sistema consolida dados do Apple Health (via app iOS próprio), processa-os em backend (Python + Django Ninja) e apresenta dashboards clínicos no frontend (React) para suporte à decisão por profissionais de saúde.

**Posicionamento central:** O Painel de Longevidade é um **painel de estado biológico**, não um painel de hábitos. A organização segue sistemas fisiológicos — não categorias comportamentais.

---

## 2. Modelo Mental do Produto

O Painel de Longevidade opera em três níveis hierárquicos. A pirâmide informacional parte do estado biológico (topo) e desce até comportamentos (base):

```
Nível 1 — Estado Biológico (Scores)
    Cardiovascular | Metabólico | Recuperação | Funcional

Nível 2 — Sistemas (Eixos Fisiológicos)
    Cardiometabólico | Sono & Recuperação | Performance

Nível 3 — Comportamentos (Drivers)
    Nutrição | Treino | Hidratação
```

**Princípio:** Comportamentos explicam biomarcadores. Biomarcadores compõem scores. Scores revelam estado biológico. O produto começa pelo Nível 1 e permite drill-down até o Nível 3.

---

## 3. Objetivo do Produto

Transformar dados brutos de saúde em indicadores estratégicos que permitam:

- Monitoramento longitudinal de sistemas biológicos
- Identificação precoce de risco cardiovascular e autonômico
- Suporte à tomada de decisão clínica com scores sintéticos
- Otimização de performance e recuperação
- Correlação entre comportamentos (nutrição, treino) e estado biológico
- Gestão ativa da longevidade com base em evidência

---

## 4. Problema a Ser Resolvido

Dados de saúde estão fragmentados em múltiplos apps e apresentados como métricas isoladas (passos, calorias, treinos).

Problemas identificados:

- **Falta de integração fisiológica** — cada app mostra uma fatia, nenhum conecta os sistemas
- **Ausência de indicadores sintéticos** — profissionais precisam calcular mentalmente
- **Alto esforço cognitivo** — interpretar dezenas de métricas brutas consome tempo clínico
- **Foco em comportamento, não em estado biológico** — apps medem o que você faz, não como seu corpo está
- **Nutrição isolada** — dados alimentares não se conectam com biomarcadores clínicos
- **Pirâmide invertida** — produtos existentes começam por comportamentos em vez de estado biológico

---

## 5. Público-Alvo e Personas

### 5.1 Personas Primárias (Profissionais)

#### 🫀 Persona 1 — Dr. Rafael, Cardiologista

- **Contexto:** Acompanha pacientes com risco cardiovascular moderado a alto.
- **Job-to-be-done:** Identificar deterioração autonômica e risco cardiovascular antes que se manifeste clinicamente.
- **Biomarcadores de interesse:** HRV (tendência), FCR, VO₂, Recuperação FC, Score Cardiovascular. Futuro: PA, ApoB.
- **Abas que acessa:** Cockpit + Sistema Cardiometabólico
- **Frequência de uso:** Antes de cada retorno (quinzenal/mensal).
- **Dor atual:** Depende de relato subjetivo; não tem dados objetivos entre consultas.

#### 🥗 Persona 2 — Dr. Marcos, Nutrologista

- **Contexto:** Prescreve protocolos nutricionais e suplementação baseados em dados clínicos.
- **Job-to-be-done:** Correlacionar intervenções nutricionais com impacto em composição corporal, sono e marcadores metabólicos.
- **Biomarcadores de interesse:** % gordura, massa magra, sono, HRV noturna, glicemia (futuro), Score Metabólico, Score Recuperação.
- **Abas que acessa:** Cockpit + Sistema Cardiometabólico + Recuperação & Sono
- **Frequência de uso:** Retornos quinzenais a mensais.
- **Dor atual:** Não tem visibilidade sobre impacto real da dieta além de peso e medidas.

#### 🏋️ Persona 3 — Camila, Personal Trainer

- **Contexto:** Trabalha com clientes focados em performance e longevidade.
- **Job-to-be-done:** Ajustar periodização e volume de treino com base em recuperação autonômica real.
- **Biomarcadores de interesse:** HRV diária, Recovery score, volume semanal, PSE, Recuperação FC, velocidade caminhada, Score Funcional.
- **Abas que acessa:** Cockpit + Performance & Funcionalidade
- **Frequência de uso:** Antes de cada sessão ou ao planejar a semana.
- **Dor atual:** Usa PSE como único indicador de recuperação; falta dado objetivo.

### 5.2 Persona Secundária (Paciente/Cliente)

#### Persona 4 — Lucas, Paciente orientado a dados

- **Contexto:** 42 anos, usa Apple Watch, interessado em envelhecimento saudável.
- **Job-to-be-done:** Acompanhar a evolução da própria saúde com indicadores claros e confiáveis.
- **Prioridade informacional:** Scores gerais → tendência → o que melhorou ou piorou.
- **Frequência de uso:** 3–5x por semana (checagem rápida).
- **Dor atual:** Apple Health mostra dados brutos sem contexto clínico.

---

## 6. Arquitetura de Navegação — 5 Abas

### 6.1 Estrutura Definitiva

| # | Aba | Conteúdo | Público principal | Status V1 |
|---|-----|----------|-------------------|-----------|
| 1 | **Cockpit** | 4 Scores Estruturais + tendência + alertas | Todos | ✅ Ativo (apenas Score Cardiovascular) |
| 2 | **Sistema Cardiometabólico** | HRV, FCR, VO₂, Recuperação FC, % gordura, circunferência, peso tendência, glicemia (futuro) | Cardiologista, Nutrologista | ✅ Parcial (apenas biomarcadores cardiovasculares) |
| 3 | **Recuperação & Sono** | Tempo sono, REM/profundo, HRV noturna, FC noturna, carga treino vs HRV, exposição solar | Nutrologista, Personal | 🔒 Em breve |
| 4 | **Performance & Funcionalidade** | Volume semanal, zonas treino, Recuperação FC, velocidade caminhada, estabilidade, força | Personal Trainer | 🔒 Em breve |
| 5 | **Nutrição** | Proteína relativa (g/kg), correlação com massa magra, carboidrato vs glicemia, calorias vs gasto vs peso | Nutrologista, Nutricionista | 🔒 Em breve |

### 6.2 Decisões Arquiteturais

**Por que 5 abas e não 4:**
A estrutura anterior (Visão Geral, Nutrição, Biometria, Treinamento) organizava por comportamento. A nova estrutura organiza por sistemas fisiológicos, alinhando com o modelo mental de 3 níveis. Nutrição deixa de ser uma aba isolada e passa a funcionar como driver biológico — explicando biomarcadores, não apenas registrando refeições.

**O que NÃO fazer:**
- Distribuir HRV na aba de Performance e FCR na aba Cardiometabólico separadamente
- Isolar Nutrição dos biomarcadores que ela impacta
- Criar abas por tipo de dado (gráficos, tabelas, listas)
- Organizar por comportamento em vez de sistema biológico

### 6.3 Abas "Em Breve" — Comportamento na V1

Abas marcadas como 🔒 devem:

- Aparecer na navegação (o usuário vê a estrutura completa)
- Exibir estado bloqueado com ícone de cadeado
- Mostrar mensagem contextual: "Recuperação & Sono estará disponível em breve. Você será notificado quando essa análise for liberada."
- **Não** exibir dados parciais nem placeholders numéricos
- Coletar interesse: botão "Me avise quando disponível" (opcional, para métricas de priorização)

---

## 7. Aba 1 — Cockpit (Detalhamento)

O Cockpit é o verdadeiro Painel de Longevidade. É a primeira tela que qualquer profissional vê.

### 7.1 Linha 1 — 4 Scores Estruturais

| Score | Composição | Status V1 |
|-------|-----------|-----------|
| **Score Cardiovascular** | VO₂ (35%) + HRV (30%) + Recuperação FC (20%) + FCR (15%) | ✅ Ativo |
| **Score Metabólico** | % gordura + massa magra + circunferência + tendência peso. Futuro: glicemia | 🔒 V2 |
| **Score Recuperação** | Tempo sono + REM/profundo + HRV noturna + FC noturna | 🔒 V2 |
| **Score Funcional** | Volume semanal + velocidade caminhada + estabilidade + força | 🔒 V3 |

**Na V1:** O Cockpit exibe o Score Cardiovascular como card principal. Os 3 scores restantes aparecem como cards com estado "Em breve" — visíveis mas não calculados.

### 7.2 Linha 2 — Tendência e Alertas

- Gráfico de tendência do score ativo (30/90/365 dias)
- Alertas clínicos contextuais (ex: "HRV em queda consistente nos últimos 14 dias")
- Na V1: apenas tendência do Score Cardiovascular

### 7.3 Score Cardiovascular — Detalhamento V1

**Fórmula ponderada:**

| Biomarcador | Peso | Justificativa |
|---|---|---|
| VO₂ Máximo | 35% | Maior preditor independente de mortalidade cardiovascular |
| HRV (RMSSD) | 30% | Indicador de resiliência autonômica e capacidade adaptativa |
| Recuperação da FC | 20% | Marcador de tônus vagal pós-esforço |
| FCR | 15% | Indicador geral de eficiência cardíaca em repouso |

**Resultado:** 0–100

**Classificação clínica — Ranges de corte:**

| Faixa | Score | Cor | Descrição |
|---|---|---|---|
| Excelente | 80–100 | `--score-excellent-*` | Estado cardiovascular robusto, indicadores no quartil superior para idade e sexo |
| Bom | 60–79 | `--score-good-*` | Indicadores dentro da faixa saudável, sem sinais de alerta |
| Atenção | 40–59 | `--score-attention-*` | Um ou mais indicadores abaixo do esperado; investigação complementar recomendada |
| Risco Aumentado | 0–39 | `--score-risk-*` | Indicadores consistentemente deteriorados; ação clínica recomendada |

> **Versão da fórmula:** `v1.0` — Qualquer ajuste de corte deve ser documentado com justificativa clínica e registrado no changelog da fórmula (ver RF6).

---

## 8. Aba 2 — Sistema Cardiometabólico (Detalhamento)

Agrupa biomarcadores dos eixos cardiovascular e metabólico em uma visão integrada.

### 8.1 Conteúdo Completo (Visão de Produto)

| Biomarcador | Eixo | Fonte | Status V1 |
|---|---|---|---|
| HRV (RMSSD) | Cardiovascular | Apple Health | ✅ |
| FCR | Cardiovascular | Apple Health | ✅ |
| VO₂ Máximo | Cardiovascular | Apple Health | ✅ |
| Recuperação FC (1min) | Cardiovascular | Apple Health | ✅ |
| % Gordura Corporal | Metabólico | Bioimpedância / Manual | 🔒 V2 |
| Circunferência Abdominal | Metabólico | Manual | 🔒 V2 |
| Peso (tendência) | Metabólico | Apple Health / Balança | 🔒 V2 |
| Glicemia contínua | Metabólico | CGM (futuro) | 🔒 V3+ |

### 8.2 Entrega V1

Na V1, a aba Sistema Cardiometabólico exibe:

- 4 cards de biomarcadores cardiovasculares (HRV, FCR, VO₂, Recuperação FC)
- Cada card com: média 30 dias, tendência, comparação com baseline
- VO₂ com percentil por idade e sexo
- Seção "Metabólico" visível mas com estado "Em breve"

### 8.3 Conexões Futuras (V2+)

- % gordura ↔ proteína relativa (Nutrição)
- Circunferência ↔ risco cardiometabólico
- Peso tendência ↔ calorias vs gasto (Nutrição)
- Glicemia ↔ carboidrato (Nutrição)

---

## 9. Aba 3 — Recuperação & Sono (Visão de Produto)

> **Status:** 🔒 Inteiramente V2. Documentada aqui para visão de produto.

### 9.1 Conteúdo Planejado

| Biomarcador | Fonte | Importância |
|---|---|---|
| Tempo total de sono | Apple Health | Base de recuperação |
| Estágios: REM / Profundo | Apple Health | Qualidade do sono |
| HRV noturna | Apple Health | Recuperação autonômica |
| FC noturna | Apple Health | Estado simpático/parassimpático |
| Carga treino vs HRV | Calculado | Equilíbrio esforço-recuperação |
| Exposição solar | Manual / HealthKit (futuro) | Ritmo circadiano |

### 9.2 Score Recuperação

Composição planejada:
- Tempo sono (peso a definir)
- Qualidade sono — REM + Profundo (peso a definir)
- HRV noturna vs baseline (peso a definir)
- FC noturna (peso a definir)

### 9.3 Público Principal

- **Nutrologista:** Correlação sono ↔ metabolismo, HRV noturna ↔ intervenção alimentar
- **Personal Trainer:** Carga de treino vs capacidade de recuperação real

---

## 10. Aba 4 — Performance & Funcionalidade (Visão de Produto)

> **Status:** 🔒 Inteiramente V3. Documentada aqui para visão de produto.

### 10.1 Conteúdo Planejado

| Biomarcador | Fonte | Importância |
|---|---|---|
| Volume semanal de treino | Apple Health / Manual | Carga total |
| Zonas de frequência cardíaca | Apple Health | Intensidade de treino |
| Recuperação FC | Apple Health | Tônus vagal pós-esforço |
| Velocidade de caminhada | Apple Health | Marcador de envelhecimento funcional |
| Estabilidade | Apple Health | Risco de queda / equilíbrio |
| Força | Manual / Dispositivos | Capacidade muscular |

### 10.2 Score Funcional

Composição planejada:
- Volume semanal adequado à meta (peso a definir)
- Distribuição por zonas de FC (peso a definir)
- Velocidade de caminhada vs referência por idade (peso a definir)
- Estabilidade (peso a definir)

### 10.3 Público Principal

- **Personal Trainer:** Aba primária de trabalho diário — periodização, ajuste de carga, acompanhamento funcional

---

## 11. Aba 5 — Nutrição como Driver Biológico (Visão de Produto)

> **Status:** 🔒 V2+. Documentada aqui para visão de produto.

### 11.1 Mudança Conceitual

Nutrição **não é uma aba isolada de registro alimentar**. No Painel de Longevidade, Nutrição funciona como driver biológico — sua função é **explicar biomarcadores**.

### 11.2 Correlações Obrigatórias

| Dado Nutricional | Biomarcador Impactado | Visualização |
|---|---|---|
| Proteína relativa (g/kg peso) | Massa magra (tendência) | Proteína ↓ → risco massa magra ↓ |
| Carboidrato (carga glicêmica) | Glicemia / variabilidade glicêmica | Carboidrato alto → variação glicêmica ↑ |
| Calorias ingeridas vs gasto | Peso (tendência) | Superávit/déficit → tendência peso |
| Micronutrientes críticos | Marcadores laboratoriais (futuro) | Ferro, B12, D → correlação com fadiga/performance |

### 11.3 Requisito Fundamental

**Proteína relativa ao peso corporal (g/kg)** é métrica obrigatória. Proteína absoluta (g/dia) não é clinicamente útil sem contexto de peso. Isso é decisivo para avaliação de massa magra.

### 11.4 Integração com Módulo Nutrição Existente

A aba Nutrição do Painel de Longevidade **puxa dados do módulo Nutrição existente na UNIO** e os apresenta sob a ótica de correlação com biomarcadores. Não duplica funcionalidade de registro alimentar — transforma dados nutricionais em insight biológico.

---

## 12. Distribuição por Profissional — Mapa de Acesso

| Aba | 🫀 Cardiologista | 🥗 Nutrologista | 🏋️ Personal |
|-----|:-:|:-:|:-:|
| Cockpit | ✅ Primária | ✅ Primária | ✅ Primária |
| Sistema Cardiometabólico | ✅ Primária | ✅ Secundária | ○ Consulta |
| Recuperação & Sono | ○ Consulta | ✅ Primária | ✅ Secundária |
| Performance & Funcionalidade | ○ Consulta | ○ Consulta | ✅ Primária |
| Nutrição | ○ Consulta | ✅ Primária | ○ Consulta |

**Legenda:** ✅ Primária = aba de trabalho principal | ✅ Secundária = usa frequentemente | ○ Consulta = acessa quando relevante

> **Nota V1:** Na V1, todos os profissionais convergem para Cockpit + Cardiometabólico (parcial). A diferenciação por perfil se torna relevante a partir da V2.

---

## 13. Escopo da V1

### 13.1 O que a V1 Entrega

- **Cockpit:** Score Cardiovascular ativo (0–100) com classificação, tendência 30/90 dias. 3 scores futuros visíveis com estado "Em breve".
- **Sistema Cardiometabólico:** 4 biomarcadores cardiovasculares (HRV, FCR, VO₂, Recuperação FC) com cards individuais. Seção metabólica visível mas bloqueada.
- **Recuperação & Sono:** Aba visível na navegação, bloqueada com mensagem contextual.
- **Performance & Funcionalidade:** Aba visível na navegação, bloqueada com mensagem contextual.
- **Nutrição:** Aba visível na navegação, bloqueada com mensagem contextual.

### 13.2 O que a V1 NÃO Entrega

- Scores Metabólico, Recuperação e Funcional (calculados)
- Biomarcadores de sono, composição corporal, força
- Correlações nutrição ↔ biomarcadores
- CGM / glicemia contínua
- Machine Learning preditivo
- Alertas clínicos automáticos (V1 exibe apenas tendência visual)

### 13.3 Estados de Dados Insuficientes

**Regras de estado mínimo viável (Score Cardiovascular):**

| Biomarcador | Mínimo para cálculo individual | Mínimo para inclusão no score |
|---|---|---|
| HRV (RMSSD) | 7 dias nos últimos 14 | 14 dias nos últimos 30 |
| FCR | 7 dias nos últimos 14 | 14 dias nos últimos 30 |
| VO₂ Máximo | 1 leitura nos últimos 90 dias | 1 leitura nos últimos 90 dias |
| Recuperação da FC | 3 sessões nos últimos 30 dias | 5 sessões nos últimos 30 dias |

**Comportamento por cenário:**

| Cenário | Comportamento |
|---|---|
| 4 de 4 biomarcadores disponíveis | Score calculado normalmente |
| 3 de 4 disponíveis | Score parcial com badge "Parcial" + biomarcador ausente indicado. Pesos redistribuídos proporcionalmente |
| 2 ou menos disponíveis | Score **não calculado**. Estado "Coleta em andamento" com barra de progresso |
| Usuário novo (dia zero) | Tela de onboarding com checklist e estimativa de prazo |

**Comportamento do UI:**

- Mini-cards insuficientes: estado `--` com tooltip "Seu HRV estará disponível em ~7 dias"
- Nenhum valor numérico fictício (0, N/A)
- Linguagem orientada a progresso, não a erro

### 13.4 Onboarding — Experiência do Dia Zero

1. **Verificar conexão Apple Health** — confirmar sincronização ativa
2. **Checklist de biomarcadores** — quais dados já chegaram, quais faltam
3. **Estimativa de prazo** — quando o primeiro score será calculado
4. **Micro-feedback diário** — barra de progresso atualizada a cada dia de dados recebido

---

## 14. Fluxo do Profissional

### 14.1 Vinculação Profissional–Paciente

1. Profissional gera código de convite (6 dígitos, válido por 48h) ou envia por e-mail
2. Paciente aceita no app iOS
3. Sistema registra vínculo com timestamp e tipo de acesso (leitura)
4. Profissional visualiza paciente na lista de acompanhamento

**Revogação:** Paciente revoga a qualquer momento. Profissional é notificado. Dados históricos do período de vínculo não ficam acessíveis ao profissional após revogação.

### 14.2 Lista de Pacientes

- Ordenada por último acesso
- Para cada paciente: nome, Score Cardiovascular atual, classificação (cor), tendência 30 dias
- Filtros: classificação (Excelente/Bom/Atenção/Risco) e tendência (melhorando/estável/piorando)
- Ação: clicar abre o Cockpit individual

### 14.3 Navegação entre Pacientes

- Breadcrumb: `Lista de Pacientes > [Nome] > Cockpit`
- Setas/dropdown para alternar sem voltar à lista
- Indicador visual do paciente ativo sempre visível no header

---

## 15. Requisitos Funcionais

### V1

- **RF1:** Sistema deve calcular Score Cardiovascular diariamente para cada usuário elegível
- **RF2:** Sistema deve armazenar histórico de scores com timestamp e versão da fórmula
- **RF3:** Usuário deve visualizar tendência por período selecionável (30/90/365 dias)
- **RF4:** Profissional deve acessar apenas pacientes com vínculo ativo e autorizado
- **RF5:** Score nunca deve ser calculado no frontend
- **RF6:** Sistema deve registrar versão da fórmula em cada score calculado
- **RF7:** Sistema deve exibir estados de dados insuficientes conforme seção 13.3
- **RF8:** Sistema deve permitir vinculação e revogação profissional–paciente
- **RF9:** Profissional deve poder filtrar pacientes por classificação e tendência
- **RF10:** Sistema deve calcular score parcial quando 3 de 4 biomarcadores disponíveis
- **RF11:** Abas 3, 4 e 5 devem ser visíveis na navegação com estado bloqueado
- **RF12:** Seção metabólica da Aba 2 deve ser visível com estado "Em breve"

### V2+ (Documentados para referência)

- **RF13:** Sistema deve calcular Score Metabólico com composição corporal e peso
- **RF14:** Sistema deve calcular Score Recuperação com dados de sono e HRV noturna
- **RF15:** Nutrição deve exibir proteína relativa (g/kg peso corporal)
- **RF16:** Sistema deve correlacionar proteína ↔ massa magra e exibir tendência
- **RF17:** Sistema deve correlacionar calorias vs gasto ↔ tendência de peso
- **RF18:** Sistema deve calcular Score Funcional com dados de performance

---

## 16. Arquitetura Técnica

### 16.1 Stack

**Backend:** Python + Django + Django Ninja, PostgreSQL, Celery/cron diário, API RESTful versionada

**Frontend:** React, React Query, Componentização: `ScoreCard`, `MiniCard`, `TrendChart`, `PatientList`, `LockedTab`

**Infraestrutura:** VPS própria, Docker, TLS obrigatório

### 16.2 Modelo de Dados

**HealthMetric**

```
HealthMetric
├── id: UUID
├── user_id: FK → User
├── metric_type: ENUM [hrv_rmssd, resting_hr, vo2_max, hr_recovery_1min,
│                       body_fat_pct, waist_circ, weight,
│                       sleep_total, sleep_rem, sleep_deep,
│                       hrv_nocturnal, hr_nocturnal,
│                       walking_speed, stability, strength]
├── value: Decimal
├── unit: String [ms, bpm, mL/kg/min, %, cm, kg, min, m/s]
├── source: String [apple_health, manual, bioimpedance, cgm]
├── recorded_at: DateTime
├── synced_at: DateTime
├── created_at: DateTime
```

**LongevityScore**

```
LongevityScore
├── id: UUID
├── user_id: FK → User
├── score_type: ENUM [cardiovascular, metabolic, recovery, functional]
├── score: Decimal (0–100)
├── classification: ENUM [excellent, good, attention, risk]
├── formula_version: String [v1.0]
├── components: JSON {component_scores + weights}
├── is_partial: Boolean
├── missing_components: Array [metric_type]
├── calculated_at: DateTime
├── period_start: Date
├── period_end: Date
```

**ProfessionalPatientLink**

```
ProfessionalPatientLink
├── id: UUID
├── professional_id: FK → User
├── patient_id: FK → User
├── status: ENUM [pending, active, revoked]
├── invite_code: String (6 dígitos)
├── invite_expires_at: DateTime
├── linked_at: DateTime
├── revoked_at: DateTime (nullable)
```

### 16.3 Granularidade Temporal

| Biomarcador | Granularidade | Fonte |
|---|---|---|
| HRV (RMSSD) | Diária (média do dia) | Apple Health |
| FCR | Diária (menor valor do dia) | Apple Health |
| VO₂ Máximo | Eventual | Apple Health |
| Recuperação FC | Por sessão | Apple Health |
| Sono (total, REM, profundo) | Diária | Apple Health |
| Composição corporal | Semanal/quinzenal | Bioimpedância/Manual |
| Peso | Diária | Apple Health/Balança |

---

## 17. Requisitos Não Funcionais

- **RNF1:** Tempo de resposta da API < 300ms (p95)
- **RNF2:** Disponibilidade ≥ 99%
- **RNF3:** Autenticação via JWT com refresh token
- **RNF4:** Dados protegidos por TLS em trânsito
- **RNF5:** Versionamento da fórmula de score em cada registro
- **RNF6:** Logs de acesso profissional para auditoria
- **RNF7:** Dados sensíveis criptografados em repouso

---

## 18. Localização e Padrões (pt-BR)

| Elemento | Padrão | Exemplo |
|---|---|---|
| Separador decimal | Vírgula | `42,5 ms` |
| Separador de milhar | Ponto | `1.250 passos` |
| Data | DD/MM/AAAA | `03/03/2026` |
| Hora | HH:MM (24h) | `14:30` |
| Unidades | Padrão internacional | `mL/kg/min`, `bpm`, `ms` |
| Proteína relativa | g/kg | `1,8 g/kg` |

Textos do UI: sentence case, tom "especialista mas acessível".

---

## 19. Métricas de Sucesso

| Métrica | Meta | Como medir |
|---|---|---|
| Score calculado corretamente | 100% dos elegíveis | Testes automatizados + monitoramento |
| Compreensão do score | < 30 segundos | Teste de usabilidade |
| Engajamento semanal profissional | ≥ 3 acessos/semana | Analytics |
| Vinculação profissional–paciente | ≥ 70% convites aceitos | Funnel |
| Retenção pós-onboarding | ≥ 60% ativos após 30 dias | Cohort |
| Abandono no dia zero | < 10% | Funnel de onboarding |
| Interesse nas abas bloqueadas | Medido via "Me avise" | Contagem de registros |

---

## 20. Roadmap

| Versão | Entregas | Abas Impactadas |
|---|---|---|
| **V1** | Score Cardiovascular, 4 biomarcadores CV, navegação completa com abas bloqueadas, fluxo profissional | Cockpit (parcial), Cardiometabólico (parcial) |
| **V2** | Score Metabólico, composição corporal, Score Recuperação, dados de sono, correlações nutricionais básicas | Cockpit (2 scores), Cardiometabólico (completa), Recuperação & Sono, Nutrição |
| **V3** | Score Funcional, performance, força, velocidade caminhada, correlações avançadas | Performance & Funcionalidade, Cockpit (4 scores) |
| **V4+** | ML preditivo, alertas proativos, CGM, exames laboratoriais, integração completa entre pilares | Todas |

---

## 21. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Dados insuficientes para baseline | Alto | Alta | UX de progresso (seção 13.3) |
| Oscilação excessiva do score | Médio | Média | Média móvel 30d + EMA |
| Expectativa clínica elevada | Alto | Média | Disclaimer: score não substitui avaliação clínica |
| Frustração com abas bloqueadas | Médio | Média | Mensagens contextuais + "Me avise quando disponível" |
| Complexidade futura não planejada | Médio | Baixa | Escopo enxuto V1 + versionamento |
| Falha de sincronização Apple Health | Alto | Média | Alerta após 48h sem dados |
| Acesso não autorizado | Crítico | Baixa | JWT + vínculo explícito + logs |
| Nutrição desconectada dos biomarcadores | Alto | Média | Arquitetura de correlações definida desde o PRD |

---

## 22. Definição de Pronto (DoD) — V1

- [ ] Score Cardiovascular calculado diariamente
- [ ] Classificação clínica com ranges funcionando
- [ ] Tendência 30/90/365 dias funcional
- [ ] Estados de dados insuficientes implementados
- [ ] Cockpit com 4 slots de score (1 ativo + 3 bloqueados)
- [ ] Aba Cardiometabólico com 4 biomarcadores CV + seção metabólica bloqueada
- [ ] Abas 3, 4, 5 visíveis com estado bloqueado e mensagem contextual
- [ ] Fluxo de vinculação profissional–paciente funcional
- [ ] Lista de pacientes com filtros operacional
- [ ] Testes automatizados ≥ 80% de cobertura
- [ ] UX consistente com Design Tokens Longevidade V1
- [ ] Localização pt-BR validada
- [ ] Documentação da API atualizada
- [ ] Versionamento da fórmula registrado

---

## 23. Changelog do Documento

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | — | PRD original + documento de escopo V1 |
| 2.0 | 2026-03-03 | Consolidação. Adição de personas/JTBD, ranges de classificação, dados insuficientes, modelo de dados, fluxo profissional, onboarding, localização pt-BR |
| 3.0 | 2026-03-03 | Reestruturação completa de navegação: 4 abas → 5 abas por sistema fisiológico. Modelo mental de 3 níveis. 4 Scores Estruturais no Cockpit. Nutrição como driver biológico. Distribuição por perfil profissional. Modelo de dados expandido (LongevityScore genérico). Roadmap por versão e aba |

---

> **Próximos passos:**
> 1. Validar ranges de classificação cardiovascular com profissional clínico
> 2. Definir contrato de API para endpoints de score e lista de pacientes
> 3. Wireframes: Cockpit (com 3 scores bloqueados) e Cardiometabólico
> 4. Definir pesos do Score Metabólico e Score Recuperação (V2)
> 5. Especificar correlações Nutrição ↔ Biomarcadores (V2)
