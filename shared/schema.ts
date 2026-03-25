import { z } from "zod";

export const loginSchema = z.object({
  registrationNumber: z.string().min(1, "Informe seu registro profissional."),
  uf: z.string().min(2, "Selecione o estado do seu registro.").max(2),
  password: z.string().min(1, "Digite seu CPF para continuar."),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export interface Professional {
  id: string;
  name: string;
  registrationNumber: string;
  uf: string;
  specialty: string;
  tipoProfissional: string;
  email: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  professional: Professional;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  age: number;
  avatarUrl: string | null;
  adherenceTraining: number;
  adherenceDiet: number;
  lastActivity: string;
  status: "active" | "inactive";
}

export interface PatientGoals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration: number;
  hydrationOverride: boolean;
}

export const patientGoalsSchema = z.object({
  dailyCalories: z.number().min(500).max(10000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
  hydration: z.number().min(500).max(10000),
  hydrationOverride: z.boolean(),
});

export interface MacroNutrient {
  current: number;
  target: number;
}

export interface NutritionSummary {
  dailyCalories: number;
  targetCalories: number;
  protein: MacroNutrient;
  carbs: MacroNutrient;
  fat: MacroNutrient;
  adherencePercent: number;
  history: NutritionEntry[];
}

export interface NutritionEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BiometrySnapshot {
  weight: number;
  bodyFat: number;
  muscleMass: number;
  water: number;
}

export interface BiometrySummary {
  current: BiometrySnapshot;
  history: BiometryEntry[];
  trends: {
    weight: "up" | "down" | "stable";
    bodyFat: "up" | "down" | "stable";
    muscleMass: "up" | "down" | "stable";
  };
}

export interface BiometryEntry {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  water: number;
}

export interface TrainingSummary {
  totalSessions: number;
  weeklyAverage: number;
  adherencePercent: number;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  id: string;
  date: string;
  name: string;
  duration: number;
  volumeLoad: number;
  rpe: number;
  completed: boolean;
  exercises: number;
}

export interface PatientOverview {
  patient: Patient;
  goals: PatientGoals;
  insights: InsightCard[];
  weeklySnapshot: WeeklySnapshot;
}

export interface InsightCard {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  module: "nutrition" | "training" | "biometry" | "hydration";
}

export interface WeeklySnapshot {
  caloriesAvg: number;
  caloriesTarget: number;
  trainingSessions: number;
  trainingTarget: number;
  hydrationAvg: number;
  hydrationTarget: number;
  weightChange: number;
}

export type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

export const DIAS_SEMANA: { valor: DiaSemana; rotulo: string }[] = [
  { valor: "segunda", rotulo: "Segunda-feira" },
  { valor: "terca", rotulo: "Terça-feira" },
  { valor: "quarta", rotulo: "Quarta-feira" },
  { valor: "quinta", rotulo: "Quinta-feira" },
  { valor: "sexta", rotulo: "Sexta-feira" },
  { valor: "sabado", rotulo: "Sábado" },
  { valor: "domingo", rotulo: "Domingo" },
];

export interface AlimentoPlano {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  grupo?: string;
  alimentoTbcaId?: string;
  calorias?: number;
}

export interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  alimentos: AlimentoPlano[];
  observacao?: string;
  substitutas?: Refeicao[];
}

export const HORARIOS_REFEICAO: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

export const DESCRICOES_REFEICAO_PADRAO: string[] = [
  "Café da manhã",
  "Colação",
  "Almoço",
  "Lanche da tarde",
  "Pré-treino",
  "Pós-treino",
  "Jantar",
];

export type FonteAlimento = "TBCA" | "TACO" | "IBGE" | "USDA" | "SUPLEMENTOS" | "MEUS_ALIMENTOS";

export const FONTES_ALIMENTO: { valor: FonteAlimento; rotulo: string; disponivel: boolean; tooltip?: string }[] = [
  { valor: "TBCA", rotulo: "TBCA", disponivel: true, tooltip: "Tabela Brasileira de Composição de Alimentos" },
  { valor: "TACO", rotulo: "TACO", disponivel: true, tooltip: "Tabela TACO 4ª edição" },
  { valor: "IBGE", rotulo: "IBGE", disponivel: true, tooltip: "Pesquisa de Orçamentos Familiares — IBGE" },
  { valor: "USDA", rotulo: "USDA", disponivel: true, tooltip: "USDA Foundation Foods" },
  { valor: "SUPLEMENTOS", rotulo: "Suplementos", disponivel: false },
  { valor: "MEUS_ALIMENTOS", rotulo: "Meus alimentos", disponivel: true },
];

export interface ApresentacaoAlimento {
  nomeExibicao: string;
  detalhes: string;
  modoPreparo: string;
  categoria: string;
  fonte: string;
}

export interface AlimentoBusca {
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

export interface ResumoMacros {
  calorias: number | string;
  proteinas: number | string;
  carboidratos: number | string;
  gorduras: number | string;
  fibras: number | string;
}

export interface MacroNutrientePlano {
  gramas: number;
  percentual: number;
}

export interface NutrientesPlano {
  calorias: number;
  proteina: MacroNutrientePlano;
  carboidrato: MacroNutrientePlano;
  gordura: MacroNutrientePlano;
  fibra: number;
}

export interface PlanoAlimentar {
  id: string;
  pacienteId: string;
  profissionalId?: number;
  descricao: string;
  status: "ativo" | "rascunho";
  diaSemana: DiaSemana;
  diasAtivos: DiaSemana[];
  dataCriacao: string;
  refeicoes: Refeicao[];
  nutrientes: NutrientesPlano;
}

export interface ResumoPlanoAlimentar {
  id: string;
  descricao: string;
  status: "ativo" | "rascunho";
  diasAtivos: DiaSemana[];
  dataCriacao: string;
  calorias: number;
  totalRefeicoes: number;
}

export type ClassificacaoScore = "excellent" | "good" | "attention" | "risk";

export type TendenciaBiomarcador = "up" | "down" | "stable" | null;

export interface ComponenteScore {
  valor: number | null;
  valor_formatado?: string | null;
  unidade: string;
  tendencia: string | null;
  referencia: string | null;
  score?: number | null;
  percentile?: number | null;
  percentile_context?: string | null;
  classification?: string | null;
}

export function classificacaoVO2FromScore(score: number): string {
  if (score >= 95) return "Excelente";
  if (score >= 85) return "Muito bom";
  if (score >= 70) return "Bom";
  if (score >= 55) return "Atenção";
  return "Risco";
}

export type ComponentesCockpit = Record<string, ComponenteScore | null>;

export interface ScorePilar {
  tipo: string;
  ativo: boolean;
  score: number | null;
  classificacao: string | null;
  is_partial: boolean;
  mensagem_bloqueio: string | null;
  tendencia?: string | null;
  tendencia_score?: string | null;
  delta_30d?: number | null;
  componentes?: ComponentesCockpit | null;
}

export interface RespostaCockpit {
  cliente_id: number | string;
  scores: ScorePilar[];
  data_atualizacao: string;
}

export interface MetricaCardio {
  metric_type: string;
  valor_atual: number | null;
  unidade: string;
  media_30d: number | null;
  tendencia: string | null;
  data_ultima_leitura: string | null;
  _sparkline_mock?: number[];
}

export interface MetricaMetabolica {
  metric_type: string;
  valor: number | null;
  unidade: string;
  referencia: string | null;
}

export interface RespostaCardiometabolico {
  cliente_id: number | string;
  metricas_cardio: MetricaCardio[];
  secao_metabolica_bloqueada: boolean;
  mensagem_bloqueio?: string | null;
  mensagem_bloqueio_metabolico?: string | null;
  metricas_metabolicas?: MetricaMetabolica[] | null;
}

export interface PontoHistoricoScore {
  data: string;
  cardiovascular: number | null;
  metabolico: number | null;
  recuperacao: number | null;
  funcional: number | null;
}

export interface RespostaHistoricoScores {
  cliente_id: number | string;
  historico: PontoHistoricoScore[];
}

export const LABELS_CLASSIFICACAO: Record<ClassificacaoScore, string> = {
  excellent: "Excelente",
  good: "Bom",
  attention: "Atenção",
  risk: "Risco Aumentado",
};

export const CLASSIFICACAO_FROM_LABEL: Record<string, ClassificacaoScore> = {
  "Excelente": "excellent",
  "Bom": "good",
  "Atenção": "attention",
  "Risco Aumentado": "risk",
  "excellent": "excellent",
  "good": "good",
  "attention": "attention",
  "risk": "risk",
  "excelente": "excellent",
  "bom": "good",
  "atenção": "attention",
  "atencao": "attention",
  "risco aumentado": "risk",
  "risco": "risk",
};

export const TENDENCIA_FROM_API: Record<string, TendenciaBiomarcador> = {
  "up": "up",
  "down": "down",
  "stable": "stable",
  "subindo": "up",
  "descendo": "down",
  "caindo": "down",
  "estavel": "stable",
  "estável": "stable",
};

export interface BiomarcadorDetalhe {
  valor: number | null;
  unidade: string;
  tendencia: string | null;
  data_ultima_leitura: string | null;
}

export interface HeartRateZones {
  zone1_minutes: number;
  zone2_minutes: number;
  zone3_minutes: number;
  zone4_minutes: number;
}

export interface ScoreHeader {
  tipo: string;
  valor: number | null;
  classificacao: string | null;
  is_partial: boolean;
  tendencia_score: string | null;
}

export interface RespostaRecuperacaoSono {
  cliente_id: number | string;
  score: ScoreHeader | null;
  biomarcadores: {
    sono_total?: BiomarcadorDetalhe | null;
    sono_rem?: BiomarcadorDetalhe | null;
    sono_profundo?: BiomarcadorDetalhe | null;
    hrv_noturna?: BiomarcadorDetalhe | null;
    fc_noturna?: BiomarcadorDetalhe | null;
  };
}

export interface HistoricoSonoItem {
  data: string;
  total_min: number | null;
  sem_dormir_min: number | null;
  rem_min: number | null;
  essencial_min: number | null;
  profundo_min: number | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  fonte: string | null;
}

export interface ResumoSono {
  media_total_min: number | null;
  media_sem_dormir_min: number | null;
  media_rem_min: number | null;
  media_essencial_min: number | null;
  media_profundo_min: number | null;
  noites_sem_dados: number;
}

export interface RespostaHistoricoSono {
  cliente_id: number | string;
  intervalo: string;
  data_referencia: string;
  total_noites_com_dados: number;
  historico: HistoricoSonoItem[];
  resumo: ResumoSono;
}

export interface SessaoExercicio {
  id: number;
  tipo: string;
  tipo_hk: number;
  inicio: string;
  duracao_min: number | null;
  calorias_kcal: number | null;
  distancia_metros: number | null;
  elevacao_metros: number | null;
  mets_medio: number | null;
  indoor: boolean | null;
  fonte: string;
}

export interface ResumoPorTipoItem {
  sessoes: number;
  total_min: number;
  total_kcal: number;
}

export interface HistoricoExercicios {
  intervalo: string;
  total_sessoes: number;
  resumo_por_tipo: Record<string, ResumoPorTipoItem>;
  sessoes: SessaoExercicio[];
}

export interface RespostaPerformanceFuncional {
  cliente_id: number | string;
  score: ScoreHeader | null;
  biomarcadores: {
    exercise_minutes?: BiomarcadorDetalhe | null;
    walking_speed?: BiomarcadorDetalhe | null;
    stability?: BiomarcadorDetalhe | null;
    strength?: BiomarcadorDetalhe | null;
    heart_rate_zones?: HeartRateZones | null;
    historico_exercicios?: HistoricoExercicios | null;
  };
}

export const LABELS_BIOMARCADOR: Record<string, string> = {
  hrv_rmssd: "HRV",
  resting_hr: "FC de Repouso",
  vo2_max: "VO₂ Máximo",
  hr_recovery_1min: "Recuperação da FC",
};

export interface NutricaoMacros {
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
}

export interface NutricaoRegistroDia {
  data: string;
  refeicoes_registradas: number;
  calorias_consumidas: number;
  meta_calorica: number | null;
  aderencia_calorica_pct: number | null;
  macros: NutricaoMacros;
  proteina_relativa_g_kg: number | null;
  peso_kg_referencia: number | null;
}

export interface NutricaoMedias {
  calorias_consumidas: number | null;
  proteina_relativa_g_kg: number | null;
  aderencia_calorica_pct: number | null;
  refeicoes_por_dia: number | null;
  proteina_g: number | null;
  carboidrato_g: number | null;
  gordura_g: number | null;
}

export interface NutricaoHistorico {
  periodo_dias: number;
  data_inicio: string;
  data_fim: string;
  registros: NutricaoRegistroDia[];
  medias: NutricaoMedias;
  cobertura_dias: number;
  cobertura_pct: number;
}

export interface NutricaoResumo {
  proteina_relativa_g_kg_7d: number | null;
  proteina_relativa_g_kg_30d: number | null;
  aderencia_calorica_pct_7d: number | null;
  aderencia_calorica_pct_30d: number | null;
  cobertura_registros_pct_7d: number | null;
  cobertura_registros_pct_30d: number | null;
  refeicoes_por_dia_7d: number | null;
  macros_distribuicao_30d: {
    proteina_pct: number | null;
    carboidrato_pct: number | null;
    gordura_pct: number | null;
  } | null;
}

export interface NutricaoAlerta {
  tipo: string;
  urgencia: "alta" | "media" | "informativo";
  mensagem: string;
  dias_consecutivos?: number | null;
}

export interface SeriePontoProteina {
  data: string;
  valor: number | null;
}

export interface GlicemiaLeitura {
  timestamp: string;
  glicose_mg_dl: number;
  fonte: string;
}

export interface GliceimaCarboidratos {
  data: string;
  carboidrato_g: number;
}

export interface NutricaoGlicemia {
  disponivel: boolean;
  total_leituras: number;
  media_mg_dl: number | null;
  minima_mg_dl: number | null;
  maxima_mg_dl: number | null;
  leituras: GlicemiaLeitura[];
  carboidratos_periodo: GliceimaCarboidratos[];
}

export interface ComposicaoCorporalPonto {
  data: string;
  massa_magra_kg: number;
}

export interface ProteinaPorMassaMagraPonto {
  data: string;
  proteina_g_por_kg_magra: number;
}

export interface NutricaoComposicaoCorporal {
  disponivel: boolean;
  massa_magra_serie: ComposicaoCorporalPonto[];
  proteina_por_massa_magra_serie: ProteinaPorMassaMagraPonto[];
}

export interface RespostaNutricao {
  cliente_id: number | string;
  periodo_solicitado: number;
  sem_dados: boolean;
  mensagem_sem_dados: string | null;
  resumo: NutricaoResumo;
  alertas: NutricaoAlerta[];
  serie_proteina_relativa_30d: SeriePontoProteina[];
  historico: NutricaoHistorico;
  glicemia?: NutricaoGlicemia;
  composicao_corporal?: NutricaoComposicaoCorporal;
}

export type StatusConfirmacao = "pendente" | "confirmado" | "parcial" | "pulado";

export interface ItemProgressoAlimento {
  alimento_plano_id: string;
  alimento_nome: string;
  quantidade_prescrita: string;
  unidade: string;
  status: StatusConfirmacao;
  quantidade_consumida: number | null;
  confirmado_em: string | null;
}

export interface ProgressoRefeicao {
  refeicao_id: string;
  nome: string;
  data_referencia: string;
  total_alimentos: number;
  confirmados: number;
  pendentes: number;
  progresso_pct: number;
  alimentos: ItemProgressoAlimento[];
}

export const BRAZILIAN_STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
