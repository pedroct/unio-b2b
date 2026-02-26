import type {
  Professional,
  Patient,
  PatientGoals,
  NutritionSummary,
  BiometrySummary,
  TrainingSummary,
  PatientOverview,
  InsightCard,
  PlanoAlimentar,
  NutrientesPlano,
  ResumoPlanoAlimentar,
  DiaSemana,
} from "@shared/schema";

const professionals: Professional[] = [
  {
    id: "prof-1",
    name: "Dr. Rafael Mendes",
    registrationNumber: "CRM-12345",
    uf: "SP",
    specialty: "Médico do Esporte",
    email: "rafael.mendes@unio.health",
  },
];

const patients: Patient[] = [
  {
    id: "p1",
    name: "Ana Carolina Silva",
    email: "ana.silva@email.com",
    phone: "(11) 98765-4321",
    birthDate: "1992-03-15",
    gender: "F",
    age: 33,
    adherenceTraining: 85,
    adherenceDiet: 72,
    lastActivity: "Há 2 horas",
    status: "active",
  },
  {
    id: "p2",
    name: "Bruno Oliveira Santos",
    email: "bruno.santos@email.com",
    phone: "(21) 97654-3210",
    birthDate: "1988-07-22",
    gender: "M",
    age: 37,
    adherenceTraining: 92,
    adherenceDiet: 88,
    lastActivity: "Há 1 hora",
    status: "active",
  },
  {
    id: "p3",
    name: "Camila Rodrigues",
    email: "camila.r@email.com",
    phone: "(31) 96543-2109",
    birthDate: "1995-11-08",
    gender: "F",
    age: 30,
    adherenceTraining: 45,
    adherenceDiet: 60,
    lastActivity: "Há 3 dias",
    status: "active",
  },
  {
    id: "p4",
    name: "Diego Ferreira Lima",
    email: "diego.lima@email.com",
    phone: "(41) 95432-1098",
    birthDate: "1990-01-30",
    gender: "M",
    age: 36,
    adherenceTraining: 78,
    adherenceDiet: 55,
    lastActivity: "Ontem",
    status: "active",
  },
  {
    id: "p5",
    name: "Elena Martins Costa",
    email: "elena.costa@email.com",
    phone: "(51) 94321-0987",
    birthDate: "1985-09-12",
    gender: "F",
    age: 40,
    adherenceTraining: 30,
    adherenceDiet: 40,
    lastActivity: "Há 2 semanas",
    status: "inactive",
  },
];

const patientGoals: Record<string, PatientGoals> = {
  p1: { dailyCalories: 1800, protein: 130, carbs: 200, fat: 55, hydration: 2500, hydrationOverride: false },
  p2: { dailyCalories: 2800, protein: 200, carbs: 350, fat: 80, hydration: 3500, hydrationOverride: true },
  p3: { dailyCalories: 1600, protein: 110, carbs: 180, fat: 50, hydration: 2200, hydrationOverride: false },
  p4: { dailyCalories: 2400, protein: 180, carbs: 280, fat: 70, hydration: 3000, hydrationOverride: false },
  p5: { dailyCalories: 1500, protein: 100, carbs: 160, fat: 45, hydration: 2000, hydrationOverride: false },
};

function generateNutritionHistory(): { date: string; calories: number; protein: number; carbs: number; fat: number }[] {
  const history = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    history.push({
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      calories: 1500 + Math.floor(Math.random() * 800),
      protein: 80 + Math.floor(Math.random() * 80),
      carbs: 150 + Math.floor(Math.random() * 120),
      fat: 40 + Math.floor(Math.random() * 40),
    });
  }
  return history;
}

function generateBiometryHistory(): { date: string; weight: number; bodyFat: number; muscleMass: number; water: number }[] {
  const history = [];
  let weight = 78;
  let bodyFat = 18;
  let muscleMass = 35;
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weight += (Math.random() - 0.55) * 0.6;
    bodyFat += (Math.random() - 0.55) * 0.4;
    muscleMass += (Math.random() - 0.45) * 0.3;
    history.push({
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      weight: Math.round(weight * 10) / 10,
      bodyFat: Math.round(bodyFat * 10) / 10,
      muscleMass: Math.round(muscleMass * 10) / 10,
      water: Math.round((55 + Math.random() * 5) * 10) / 10,
    });
  }
  return history;
}

