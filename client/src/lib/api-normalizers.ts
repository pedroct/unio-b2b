import type {
  AlimentoPlano,
  Refeicao,
  PlanoAlimentar,
  ResumoPlanoAlimentar,
  ResumoMacros,
  NutrientesPlano,
  DiaSemana,
  FonteAlimento,
  ApresentacaoAlimento,
} from "@shared/schema";
import { fetchWithAuth } from "./queryClient";

function safeParseFloat(value: any): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatHorarioInterno(h: string): string {
  if (!h) return "";
  return h.replace(/^(\d{2}:\d{2}):?\d{0,2}$/, "$1");
}

function toUpperFonte(fonte: string): FonteAlimento {
  const upper = (fonte || "TBCA").toUpperCase();
  if (upper === "MANUAL") return "MEUS_ALIMENTOS";
  if (["TBCA", "TACO", "IBGE", "USDA", "SUPLEMENTOS", "MEUS_ALIMENTOS"].includes(upper)) {
    return upper as FonteAlimento;
  }
  return "TBCA";
}

function normalizarApresentacao(raw: any): ApresentacaoAlimento | undefined {
  if (!raw) return undefined;
  return {
    nomeExibicao: raw.nome_exibicao ?? raw.nomeExibicao ?? "",
    detalhes: raw.detalhes ?? "",
    modoPreparo: raw.modo_preparo ?? raw.modoPreparo ?? "",
    categoria: raw.categoria ?? "",
    fonte: raw.fonte ?? "",
  };
}

export interface ResultadoBuscaNormalizado {
  id: string;
  nome: string;
  grupo?: string;
  fonte: FonteAlimento;
  caloriasPor100g: number | null;
  proteinaPor100g: number | null;
  carboidratoPor100g: number | null;
  gorduraPor100g: number | null;
  fibraPor100g: number | null;
  apresentacao?: ApresentacaoAlimento;
}

export function normalizarAlimentoTBCA(item: any): ResultadoBuscaNormalizado {
  const grupo =
    typeof item.grupo === "string"
      ? item.grupo
      : typeof item.grupo_alimentar === "string"
        ? item.grupo_alimentar
        : item.grupo_alimentar?.nome ?? undefined;

  return {
    // staging pode retornar id como número inteiro — convertemos para string
    id: String(item.id),
    nome: item.descricao ?? item.nome ?? "",
    grupo,
    fonte: toUpperFonte(item.fonte_dados ?? item.fonte),
    // campos do contrato /catalogo/alimentos (sufixo _g) com fallback para legados
    caloriasPor100g: item.energia_kcal ?? item.calorias ?? null,
    proteinaPor100g: item.proteina_g ?? item.proteinas ?? item.proteina ?? null,
    carboidratoPor100g: item.carboidrato_g ?? item.carboidratos ?? item.carboidrato ?? null,
    gorduraPor100g: item.lipideos_g ?? item.lipideos ?? item.gorduras ?? item.gordura ?? null,
    fibraPor100g: item.fibra_g ?? item.fibras ?? item.fibra ?? null,
    apresentacao: normalizarApresentacao(item.apresentacao),
  };
}

export function normalizarResultadosTBCA(dados: any[]): ResultadoBuscaNormalizado[] {
  return dados.map(normalizarAlimentoTBCA);
}

export function normalizarListagemCatalogo(raw: any): ResultadoBuscaNormalizado[] {
  const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
  return items.map(normalizarAlimentoTBCA);
}

export function normalizarAlimentoPlano(raw: any): AlimentoPlano {
  return {
    id: raw.id ?? "",
    nome: raw.alimento_nome ?? raw.nome ?? "",
    quantidade: safeParseFloat(raw.quantidade),
    unidade: raw.unidade ?? "g",
    grupo: raw.grupo,
    // staging usa alimento_id; também aceita alimento_tbca_id do formato anterior
    alimentoTbcaId: raw.alimento_id ?? raw.alimento_tbca_id ?? raw.alimentoTbcaId,
  };
}

export function normalizarRefeicao(raw: any): Refeicao {
  return {
    id: raw.id ?? "",
    nome: raw.nome ?? "",
    horario: formatHorarioInterno(raw.horario ?? ""),
    alimentos: (raw.alimentos ?? []).map(normalizarAlimentoPlano),
    observacao: raw.observacao,
    substitutas: raw.substitutas
      ? (raw.substitutas as any[]).map(normalizarRefeicao)
      : undefined,
  };
}

export function normalizarPlanoAlimentar(raw: any): PlanoAlimentar {
  const refeicoes = (raw.refeicoes ?? []).map(normalizarRefeicao);

  // Sempre constrói um NutrientesPlano completo, mesmo que raw.nutrientes seja parcial
  const rn = raw.nutrientes;
  const nutrientes: NutrientesPlano = {
    calorias:    Number(rn?.calorias    ?? 0),
    proteina:    rn?.proteina    ?? { gramas: 0, percentual: 0 },
    carboidrato: rn?.carboidrato ?? { gramas: 0, percentual: 0 },
    gordura:     rn?.gordura     ?? { gramas: 0, percentual: 0 },
    fibra:       Number(rn?.fibra ?? 0),
  };

  return {
    id: raw.id ?? "",
    // staging usa cliente_id; mocks usam paciente_id ou pacienteId
    pacienteId: String(raw.cliente_id ?? raw.paciente_id ?? raw.pacienteId ?? ""),
    descricao: raw.descricao ?? "",
    status: raw.status ?? "rascunho",
    diaSemana: raw.diaSemana ?? raw.dia_semana ?? ("segunda" as DiaSemana),
    // staging não retorna diasAtivos — padrão []
    diasAtivos: raw.diasAtivos ?? raw.dias_ativos ?? [],
    dataCriacao: raw.dataCriacao ?? raw.data_criacao ?? "",
    refeicoes,
    nutrientes,
  };
}

