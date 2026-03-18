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
      const registroLimpo = registrationNumber.replace(/[^0-9]/g, "");
      const cpfLimpo = password.replace(/\D/g, "");
      const ufMaiuscula = uf.toUpperCase();

      const result = await stagingPassthrough("/api/nucleo/profissional-auth", {
        method: "POST",
        body: {
          registro_profissional: registroLimpo,
          uf_registro: ufMaiuscula,
          cpf: cpfLimpo,
        },
      });

      if (!result.ok) {
        const msg = result.data?.mensagem || result.data?.detail || "Credenciais inválidas.";
        return res.status(result.status).json({ message: msg });
      }

      const { access, refresh, nome, tipo_profissional, registro_profissional } = result.data;
      let userId = "";
      try {
        const b64 = access.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(b64, "base64").toString());
        userId = String(payload.user_id || "");
      } catch {}

      const TIPO_LABELS: Record<string, string> = {
        medico: "Médico(a)",
        personal: "Personal Trainer",
        nutricionista: "Nutricionista",
      };

      return res.json({
        tokens: { access, refresh },
        professional: {
          id: userId,
          name: nome || registrationNumber,
          registrationNumber: registro_profissional || registrationNumber,
          uf,
          specialty: TIPO_LABELS[tipo_profissional] || tipo_profissional || "",
          tipoProfissional: tipo_profissional || "",
          email: "",
        },
      });
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
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const result = await stagingPassthrough("/api/profissional/clientes", {
        bearerToken: token,
      });
      if (!result.ok) {
        return res.status(result.status).json(result.data);
      }
      const patient = Array.isArray(result.data)
        ? result.data.find((p: any) => String(p.id) === String(req.params.id))
        : null;
      if (!patient) {
        return res.status(404).json({ message: "Paciente não encontrado." });
      }
      return res.json(patient);
    } catch (err: any) {
      console.error("[profissional/pacientes/:id] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados do paciente." });
    }
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

  // Helper: planos criados localmente têm IDs do padrão "plano-{pacienteId}-{numero ou timestamp}"
  function isLocalPlanId(planoId: string, pacienteId: string): boolean {
    return planoId.startsWith(`plano-${pacienteId}-`);
  }

  // ─── Planos Alimentares ─────────────────────────────────────────────────────
  // Contrato: /api/nutricao/planos-alimentares/{cliente_id}
  //   GET  → lista planos (staging + local DB)
  //   POST → cria plano (staging primary, local DB fallback)
  //   GET  /{plano_id} → detalhe do plano
  //   POST /{plano_id}/refeicoes → adiciona refeição
  // ────────────────────────────────────────────────────────────────────────────

  // GET /planos-alimentares — proxy para nova rota staging + merge com planos locais
  app.get("/api/profissional/dashboard/pacientes/:id/planos-alimentares", async (req, res) => {
    const token = extractBearerToken(req);
    const pacienteId = req.params.id;

    let stagingPlanos: any[] = [];
    if (token) {
      try {
        const result = await stagingPassthrough(
          `/api/nutricao/planos-alimentares/${pacienteId}`,
          { bearerToken: token }
        );
        if (result.ok && Array.isArray(result.data)) {
          stagingPlanos = result.data;
        } else if (result.ok && result.data) {
          // Às vezes vem como objeto com paginação
          stagingPlanos = Array.isArray(result.data.results) ? result.data.results : [];
        }
      } catch (err: any) {
        console.error("[planos-alimentares] staging error:", err.message);
      }
    }

    // Planos criados localmente (DB local, fallback quando staging não tinha POST)
    const locais = await storage.listarPlanosAlimentaresCriados(pacienteId);
    const merged = [...stagingPlanos, ...locais];
    return res.json(merged);
  });

  // POST /planos-alimentares — cria no staging (nova rota); fallback local se staging falhar
  app.post("/api/profissional/dashboard/pacientes/:id/planos-alimentares", async (req, res) => {
    const { descricao, diasAtivos } = req.body;
    if (!descricao || typeof descricao !== "string" || descricao.trim().length === 0) {
      return res.status(400).json({ message: "descricao é obrigatória." });
    }
    const validos = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
    const diasValidados = Array.isArray(diasAtivos)
      ? [...new Set((diasAtivos as string[]).filter((d) => validos.includes(d)))]
      : [];

    const token = extractBearerToken(req);
    if (token) {
      try {
        const result = await stagingPassthrough(
          `/api/nutricao/planos-alimentares/${req.params.id}`,
          {
            method: "POST",
            bearerToken: token,
            body: {
              descricao: descricao.trim(),
              dias_ativos: diasValidados,
              status: "rascunho",
            },
          }
        );
        console.log(`[criar-plano] staging ${result.status}`, JSON.stringify(result.data));
        if (result.ok) {
          return res.status(201).json(result.data);
        }
        // Se staging retornou erro de validação (400/422), propaga ao cliente
        if (result.status === 400 || result.status === 422) {
          return res.status(result.status).json(result.data ?? { message: "Erro de validação." });
        }
        // Outros erros: cai no fallback local
        console.warn("[criar-plano] staging falhou, usando fallback local:", result.status);
      } catch (err: any) {
        console.warn("[criar-plano] staging exception, usando fallback local:", err.message);
      }
    }

    // Fallback: persistência local (PostgreSQL local)
    const plano = await storage.criarPlanoAlimentar(req.params.id, descricao.trim(), diasValidados as any);
    return res.status(201).json(plano);
  });

  // GET /plano-alimentar — detalhe via nova rota staging; fallback local
  app.get("/api/profissional/dashboard/pacientes/:id/plano-alimentar", async (req, res) => {
    const planoId = req.query.planoId as string;
    const diaSemana = (req.query.diaSemana as string) || "segunda";
    const pacienteId = req.params.id;

    if (!planoId) {
      return res.status(400).json({ message: "planoId é obrigatório." });
    }

    // Plano local (DB local) — tem prefixo "plano-{pacienteId}-"
    if (isLocalPlanId(planoId, pacienteId)) {
      const plano = await storage.getPlanoAlimentar(pacienteId, planoId, diaSemana as any);
      if (!plano) return res.status(404).json({ message: "Plano alimentar não encontrado." });
      return res.json(plano);
    }

    // Plano do staging — usa nova rota GET /{cliente_id}/{plano_id}
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    try {
      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}`,
        { bearerToken: token }
      );
      if (!result.ok) {
        return res.status(result.status).json(result.data ?? { message: "Erro ao buscar plano." });
      }
      return res.json(result.data);
    } catch (err: any) {
      console.error("[plano-alimentar] staging error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // PUT .../dias — somente planos locais
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

  // PUT .../descricao — somente planos locais
  app.put("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/descricao", async (req, res) => {
    const { descricao } = req.body;
    if (!descricao || typeof descricao !== "string" || descricao.trim().length === 0) {
      return res.status(400).json({ message: "descricao é obrigatória." });
    }
    const updated = await storage.updateDescricaoPlano(req.params.id, req.params.planoId, descricao.trim());
    return res.json({ descricao: updated });
  });

  // POST .../refeicoes — nova rota staging para planos do staging; local DB para planos locais
  app.post("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/refeicoes", async (req, res) => {
    const { nome, horario, alimentos, observacao } = req.body;
    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return res.status(400).json({ message: "nome é obrigatório." });
    }
    if (!horario || typeof horario !== "string") {
      return res.status(400).json({ message: "horario é obrigatório." });
    }

    const pacienteId = req.params.id;
    const planoId = req.params.planoId;

    // Plano local
    if (isLocalPlanId(planoId, pacienteId)) {
      const refeicao = await storage.addRefeicao(pacienteId, planoId, {
        nome: nome.trim(),
        horario,
        alimentos: Array.isArray(alimentos) ? alimentos : [],
        observacao: observacao?.trim() || undefined,
      });
      if (!refeicao) return res.status(404).json({ message: "Plano alimentar não encontrado." });
      return res.status(201).json(refeicao);
    }

    // Plano do staging — nova rota POST /{cliente_id}/{plano_id}/refeicoes
    // Spec: id é OBRIGATÓRIO (gerado pelo frontend); alimento_id é UUID do catálogo
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    try {
      const alimentosStaging = Array.isArray(alimentos)
        ? alimentos.map((a: any) => ({
            id: a.id,                                               // UUID gerado pelo frontend (obrigatório)
            alimento_id: a.alimento_id ?? a.alimento_tbca_id,      // UUID do catálogo
            quantidade: Number(a.quantidade),
            unidade: a.unidade ?? "g",
          }))
        : [];

      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}/refeicoes`,
        {
          method: "POST",
          bearerToken: token,
          body: {
            nome: nome.trim(),
            horario,
            observacao: observacao?.trim() || "",
            alimentos: alimentosStaging,
          },
        }
      );
      if (!result.ok) {
        console.error("[refeicoes] staging error:", result.status, JSON.stringify(result.data));
        return res.status(result.status).json(result.data ?? { message: "Erro ao salvar refeição." });
      }
      return res.status(201).json(result.data);
    } catch (err: any) {
      console.error("[refeicoes] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get(["/api/painel-longevidade/clientes/:id/cockpit", "/api/longevidade/clientes/:id/cockpit"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const result = await stagingPassthrough(`/api/painel-longevidade/clientes/${req.params.id}/cockpit`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[longevidade/cockpit] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados do cockpit." });
    }
  });

  app.get(["/api/painel-longevidade/clientes/:id/cardiometabolico", "/api/longevidade/clientes/:id/cardiometabolico"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const result = await stagingPassthrough(`/api/painel-longevidade/clientes/${req.params.id}/cardiometabolico`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[longevidade/cardiometabolico] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados cardiometabólicos." });
    }
  });

  app.get(["/api/painel-longevidade/clientes/:id/nutricao", "/api/longevidade/clientes/:id/nutricao"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const periodo = req.query.periodo ? String(req.query.periodo) : "7";
      const result = await stagingPassthrough(`/api/painel-longevidade/clientes/${req.params.id}/nutricao`, {
        bearerToken: token,
        params: { periodo },
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[longevidade/nutricao] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados nutricionais." });
    }
  });

  app.post(["/api/painel-longevidade/interesse", "/api/longevidade/interesse"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    const { componente } = req.body || {};
    if (!componente || typeof componente !== "string") {
      return res.status(400).json({ message: "Campo 'componente' é obrigatório." });
    }
    try {
      const result = await stagingPassthrough("/api/painel-longevidade/interesse", {
        method: "POST",
        bearerToken: token,
        body: { componente },
      });
      return res.status(result.status >= 200 && result.status < 300 ? 204 : result.status).end();
    } catch (err: any) {
      console.error("[longevidade/interesse] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao registrar interesse." });
    }
  });

  app.get(["/api/painel-longevidade/clientes/:id/recuperacao-sono", "/api/longevidade/clientes/:id/recuperacao-sono"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const result = await stagingPassthrough(`/api/painel-longevidade/clientes/${req.params.id}/recuperacao-sono`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[longevidade/recuperacao-sono] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados de recuperação e sono." });
    }
  });

  app.get(["/api/painel-longevidade/clientes/:id/performance-funcional", "/api/longevidade/clientes/:id/performance-funcional"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const params: Record<string, string> = {};
      if (req.query.intervalo && typeof req.query.intervalo === "string") {
        params.intervalo = req.query.intervalo;
      }
      const result = await stagingPassthrough(`/api/painel-longevidade/clientes/${req.params.id}/performance-funcional`, {
        bearerToken: token,
        params,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[longevidade/performance-funcional] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados de performance funcional." });
    }
  });

  app.get(["/api/painel-longevidade/clientes/:id/historico-scores", "/api/longevidade/clientes/:id/historico-scores"], async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Token de autenticação ausente." });
    }
    try {
      const VALID_INTERVALOS = ["30d", "90d", "365d"];
      const intervaloRaw = req.query.intervalo ? String(req.query.intervalo) : null;
      const intervalo = intervaloRaw && VALID_INTERVALOS.includes(intervaloRaw) ? intervaloRaw : "30d";
      const result = await stagingPassthrough(`/api/painel-longevidade/clientes/${req.params.id}/historico-scores?intervalo=${intervalo}`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[longevidade/historico-scores] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar histórico de scores." });
    }
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
    const qtd = Number(quantidade_consumida);
    if (!alimento_id || isNaN(qtd) || qtd <= 0) {
      return res.status(422).json({ message: "alimento_id e quantidade_consumida (>0) são obrigatórios." });
    }
    try {
      const result = await stagingFetch("/api/nutricao/catalogo/calcular", {
        method: "POST",
        body: { alimento_id: String(alimento_id), quantidade_consumida: qtd },
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/calcular error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  return httpServer;
}
