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

const planoDiasAtivos: Record<string, DiaSemana[]> = {};

function getDiasAtivos(pacienteId: string): DiaSemana[] {
  if (!planoDiasAtivos[pacienteId]) {
    planoDiasAtivos[pacienteId] = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
  }
  return planoDiasAtivos[pacienteId];
}

function generatePlanoAlimentar(pacienteId: string, diaSemana: DiaSemana): PlanoAlimentar {
  const refeicoesPorDia: Record<string, PlanoAlimentar["refeicoes"]> = {
    segunda: [
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
    default: [
      {
        id: "ref-1", nome: "Desjejum", horario: "07:00",
        alimentos: [
          { id: "a1", nome: "Omelete de claras", quantidade: "3 claras + 1 gema", grupo: "Ovos e derivados" },
          { id: "a2", nome: "Pão integral", quantidade: "Fatia: 1", grupo: "Panificados" },
          { id: "a3", nome: "Abacate", quantidade: "Colher De Sopa: 2", grupo: "Frutas" },
          { id: "a4", nome: "Café preto", quantidade: "Xícara: 1 (150ml)", grupo: "Bebidas" },
        ],
      },
      {
        id: "ref-2", nome: "Colação", horario: "10:00",
        alimentos: [
          { id: "a5", nome: "Maçã", quantidade: "Unidade: 1", grupo: "Frutas" },
          { id: "a6", nome: "Amêndoas", quantidade: "Unidade: 10", grupo: "Nozes e Sementes" },
        ],
      },
      {
        id: "ref-3", nome: "Almoço", horario: "12:30",
        alimentos: [
          { id: "a7", nome: "Quinoa", quantidade: "Colher De Sopa: 3", grupo: "Cereais e leguminosas" },
          { id: "a8", nome: "Peito de peru assado", quantidade: "Filé: 1 (130g)", grupo: "Aves e ovos" },
          { id: "a9", nome: "Legumes grelhados", quantidade: "Porção: 1", grupo: "Miscelâneas" },
          { id: "a10", nome: "Salada mista", quantidade: "à vontade", grupo: "Miscelâneas" },
          { id: "a11", nome: "Limão", quantidade: "Unidade: 1/2", grupo: "Frutas" },
        ],
      },
      {
        id: "ref-4", nome: "Lanche da tarde", horario: "15:30",
        alimentos: [
          { id: "a12", nome: "Iogurte grego natural", quantidade: "Pote: 1 (170g)", grupo: "Leite e derivados" },
          { id: "a13", nome: "Mel", quantidade: "Colher De Chá: 1", grupo: "Açúcares" },
          { id: "a14", nome: "Chia", quantidade: "Colher De Sopa: 1", grupo: "Nozes e Sementes" },
        ],
      },
      {
        id: "ref-5", nome: "Jantar", horario: "19:00",
        alimentos: [
          { id: "a15", nome: "Tilápia grelhada", quantidade: "Filé: 1 (140g)", grupo: "Peixes e frutos do mar" },
          { id: "a16", nome: "Arroz integral", quantidade: "Colher De Sopa: 3", grupo: "Cereais e leguminosas" },
          { id: "a17", nome: "Couve refogada", quantidade: "Porção: 1", grupo: "Miscelâneas" },
        ],
      },
      {
        id: "ref-6", nome: "Ceia", horario: "21:30",
        alimentos: [
          { id: "a18", nome: "Leite desnatado morno", quantidade: "Copo: 1 (200ml)", grupo: "Laticínios" },
          { id: "a19", nome: "Canela em pó", quantidade: "Pitada: 1", grupo: "Miscelâneas" },
        ],
      },
    ],
  };

  const refeicoes = refeicoesPorDia[diaSemana] || refeicoesPorDia["default"];

  const nutrientesPorDia: Record<string, PlanoAlimentar["nutrientes"]> = {
    segunda: {
      calorias: 2050,
      proteina: { gramas: 138, percentual: 26.9 },
      carboidrato: { gramas: 245, percentual: 47.8 },
      gordura: { gramas: 58, percentual: 25.3 },
      fibra: 32,
    },
    default: {
      calorias: 1890,
      proteina: { gramas: 125, percentual: 26.5 },
      carboidrato: { gramas: 228, percentual: 48.3 },
      gordura: { gramas: 53, percentual: 25.2 },
      fibra: 28,
    },
  };

  return {
    id: `plano-${pacienteId}-${diaSemana}`,
    pacienteId,
    descricao: "Dieta Hiperproteica (modelo de cardápio Dietbox) (importado)",
    status: "ativo" as const,
    diaSemana,
    diasAtivos: getDiasAtivos(pacienteId),
    dataCriacao: "26/02/2026",
    refeicoes: refeicoes!,
    nutrientes: nutrientesPorDia[diaSemana] || nutrientesPorDia["default"]!,
  };
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
  getPlanoAlimentar(pacienteId: string, diaSemana: DiaSemana): Promise<PlanoAlimentar | undefined>;
  updateDiasAtivos(pacienteId: string, diasAtivos: DiaSemana[]): Promise<DiaSemana[]>;
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
  async getPlanoAlimentar(pacienteId: string, diaSemana: DiaSemana): Promise<PlanoAlimentar | undefined> {
    const patient = patients.find((p) => p.id === pacienteId);
    if (!patient) return undefined;
    return generatePlanoAlimentar(pacienteId, diaSemana);
  }

  async updateDiasAtivos(pacienteId: string, diasAtivos: DiaSemana[]): Promise<DiaSemana[]> {
    planoDiasAtivos[pacienteId] = diasAtivos;
    return diasAtivos;
  }
}

export const storage = new MemStorage();