function generateTrainingSessions() {
  const sessions = [];
  const names = [
    "Treino A - Superior",
    "Treino B - Inferior",
    "Treino C - Full Body",
    "Treino A - Push",
    "Treino B - Pull",
    "Treino C - Legs",
    "Cardio HIIT",
    "Treino Funcional",
  ];
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (Math.random() > 0.3) {
      sessions.push({
        id: `s${i}`,
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        name: names[Math.floor(Math.random() * names.length)],
        duration: 40 + Math.floor(Math.random() * 40),
        volumeLoad: 2000 + Math.floor(Math.random() * 4000),
        rpe: 5 + Math.floor(Math.random() * 5),
        completed: Math.random() > 0.15,
        exercises: 4 + Math.floor(Math.random() * 5),
      });
    }
  }
  return sessions;
}

interface PlanoMockData {
  id: string;
  descricao: string;
  status: "ativo" | "rascunho";
  diasAtivos: DiaSemana[];
  dataCriacao: string;
  refeicoes: PlanoAlimentar["refeicoes"];
  nutrientes: NutrientesPlano;
}

const planoDescricoes: Record<string, string> = {};
const planoDiasAtivosMap: Record<string, DiaSemana[]> = {};

function getPlanosMock(pacienteId: string): PlanoMockData[] {
  const plano1Id = `plano-${pacienteId}-1`;
  const plano2Id = `plano-${pacienteId}-2`;

  if (!planoDiasAtivosMap[plano1Id]) {
    planoDiasAtivosMap[plano1Id] = ["segunda", "terca", "quarta", "quinta", "sexta"];
  }
  if (!planoDiasAtivosMap[plano2Id]) {
    planoDiasAtivosMap[plano2Id] = ["sabado", "domingo"];
  }

  return [
    {
      id: plano1Id,
      descricao: planoDescricoes[plano1Id] || "Dieta Hiperproteica (modelo de cardápio Dietbox) (importado)",
      status: "ativo",
      diasAtivos: planoDiasAtivosMap[plano1Id],
      dataCriacao: "26/02/2026",
      refeicoes: [
        {
          id: "ref-1", nome: "Desjejum", horario: "07:00",
          alimentos: [
            { id: "a1", nome: "Pão, aveia, forma", quantidade: "Fatia: 2", grupo: "Cereais e derivados" },
            { id: "a2", nome: "Queijo, minas, frescal", quantidade: "Fatia Média (30g): 2", grupo: "Leite e derivados" },
            { id: "a3", nome: "Mamão, Papaia, cru", quantidade: "Fatia: 2", grupo: "Frutas e derivados" },
            { id: "a4", nome: "Quinoa", quantidade: "Colher De Sopa: 2", grupo: "Cereais e leguminosas" },
            { id: "a24", nome: "Achocolatado em pó", quantidade: "Colher De Sobremesa: 1", grupo: "Açúcares e produtos de confeitaria" },
            { id: "a25", nome: "Leite de vaca desnatado", quantidade: "Copo Grande: 1", grupo: "Laticínios" },
            { id: "a26", nome: "Leite em pó desnatado", quantidade: "Colher De Sopa: 2", grupo: "Laticínios" },
          ],
        },
        {
          id: "ref-2", nome: "Colação", horario: "10:00",
          alimentos: [
            { id: "a5", nome: "Iogurte, natural, desnatado", quantidade: "Copo: 2", grupo: "Leite e derivados" },
            { id: "a6", nome: "Granola", quantidade: "Colher De Sobremesa: 2", grupo: "Farinhas, féculas e massas" },
          ],
        },
        {
          id: "ref-3", nome: "Almoço", horario: "13:00",
          alimentos: [
            { id: "a8", nome: "Arroz integral", quantidade: "Colher De Sopa: 4", grupo: "Cereais e leguminosas" },
            { id: "a9", nome: "Feijão, carioca, cozido", quantidade: "Concha Pequena Cheia: 1", grupo: "Leguminosas e derivados" },
            { id: "a10", nome: "Filé de frango Grelhado(a)/brasa/churrasco", quantidade: "Bifé: 2", grupo: "Aves e ovos" },
            { id: "a11", nome: "Salada ou verdura crua, exceto de fruta", quantidade: "Colher De Arroz/Servir: 1", grupo: "Miscelâneas" },
            { id: "a13", nome: "Suco de acerola", quantidade: "Copo Americano: 1", grupo: "Miscelâneas" },
          ],
        },
        {
          id: "ref-4", nome: "Lanche da tarde", horario: "16:00",
          alimentos: [
            { id: "a14", nome: "Pão integral", quantidade: "Fatia: 2", grupo: "Panificados" },
            { id: "a27", nome: "Queijo, cottage, magro, 1% gordura", quantidade: "Grama: 60", grupo: "Ovos e Laticínios" },
            { id: "a28", nome: "Abacaxi, cru, todas as variedades", quantidade: "fatia, fina (8.9 diâmetro x 1.3 cm espessura): 3", grupo: "Frutas e Sucos de Frutas" },
            { id: "a29", nome: "Café, infusão 10%", quantidade: "Xícara De Cafézinho: 1", grupo: "Bebidas (alcoólicas e não alcoólicas)" },
          ],
        },
        {
          id: "ref-5", nome: "Jantar", horario: "19:00",
          alimentos: [
            { id: "a17", nome: "Torrada de qualquer pão", quantidade: "Unidade: 3", grupo: "Panificados" },
            { id: "a30", nome: "Omelete, de queijo", quantidade: "Grama: 150", grupo: "Ovos e derivados" },
          ],
        },
        {
          id: "ref-6", nome: "Ceia", horario: "22:00",
          alimentos: [
            { id: "a21", nome: "Castanha, japonesa, assada", quantidade: "Grama: 5", grupo: "Nozes e Sementes" },
            { id: "a22", nome: "Maçã", quantidade: "Unidade: 1", grupo: "Frutas" },
            { id: "a31", nome: "Achocolatado, pó", quantidade: "Colher De Sobremesa: 1", grupo: "Produtos açucarados" },
            { id: "a32", nome: "Leite de vaca desnatado", quantidade: "Copo De Requeijão: 1", grupo: "Laticínios" },
          ],
        },
      ],
      nutrientes: {
        calorias: 2050,
        proteina: { gramas: 138, percentual: 26.9 },
        carboidrato: { gramas: 245, percentual: 47.8 },
        gordura: { gramas: 58, percentual: 25.3 },
        fibra: 32,
      },
    },
    {
      id: plano2Id,
      descricao: planoDescricoes[plano2Id] || "Dieta Low Carb — Fim de semana",
      status: "ativo",
      diasAtivos: planoDiasAtivosMap[plano2Id],
      dataCriacao: "26/02/2026",
      refeicoes: [
        {
          id: "ref-w1", nome: "Brunch", horario: "10:00",
          alimentos: [
            { id: "aw1", nome: "Omelete de claras", quantidade: "3 claras + 1 gema", grupo: "Ovos e derivados" },
            { id: "aw2", nome: "Abacate", quantidade: "Colher De Sopa: 2", grupo: "Frutas" },
            { id: "aw3", nome: "Salmão defumado", quantidade: "Fatia: 3", grupo: "Peixes e frutos do mar" },
            { id: "aw4", nome: "Café preto", quantidade: "Xícara: 1 (150ml)", grupo: "Bebidas" },
          ],
        },
        {
          id: "ref-w2", nome: "Almoço", horario: "13:30",
          alimentos: [
            { id: "aw5", nome: "Filé mignon grelhado", quantidade: "Grama: 180", grupo: "Carnes bovinas" },
            { id: "aw6", nome: "Salada caesar", quantidade: "Porção: 1", grupo: "Miscelâneas" },
            { id: "aw7", nome: "Azeite de oliva extra virgem", quantidade: "Colher De Sopa: 1", grupo: "Óleos e gorduras" },
            { id: "aw8", nome: "Brócolis cozido", quantidade: "Colher De Sopa: 3", grupo: "Verduras e hortaliças" },
          ],
        },
        {
          id: "ref-w3", nome: "Lanche", horario: "16:30",
          alimentos: [
            { id: "aw9", nome: "Iogurte grego natural", quantidade: "Pote: 1 (170g)", grupo: "Leite e derivados" },
            { id: "aw10", nome: "Castanha-do-pará", quantidade: "Unidade: 3", grupo: "Nozes e Sementes" },
            { id: "aw11", nome: "Morango", quantidade: "Unidade: 6", grupo: "Frutas" },
          ],
        },
        {
          id: "ref-w4", nome: "Jantar", horario: "19:30",
          alimentos: [
            { id: "aw12", nome: "Peito de frango desfiado", quantidade: "Grama: 150", grupo: "Aves e ovos" },
            { id: "aw13", nome: "Abobrinha refogada", quantidade: "Colher De Sopa: 4", grupo: "Verduras e hortaliças" },
            { id: "aw14", nome: "Queijo parmesão ralado", quantidade: "Colher De Sopa: 1", grupo: "Laticínios" },
          ],
        },
      ],
      nutrientes: {
        calorias: 1650,
        proteina: { gramas: 142, percentual: 34.4 },
        carboidrato: { gramas: 98, percentual: 23.8 },
        gordura: { gramas: 76, percentual: 41.8 },
        fibra: 18,
      },
    },
  ];
}