export function normalizarResumoPlano(raw: any): ResumoPlanoAlimentar {
  return {
    id: raw.id ?? "",
    descricao: raw.descricao ?? "",
    status: raw.status ?? "rascunho",
    diasAtivos: raw.diasAtivos ?? raw.dias_ativos ?? [],
    dataCriacao: raw.dataCriacao ?? raw.data_criacao ?? new Date().toISOString(),
    calorias: safeParseFloat(raw.calorias),
    totalRefeicoes: Array.isArray(raw.refeicoes) ? raw.refeicoes.length : 0,
  };
}

export interface EnriquecimentoPlano {
  nutrientes: NutrientesPlano;
  planoEnriquecido: PlanoAlimentar;
}

// Calcula os nutrientes totais de um plano chamando /calcular para cada alimento
// e enriquece cada AlimentoPlano com o campo `calorias`.
// Usado após qualquer alteração local no plano (editar/excluir refeição).
export async function calcularNutrientesPlano(plano: PlanoAlimentar): Promise<EnriquecimentoPlano> {
  const zeroNutrientes: NutrientesPlano = {
    calorias: 0,
    proteina:    { gramas: 0, percentual: 0 },
    carboidrato: { gramas: 0, percentual: 0 },
    gordura:     { gramas: 0, percentual: 0 },
    fibra: 0,
  };

  // Monta lista plana de alimentos com índice de refeição + posição
  const foods = plano.refeicoes.flatMap((r, ri) =>
    r.alimentos
      .map((a, ai) => ({ a, ri, ai }))
      .filter(({ a }) => a.alimentoTbcaId && a.quantidade > 0)
  );

  if (foods.length === 0) {
    return { nutrientes: zeroNutrientes, planoEnriquecido: plano };
  }

  const resultados = await Promise.all(
    foods.map(({ a }) =>
      fetchWithAuth("/api/nutricao/catalogo/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alimento_id: a.alimentoTbcaId, quantidade_consumida: a.quantidade }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  // Acumula totais e registra calorias por alimento
  let calorias = 0, proteina = 0, carboidrato = 0, gordura = 0, fibra = 0;
  const calPorAlimento = new Map<string, number>(); // id → kcal

  foods.forEach(({ a }, idx) => {
    const m = resultados[idx]?.resumo_macros;
    if (!m) return;
    const kcal = Number(m.calorias ?? m.energia_kcal ?? 0);
    calorias    += kcal;
    proteina    += Number(m.proteinas   ?? m.proteina_g    ?? 0);
    carboidrato += Number(m.carboidratos ?? m.carboidrato_g ?? 0);
    gordura     += Number(m.gorduras    ?? m.lipideos_g    ?? 0);
    fibra       += Number(m.fibras      ?? m.fibra_g       ?? 0);
    calPorAlimento.set(a.id, Math.round(kcal));
  });

  const totalMacros = proteina + carboidrato + gordura;
  const pct = (g: number) => totalMacros > 0 ? Math.round((g / totalMacros) * 100) : 0;

  const nutrientes: NutrientesPlano = {
    calorias: Math.round(calorias),
    proteina:    { gramas: Math.round(proteina * 10) / 10,    percentual: pct(proteina) },
    carboidrato: { gramas: Math.round(carboidrato * 10) / 10, percentual: pct(carboidrato) },
    gordura:     { gramas: Math.round(gordura * 10) / 10,     percentual: pct(gordura) },
    fibra: Math.round(fibra * 10) / 10,
  };

  // Enriquece os alimentos do plano com o campo `calorias`
  const planoEnriquecido: PlanoAlimentar = {
    ...plano,
    refeicoes: plano.refeicoes.map((r) => ({
      ...r,
      alimentos: r.alimentos.map((a) => ({
        ...a,
        calorias: calPorAlimento.has(a.id) ? calPorAlimento.get(a.id) : a.calorias,
      })),
    })),
  };

  return { nutrientes, planoEnriquecido };
}

export function montarPayloadRefeicao(
  nome: string,
  horario: string,
  alimentos: AlimentoPlano[],
  observacao?: string,
) {
  const horarioFormatado =
    horario.length === 5 ? `${horario}:00` : horario;

  return {
    nome,
    horario: horarioFormatado,
    observacao: observacao || undefined,
    alimentos: alimentos.map((a) => ({
      id: a.id,
      // staging usa alimento_id conforme AlimentoPlanoInSchema
      alimento_id: a.alimentoTbcaId ?? a.id,
      quantidade: a.quantidade,
      unidade: a.unidade,
    })),
  };
}
