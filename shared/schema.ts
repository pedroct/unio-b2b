import { z } from "zod";

export const loginSchema = z.object({
  registrationNumber: z.string().min(1, "Registro profissional é obrigatório"),
  uf: z.string().min(2, "Selecione o estado").max(2),
  password: z.string().min(1, "CPF é obrigatório"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export interface Professional {
  id: string;
  name: string;
  registrationNumber: string;
  uf: string;
  specialty: string;
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
  avatarUrl?: string;
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
  quantidade: string;
  grupo?: string;
}

export interface Refeicao {
  id: string;
  nome: string;
  horario: string;
  alimentos: AlimentoPlano[];
  substitutas?: Refeicao[];
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
}

export const BRAZILIAN_STATES = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