export interface IStorage {
  authenticate(registrationNumber: string, uf: string, password: string): Promise<{ professional: Professional; tokens: { access: string; refresh: string } } | null>;
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientGoals(patientId: string): Promise<PatientGoals | undefined>;
  updatePatientGoals(patientId: string, goals: PatientGoals): Promise<PatientGoals>;
  getPatientOverview(patientId: string): Promise<PatientOverview | undefined>;
  getPatientNutrition(patientId: string): Promise<NutritionSummary | undefined>;
  getPatientBiometry(patientId: string): Promise<BiometrySummary | undefined>;
  getPatientTraining(patientId: string): Promise<TrainingSummary | undefined>;
  listarPlanosAlimentares(pacienteId: string): Promise<ResumoPlanoAlimentar[]>;
  getPlanoAlimentar(pacienteId: string, planoId: string, diaSemana: DiaSemana): Promise<PlanoAlimentar | undefined>;
  updateDiasAtivos(pacienteId: string, planoId: string, diasAtivos: DiaSemana[]): Promise<DiaSemana[]>;
  updateDescricaoPlano(pacienteId: string, planoId: string, descricao: string): Promise<string>;
}

export class MemStorage implements IStorage {
  async authenticate(registrationNumber: string, uf: string, password: string) {
    if (!registrationNumber || !uf || !password) {
      return null;
    }

    if (password.replace(/\D/g, "").length < 11) {
      return null;
    }

    const professional = professionals[0];
    return {
      professional,
      tokens: {
        access: "mock-access-token-" + Date.now(),
        refresh: "mock-refresh-token-" + Date.now(),
      },
    };
  }

