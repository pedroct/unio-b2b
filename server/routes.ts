import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/auth/pair", async (req, res) => {
    const { registrationNumber, uf, password } = req.body;

    if (!registrationNumber || !uf || !password) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }

    const result = await storage.authenticate(registrationNumber, uf, password);
    if (!result) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    return res.json(result);
  });

  app.get("/api/profissional/pacientes", async (_req, res) => {
    const patients = await storage.getPatients();
    return res.json(patients);
  });

  app.get("/api/profissional/pacientes/:id", async (req, res) => {
    const patient = await storage.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Paciente não encontrado." });
    }
    return res.json(patient);
  });

  app.get("/api/profissional/pacientes/:id/metas", async (req, res) => {
    const goals = await storage.getPatientGoals(req.params.id);
    if (!goals) {
      return res.status(404).json({ message: "Metas não encontradas." });
    }
    return res.json(goals);
  });

  app.put("/api/profissional/pacientes/:id/metas", async (req, res) => {
    const goals = await storage.updatePatientGoals(req.params.id, req.body);
    return res.json(goals);
  });

  app.get("/api/profissional/dashboard/pacientes/:id/overview", async (req, res) => {
    const overview = await storage.getPatientOverview(req.params.id);
    if (!overview) {
      return res.status(404).json({ message: "Dados não encontrados." });
    }
    return res.json(overview);
  });

  app.get("/api/profissional/dashboard/pacientes/:id/nutricao", async (req, res) => {
    const nutrition = await storage.getPatientNutrition(req.params.id);
    if (!nutrition) {
      return res.status(404).json({ message: "Dados não encontrados." });
    }
    return res.json(nutrition);
  });

  app.get("/api/profissional/dashboard/pacientes/:id/biometria", async (req, res) => {
    const biometry = await storage.getPatientBiometry(req.params.id);
    if (!biometry) {
      return res.status(404).json({ message: "Dados não encontrados." });
    }
    return res.json(biometry);
  });

  app.get("/api/profissional/dashboard/pacientes/:id/treinamento", async (req, res) => {
    const training = await storage.getPatientTraining(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Dados não encontrados." });
    }
    return res.json(training);
  });

  app.get("/api/profissional/dashboard/pacientes/:id/planos-alimentares", async (req, res) => {
    const planos = await storage.listarPlanosAlimentares(req.params.id);
    return res.json(planos);
  });

  app.get("/api/profissional/dashboard/pacientes/:id/plano-alimentar", async (req, res) => {
    const planoId = req.query.planoId as string;
    const diaSemana = (req.query.diaSemana as string) || "segunda";
    if (!planoId) {
      return res.status(400).json({ message: "planoId é obrigatório." });
    }
    const plano = await storage.getPlanoAlimentar(req.params.id, planoId, diaSemana as any);
    if (!plano) {
      return res.status(404).json({ message: "Plano alimentar não encontrado." });
    }
    return res.json(plano);
  });

  app.put("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/dias", async (req, res) => {
    const { diasAtivos } = req.body;
    if (!Array.isArray(diasAtivos)) {
      return res.status(400).json({ message: "diasAtivos deve ser um array." });
    }
    const validos = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
    const diasValidados = [...new Set(diasAtivos.filter((d: string) => validos.includes(d)))];
    const updated = await storage.updateDiasAtivos(req.params.id, req.params.planoId, diasValidados as any);
    return res.json({ diasAtivos: updated });
  });

  app.put("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/descricao", async (req, res) => {
    const { descricao } = req.body;
    if (!descricao || typeof descricao !== "string" || descricao.trim().length === 0) {
      return res.status(400).json({ message: "descricao é obrigatória." });
    }
    const updated = await storage.updateDescricaoPlano(req.params.id, req.params.planoId, descricao.trim());
    return res.json({ descricao: updated });
  });

  app.post("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/refeicoes", async (req, res) => {
    const { nome, horario, alimentos, observacao } = req.body;
    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return res.status(400).json({ message: "nome é obrigatório." });
    }
    if (!horario || typeof horario !== "string") {
      return res.status(400).json({ message: "horario é obrigatório." });
    }
    const refeicao = await storage.addRefeicao(req.params.id, req.params.planoId, {
      nome: nome.trim(),
      horario,
      alimentos: Array.isArray(alimentos) ? alimentos : [],
      observacao: observacao?.trim() || undefined,
    });
    if (!refeicao) {
      return res.status(404).json({ message: "Plano alimentar não encontrado." });
    }
    return res.status(201).json(refeicao);
  });

  app.get("/api/nutricao/alimentos/buscar", async (req, res) => {
    const q = req.query.q as string;
    const limite = parseInt(req.query.limite as string) || 20;
    if (!q) {
      return res.status(422).json({ message: "Parâmetro 'q' é obrigatório." });
    }
    const resultados = await storage.buscarAlimentos(q, "LEGADO", limite);
    return res.json(resultados.map((a) => ({
      id: a.id,
      nome: a.nome,
      marca: "",
      codigo_barras: null,
      calorias: a.caloriasPor100g,
      carboidratos: a.carboidratoPor100g,
      proteinas: a.proteinaPor100g,
      gorduras: a.gorduraPor100g,
      fibras: a.fibraPor100g,
      unidade_medida: "G",
    })));
  });

  app.get("/api/nutricao/tbca/alimentos/:id", async (req, res) => {
    const alimento = await storage.getAlimentoDetalhe(req.params.id);
    if (!alimento) {
      return res.status(404).json({ erro: "Alimento não encontrado" });
    }
    return res.json({
      id: alimento.id,
      codigo_tbca: alimento.id.toUpperCase(),
      descricao: alimento.nome,
      nome_cientifico: null,
      grupo_alimentar: { id: alimento.id + "-grp", codigo_tbca: "C", nome: alimento.grupo || "" },
      fonte_dados: alimento.fonte,
      valores_nutricionais: [
        { nutriente: { id: "n1", nome: "Energia", unidade_medida: "kcal", categoria: "Energia", ordem_exibicao: 1 }, quantidade_base: 100, unidade_base: "g", valor: alimento.caloriasPor100g },
        { nutriente: { id: "n2", nome: "Proteína", unidade_medida: "g", categoria: "Macronutriente", ordem_exibicao: 2 }, quantidade_base: 100, unidade_base: "g", valor: alimento.proteinaPor100g },
        { nutriente: { id: "n3", nome: "Carboidrato", unidade_medida: "g", categoria: "Macronutriente", ordem_exibicao: 3 }, quantidade_base: 100, unidade_base: "g", valor: alimento.carboidratoPor100g },
        { nutriente: { id: "n4", nome: "Gordura", unidade_medida: "g", categoria: "Macronutriente", ordem_exibicao: 4 }, quantidade_base: 100, unidade_base: "g", valor: alimento.gorduraPor100g },
        { nutriente: { id: "n5", nome: "Fibra", unidade_medida: "g", categoria: "Macronutriente", ordem_exibicao: 5 }, quantidade_base: 100, unidade_base: "g", valor: alimento.fibraPor100g },
      ],
    });
  });

  app.get("/api/nutricao/tbca/alimentos", async (req, res) => {
    const busca = (req.query.busca as string) || "";
    const fonte = req.query.fonte as string | undefined;
    const limite = parseInt(req.query.limite as string) || 50;
    if (!busca) {
      return res.json([]);
    }
    const validFontes = ["TBCA", "USDA", "LEGADO"];
    const fonteFilter = fonte && validFontes.includes(fonte) ? (fonte as any) : undefined;
    const resultados = await storage.buscarAlimentos(busca, fonteFilter, limite);
    return res.json(resultados.map((a) => ({
      id: a.id,
      codigo_tbca: a.id.toUpperCase(),
      descricao: a.nome,
      nome_cientifico: null,
      grupo_alimentar: { id: a.id + "-grp", codigo_tbca: "C", nome: a.grupo || "" },
      fonte_dados: a.fonte,
    })));
  });

  app.post("/api/nutricao/tbca/calcular", async (req, res) => {
    const { alimento_id, quantidade_consumida } = req.body;
    if (!alimento_id || !quantidade_consumida) {
      return res.status(422).json({ message: "alimento_id e quantidade_consumida são obrigatórios." });
    }
    const resultado = await storage.calcularNutrientes(alimento_id, quantidade_consumida);
    if (!resultado) {
      return res.status(404).json({ erro: "Alimento não encontrado" });
    }
    return res.json(resultado);
  });

  return httpServer;
}
