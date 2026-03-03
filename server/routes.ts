import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stagingFetch, stagingPassthrough } from "./staging-proxy";

function extractBearerToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return undefined;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/auth/pair", async (req, res) => {
    const { registrationNumber, uf, password } = req.body;
    if (!registrationNumber || !uf || !password) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }
    try {
      const result = await stagingPassthrough("/api/nucleo/profissional-auth", {
        method: "POST",
        body: {
          registro_profissional: registrationNumber,
          uf_registro: uf,
          cpf: password,
        },
      });

      if (!result.ok) {
        const msg = result.data?.mensagem || result.data?.detail || "Credenciais inválidas.";
        return res.status(result.status).json({ message: msg });
      }

      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[auth/pair] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor de autenticação." });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const result = await stagingPassthrough("/api/auth/refresh", {
        method: "POST",
        body: req.body,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[auth/refresh] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao renovar token." });
    }
  });

  app.get("/api/profissional/clientes", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const result = await stagingPassthrough("/api/profissional/clientes", {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[profissional/clientes] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar lista de clientes." });
    }
  });

  app.get("/api/profissional/pacientes", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const result = await stagingPassthrough("/api/profissional/clientes", {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[profissional/pacientes] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar lista de clientes." });
    }
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

  function gerarSparkline(base: number, amplitude: number, trend: "up" | "down" | "stable", pontos = 30): number[] {
    const dados: number[] = [];
    let v = base - (trend === "up" ? amplitude * 0.3 : trend === "down" ? -amplitude * 0.3 : 0);
    for (let i = 0; i < pontos; i++) {
      v += (Math.random() - 0.48) * amplitude * 0.4;
      if (trend === "up") v += amplitude * 0.02;
      if (trend === "down") v -= amplitude * 0.02;
      dados.push(Math.round(v * 10) / 10);
    }
    return dados;
  }

  app.get("/api/painel-longevidade/clientes/:id/cockpit", async (req, res) => {
    const clienteId = req.params.id;
    return res.json({
      cliente_id: clienteId,
      scores: [
        {
          tipo: "cardiovascular",
          ativo: true,
          score: 85.0,
          classificacao: "Bom",
          is_partial: false,
          mensagem_bloqueio: null,
          tendencia: "up",
        },
        {
          tipo: "metabolic",
          ativo: false,
          score: null,
          classificacao: null,
          is_partial: false,
          mensagem_bloqueio: "Score Metabólico estará disponível em breve.",
          tendencia: null,
        },
        {
          tipo: "recovery",
          ativo: false,
          score: null,
          classificacao: null,
          is_partial: false,
          mensagem_bloqueio: "Score de Recuperação estará disponível em breve.",
          tendencia: null,
        },
        {
          tipo: "functional",
          ativo: false,
          score: null,
          classificacao: null,
          is_partial: false,
          mensagem_bloqueio: "Score Funcional estará disponível em breve.",
          tendencia: null,
        },
      ],
      data_atualizacao: new Date().toISOString(),
    });
  });

  app.get("/api/painel-longevidade/clientes/:id/cardiometabolico", async (req, res) => {
    const clienteId = req.params.id;
    return res.json({
      cliente_id: clienteId,
      metricas_cardio: [
        {
          metric_type: "vo2_max",
          valor_atual: 45.2,
          unidade: "mL/kg/min",
          media_30d: 44.8,
          tendencia: "up",
          data_ultima_leitura: "2026-03-03T18:00:00+00:00",
          _sparkline_mock: gerarSparkline(45, 3, "up"),
        },
        {
          metric_type: "hrv_rmssd",
          valor_atual: 65.0,
          unidade: "ms",
          media_30d: 62.1,
          tendencia: "up",
          data_ultima_leitura: "2026-03-02T19:22:00+00:00",
          _sparkline_mock: gerarSparkline(63, 8, "up"),
        },
        {
          metric_type: "resting_hr",
          valor_atual: 58.0,
          unidade: "bpm",
          media_30d: 61.0,
          tendencia: "down",
          data_ultima_leitura: "2026-03-03T18:00:00+00:00",
          _sparkline_mock: gerarSparkline(60, 6, "down"),
        },
        {
          metric_type: "hr_recovery_1min",
          valor_atual: null,
          unidade: "bpm",
          media_30d: null,
          tendencia: null,
          data_ultima_leitura: null,
        },
      ],
      secao_metabolica_bloqueada: true,
      mensagem_bloqueio: "Coleta de exames de sangue pendente.",
    });
  });

  app.get("/api/painel-longevidade/clientes/:id/tendencia-score", async (req, res) => {
    const periodo = (req.query.periodo as string) || "30d";
    const dias = periodo === "365d" ? 365 : periodo === "90d" ? 90 : 30;
    const hoje = new Date();
    const dados = [];
    let score = 78;
    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      score = Math.max(40, Math.min(100, score + (Math.random() - 0.45) * 3));
      dados.push({
        date: data.toISOString().split("T")[0],
        score: Math.round(score * 10) / 10,
      });
    }
    return res.json({ range: periodo, data: dados });
  });

  app.get("/api/nutricao/catalogo/fontes", async (req, res) => {
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/fontes");
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/fontes error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/grupos", async (req, res) => {
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/grupos");
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/grupos error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/tipos", async (req, res) => {
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/tipos");
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/tipos error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/nutrientes", async (req, res) => {
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/nutrientes");
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/nutrientes error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/alimentos/codigo/:codigo", async (req, res) => {
    try {
      const result = await stagingFetch(`/api/nutricao/catalogo/alimentos/codigo/${req.params.codigo}`);
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/alimentos/codigo/:codigo error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/alimentos/:id", async (req, res) => {
    try {
      const result = await stagingFetch(`/api/nutricao/catalogo/alimentos/${req.params.id}`);
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/alimentos/:id error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/alimentos", async (req, res) => {
    const busca = (req.query.busca as string) || "";
    if (!busca) {
      return res.json({ items: [], total: 0, limite: 50, offset: 0 });
    }
    const params: Record<string, string> = { busca };
    if (req.query.fontes) params.fontes = req.query.fontes as string;
    else if (req.query.fonte) params.fonte = req.query.fonte as string;
    if (req.query.grupo) params.grupo = req.query.grupo as string;
    if (req.query.limite) params.limite = req.query.limite as string;
    if (req.query.offset) params.offset = req.query.offset as string;
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/alimentos", { params });
      const data = result.data;
      const normalized = Array.isArray(data)
        ? { items: data, total: data.length, limite: parseInt(params.limite || "50"), offset: parseInt(params.offset || "0") }
        : data;
      return res.status(result.status).json(normalized);
    } catch (err: any) {
      console.error("[proxy] /catalogo/alimentos error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.post("/api/nutricao/catalogo/calcular", async (req, res) => {
    const { alimento_id, quantidade_consumida } = req.body;
    if (!alimento_id || !quantidade_consumida) {
      return res.status(422).json({ message: "alimento_id e quantidade_consumida são obrigatórios." });
    }
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/calcular", {
        method: "POST",
        body: { alimento_id, quantidade_consumida },
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/calcular error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  return httpServer;
}