  async getPatients(): Promise<Patient[]> {
    return patients;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return patients.find((p) => p.id === id);
  }

  async getPatientGoals(patientId: string): Promise<PatientGoals | undefined> {
    return patientGoals[patientId];
  }

  async updatePatientGoals(patientId: string, goals: PatientGoals): Promise<PatientGoals> {
    patientGoals[patientId] = goals;
    return goals;
  }

  async getPatientOverview(patientId: string): Promise<PatientOverview | undefined> {
    const patient = patients.find((p) => p.id === patientId);
    const goals = patientGoals[patientId];
    if (!patient || !goals) return undefined;

    const insights: InsightCard[] = [
      {
        id: "ins-1",
        type: "warning",
        title: "Queda na ingestão de proteína",
        description: "A média de consumo de proteína nos últimos 5 dias está 22% abaixo da meta. Isso pode impactar a recuperação muscular.",
        module: "nutrition",
      },
      {
        id: "ins-2",
        type: "success",
        title: "Aderência ao treino excelente",
        description: "O paciente completou 4 de 5 sessões programadas esta semana, mantendo a regularidade.",
        module: "training",
      },
      {
        id: "ins-3",
        type: "info",
        title: "Tendência de composição corporal",
        description: "A massa muscular apresentou ganho de 0.4kg nas últimas 4 semanas, com gordura corporal estável.",
        module: "biometry",
      },
    ];

    return {
      patient,
      goals,
      insights,
      weeklySnapshot: {
        caloriesAvg: Math.round(goals.dailyCalories * (0.7 + Math.random() * 0.3)),
        caloriesTarget: goals.dailyCalories,
        trainingSessions: 4,
        trainingTarget: 5,
        hydrationAvg: Math.round(goals.hydration * (0.6 + Math.random() * 0.4)),
        hydrationTarget: goals.hydration,
        weightChange: -0.3,
      },
    };
  }

