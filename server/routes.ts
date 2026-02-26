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

  return httpServer;
}
