# Análise — Roadmap Técnico vs. Estado Atual do Frontend

**Data:** 08/03/2026  
**Escopo:** Comparação do roadmap "Distribuição por Abas" contra o que está implementado no frontend  
**Projeto:** UNIO — Painel de Longevidade

---

## Resumo Executivo

O frontend está **alinhado com o roadmap até a versão V3**, com uma exceção: o **Score Funcional** foi ativado no Cockpit antes do previsto (roadmap diz V4, mas já está ativo conforme instruções recentes do backend). As 3 abas restantes (Recuperação & Sono, Performance & Funcionalidade, Nutrição) estão corretamente bloqueadas. **Não há ações corretivas necessárias no momento.**

---

## 1. Análise Aba por Aba

| Aba | Roadmap Diz | Estado Atual | Alinhado? | Observação |
|-----|-------------|--------------|-----------|------------|
| **Cockpit** | 4 scores: CV, Metabólico, Recuperação, Funcional | 4 cards renderizados dinamicamente baseados em `score.ativo` da API | ✅ Sim | Score Funcional ativado. Roadmap indica V4, mas a instrução do backend antecipou para agora. Sem conflito — o card respeita o campo `ativo` da API. |
| **Cardiometabólico** | V1: CV (HRV, FCR, VO2, Recuperação FC). V2: Metabólicos (gordura, cintura, peso, massa magra) | Seção CV ativa com 4 biomarcadores. Seção metabólica bloqueada via `secao_metabolica_bloqueada` da API | ✅ Sim | Correto para V2. Métricas metabólicas aguardam liberação do backend. |
| **Recuperação & Sono** | V2: Score no Cockpit (feito). V3: Aba ativada | Aba bloqueada, exibindo `AbaTrancada` com mensagem "em breve" | ✅ Sim | Score de Recuperação já aparece no Cockpit (V2). A aba detalhada precisa de implementação quando V3 for liberado. |
| **Performance & Funcionalidade** | V1–V3: bloqueada. V4: ativada | Aba bloqueada com `AbaTrancada` | ✅ Sim | Componente `aba-performance.tsx` não existe ainda. Será construído quando V4 for priorizado. |
| **Nutrição** | V1–V4: bloqueada. V5: ativada | Aba bloqueada com `AbaTrancada` | ✅ Sim | Sem ação prevista no horizonte atual. |

---

## 2. Componentes do Cockpit

| Score | Componentes no Roadmap | Componentes Implementados | Alinhado? |
|-------|----------------------|--------------------------|-----------|
| Cardiovascular | HRV, FCR, VO2, Recuperação FC | `hrv`, `fcr`, `vo2`, `recuperacao` | ✅ |
| Metabólico | gordura, cintura, peso, massa magra | `gordura`, `cintura`, `massa_magra`, `tendencia_peso` | ✅ |
| Recuperação | sono total, REM/profundo, HRV noturna, FC noturna | `sono_total`, `sono_rem_profundo`, `hrv_noturna`, `fc_noturna` | ✅ |
| Funcional | velocidade caminhada, estabilidade, força, volume treino | `velocidade_caminhada`, `estabilidade`, `forca`, `volume_treino` | ✅ |

---

## 3. Divergência Identificada (Não-Bloqueante)

| Item | Roadmap | Implementação | Risco |
|------|---------|---------------|-------|
| Score Funcional — versão de ativação | V4 | Já ativo (responde a `ativo: true` da API) | **Nenhum.** O card é dinâmico — se o backend voltar a enviar `ativo: false`, ele voltará ao estado bloqueado automaticamente. A decisão de antecipar foi do backend/produto. |

---

## 4. Itens Futuros (Sem Ação Agora)

| Versão | O que precisa ser construído no frontend | Dependência |
|--------|----------------------------------------|-------------|
| **V3** | `aba-recuperacao.tsx` — aba com métricas detalhadas de sono e recuperação | Endpoint dedicado de recuperação no backend |
| **V4** | `aba-performance.tsx` — aba com volume treino, zonas FC, velocidade caminhada, força, estabilidade | Endpoint dedicado de performance no backend |
| **V5** | `aba-nutricao.tsx` (contexto longevidade) — correlações nutricionais com biomarcadores | Endpoints de correlação nutricional no backend |
| **V3+** | Métricas metabólicas expandidas (glicemia contínua, variabilidade glicêmica, labs) na aba Cardiometabólico | Integração CGM e labs no backend |

---

## 5. Detalhamento Técnico por Aba

### 5.1. Cockpit (`aba-cockpit.tsx`)

- **4 score cards** renderizados via `CardScore`, ordenados por `ORDEM_PILARES`
- Cada card respeita `score.ativo` da API — se `false`, exibe estado bloqueado com cadeado
- Se `score.ativo == true` e `score.score == null`, exibe `mensagem_bloqueio` ("Coleta em andamento...")
- Se `is_partial == true`, exibe badge "Score parcial"
- Componentes filtram `null` automaticamente (`!= null`), ex: `forca: null` não renderiza card
- Campo `valor_formatado` é exibido quando presente (ex: "5h 27min" em vez de "327.3 min")
- Classificação usa valor da API (`score.classificacao`), sem lógica local de thresholds
- Gráfico de tendência com 4 linhas (CV, Metabólico, Recuperação, Funcional)

### 5.2. Cardiometabólico (`aba-cardiometabolico.tsx`)

- Seção cardiovascular ativa: HRV, FCR, VO2 Máximo, Recuperação FC
- Seção metabólica bloqueada via campo `secao_metabolica_bloqueada` da API
- Dados vêm do endpoint `/api/painel-longevidade/clientes/:id/cardiometabolico`

### 5.3. Recuperação & Sono (bloqueada)

- Renderiza `AbaTrancada` com mensagem sobre indicadores de sono, HRV noturna, estágios REM
- Botão "Me avise quando disponível" para captura de interesse
- Score de Recuperação já aparece no Cockpit (implementado em V2)

### 5.4. Performance & Funcionalidade (bloqueada)

- Renderiza `AbaTrancada` com mensagem sobre volume de treino, zonas FC, velocidade de caminhada
- Componente `aba-performance.tsx` não existe — será criado quando V4 for priorizado
- Score Funcional já aparece no Cockpit (antecipado do V4)

### 5.5. Nutrição (bloqueada)

- Renderiza `AbaTrancada` com mensagem sobre correlações nutricionais e biomarcadores
- Funcionalidades de nutrição existem em outra parte do app (prescrição alimentar), mas a integração no Painel de Longevidade aguarda V5

---

## 6. Princípio Arquitetural Confirmado

O frontend respeita o princípio do roadmap:

```
Cockpit → mostra scores consolidados e resumo de componentes
Abas    → mostram biomarcadores detalhados
```

- Score aparece primeiro no Cockpit
- Detalhamento aparece apenas na aba correspondente
- Cada aba é independente e pode ser ativada/desativada sem impacto nas demais

---

## 7. Conclusão

**Não há ações corretivas necessárias.** O frontend está corretamente implementado para o estado atual do produto. Todas as abas futuras estão bloqueadas com mensagens apropriadas, e os componentes do Cockpit estão alinhados com o roadmap. A única divergência (Score Funcional antecipado para antes de V4) é intencional e não requer ajuste — o frontend já trata isso dinamicamente via o campo `ativo` da API.