  async getPatientNutrition(patientId: string): Promise<NutritionSummary | undefined> {
    const goals = patientGoals[patientId];
    if (!goals) return undefined;

    const history = generateNutritionHistory();
    const todayEntry = history[history.length - 1];

    return {
      dailyCalories: todayEntry.calories,
      targetCalories: goals.dailyCalories,
      protein: { current: todayEntry.protein, target: goals.protein },
      carbs: { current: todayEntry.carbs, target: goals.carbs },
      fat: { current: todayEntry.fat, target: goals.fat },
      adherencePercent: 72 + Math.floor(Math.random() * 20),
      history,
    };
  }

  async getPatientBiometry(patientId: string): Promise<BiometrySummary | undefined> {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return undefined;

    const history = generateBiometryHistory();
    const latest = history[history.length - 1];

    return {
      current: {
        weight: latest.weight,
        bodyFat: latest.bodyFat,
        muscleMass: latest.muscleMass,
        water: latest.water,
      },
      history,
      trends: {
        weight: "down",
        bodyFat: "down",
        muscleMass: "up",
      },
    };
  }

  async getPatientTraining(patientId: string): Promise<TrainingSummary | undefined> {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return undefined;

    const sessions = generateTrainingSessions();
    const completed = sessions.filter((s) => s.completed);

    return {
      totalSessions: sessions.length,
      weeklyAverage: Math.round((sessions.length / 2) * 10) / 10,
      adherencePercent: Math.round((completed.length / sessions.length) * 100),
      sessions,
    };
  }
  async listarPlanosAlimentares(pacienteId: string): Promise<ResumoPlanoAlimentar[]> {
    const patient = patients.find((p) => p.id === pacienteId);
    if (!patient) return [];
    const planos = getPlanosMock(pacienteId);
    return planos.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      status: p.status,
      diasAtivos: p.diasAtivos,
      dataCriacao: p.dataCriacao,
      calorias: p.nutrientes.calorias,
    }));
  }

  async getPlanoAlimentar(pacienteId: string, planoId: string, diaSemana: DiaSemana): Promise<PlanoAlimentar | undefined> {
    const patient = patients.find((p) => p.id === pacienteId);
    if (!patient) return undefined;
    const planos = getPlanosMock(pacienteId);
    const plano = planos.find((p) => p.id === planoId);
    if (!plano) return undefined;
    return {
      id: plano.id,
      pacienteId,
      descricao: plano.descricao,
      status: plano.status,
      diaSemana,
      diasAtivos: plano.diasAtivos,
      dataCriacao: plano.dataCriacao,
      refeicoes: plano.refeicoes,
      nutrientes: plano.nutrientes,
    };
  }

  async updateDiasAtivos(pacienteId: string, planoId: string, diasAtivos: DiaSemana[]): Promise<DiaSemana[]> {
    planoDiasAtivosMap[planoId] = diasAtivos;
    return diasAtivos;
  }

  async updateDescricaoPlano(pacienteId: string, planoId: string, descricao: string): Promise<string> {
    planoDescricoes[planoId] = descricao;
    return descricao;
  }
}

export const storage = new MemStorage();
