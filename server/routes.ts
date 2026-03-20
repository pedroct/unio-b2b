import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stagingPassthrough } from "./staging-proxy";

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
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/clientes/${req.params.id}`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[profissional/pacientes/:id] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados do paciente." });
    }
  });

  app.get("/api/profissional/pacientes/:id/metas", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/clientes/${req.params.id}/metas`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[profissional/pacientes/:id/metas GET] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar metas." });
    }
  });

  app.put("/api/profissional/pacientes/:id/metas", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/clientes/${req.params.id}/metas`, {
        method: "PUT",
        bearerToken: token,
        body: req.body,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[profissional/pacientes/:id/metas PUT] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao salvar metas." });
    }
  });

  app.get("/api/profissional/dashboard/pacientes/:id/overview", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/dashboard/clientes/${req.params.id}/overview`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[dashboard/overview] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar overview." });
    }
  });

  app.get("/api/profissional/dashboard/pacientes/:id/nutricao", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/dashboard/clientes/${req.params.id}/nutricao`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[dashboard/nutricao] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar dados nutricionais." });
    }
  });

  app.get("/api/profissional/dashboard/pacientes/:id/biometria", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/dashboard/clientes/${req.params.id}/biometria`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[dashboard/biometria] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar biometria." });
    }
  });

  app.get("/api/profissional/dashboard/pacientes/:id/treinamento", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/profissional/dashboard/clientes/${req.params.id}/treinamento`, {
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[dashboard/treinamento] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar treinamento." });
    }
  });

  // ─── Planos Alimentares — tudo via staging /api/nutricao ───────────────────
  // Contrato: /api/nutricao/planos-alimentares/{cliente_id}
  // Sem armazenamento local — todas as operações vão direto ao staging.
  // ────────────────────────────────────────────────────────────────────────────

  // GET /planos-alimentares — proxy direto ao staging
  app.get("/api/profissional/dashboard/pacientes/:id/planos-alimentares", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    try {
      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${req.params.id}`,
        { bearerToken: token }
      );
      if (!result.ok) {
        console.error("[planos-alimentares] staging error:", result.status, JSON.stringify(result.data));
        return res.status(result.status).json(result.data ?? { message: "Erro ao buscar planos." });
      }
      const data = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.results)
          ? result.data.results
          : [];
      return res.json(data);
    } catch (err: any) {
      console.error("[planos-alimentares] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // POST /planos-alimentares — cria no staging (sem fallback local)
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
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

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
      return res.status(result.status).json(result.data ?? { message: "Erro ao criar plano." });
    } catch (err: any) {
      console.error("[criar-plano] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // PATCH /planos-alimentares/:planoId — edição parcial (descricao, status, dias_ativos)
  app.patch("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    const pacienteId = req.params.id;
    const planoId = req.params.planoId;
    const validos = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

    const body: Record<string, unknown> = {};
    if (typeof req.body.descricao === "string" && req.body.descricao.trim()) {
      body.descricao = req.body.descricao.trim();
    }
    if (req.body.status === "ativo" || req.body.status === "rascunho") {
      body.status = req.body.status;
    }
    if (Array.isArray(req.body.dias_ativos)) {
      body.dias_ativos = [...new Set((req.body.dias_ativos as string[]).filter((d) => validos.includes(d)))];
    }

    if (Object.keys(body).length === 0) {
      return res.status(400).json({ message: "Nenhum campo válido para atualizar." });
    }

    try {
      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}`,
        { method: "PATCH", bearerToken: token, body }
      );
      if (!result.ok) {
        return res.status(result.status).json(result.data ?? { message: "Erro ao editar plano." });
      }
      return res.json(result.data);
    } catch (err: any) {
      console.error("[patch-plano] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // PUT /planos-alimentares/:planoId — atualização completa do plano (inclui refeicoes e alimentos)
  // Contrato: PATCH staging /api/nutricao/planos-alimentares/{cliente_id}/{plano_id}
  // Body: { id, cliente_id, profissional_id, descricao, status, refeicoes: [...] }
  app.put("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    const pacienteId = req.params.id;
    const planoId = req.params.planoId;

    try {
      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}`,
        { method: "PATCH", bearerToken: token, body: req.body }
      );
      if (!result.ok) {
        console.error("[put-plano-full] staging error:", result.status, JSON.stringify(result.data));
        return res.status(result.status).json(result.data ?? { message: "Erro ao atualizar plano." });
      }
      // Staging pode retornar 200 com body vazio (null) — enviar objeto explícito
      return res.json(result.data ?? { ok: true });
    } catch (err: any) {
      console.error("[put-plano-full] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // DELETE /planos-alimentares/:planoId — remoção permanente (204 No Content)
  app.delete("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    const pacienteId = req.params.id;
    const planoId = req.params.planoId;

    try {
      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}`,
        { method: "DELETE", bearerToken: token }
      );
      if (result.status === 204) return res.status(204).end();
      return res.status(result.status).json(result.data ?? { message: "Erro ao excluir plano." });
    } catch (err: any) {
      console.error("[delete-plano] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // GET /plano-alimentar — detalhe via staging GET /{cliente_id}/{plano_id}
  app.get("/api/profissional/dashboard/pacientes/:id/plano-alimentar", async (req, res) => {
    const planoId = req.query.planoId as string;
    const pacienteId = req.params.id;

    if (!planoId) {
      return res.status(400).json({ message: "planoId é obrigatório." });
    }

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
      console.error("[plano-alimentar] staging exception:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // POST .../refeicoes — staging /api/nutricao
  // Spec: id de cada AlimentoIn é OBRIGATÓRIO (UUID gerado pelo frontend)
  app.post("/api/profissional/dashboard/pacientes/:id/planos-alimentares/:planoId/refeicoes", async (req, res) => {
    const { nome, horario, alimentos, observacao } = req.body;
    if (!nome || typeof nome !== "string" || nome.trim().length === 0) {
      return res.status(400).json({ message: "nome é obrigatório." });
    }
    if (!horario || typeof horario !== "string") {
      return res.status(400).json({ message: "horario é obrigatório." });
    }

    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

    const alimentosPayload = Array.isArray(alimentos)
      ? alimentos.map((a: any) => ({
          id: a.id,                                          // UUID gerado pelo frontend (obrigatório)
          alimento_id: a.alimento_id ?? a.alimento_tbca_id, // UUID do catálogo
          quantidade: Number(a.quantidade),
          unidade: a.unidade ?? "g",
        }))
      : [];

    try {
      const result = await stagingPassthrough(
        `/api/nutricao/planos-alimentares/${req.params.id}/${req.params.planoId}/refeicoes`,
        {
          method: "POST",
          bearerToken: token,
          body: {
            nome: nome.trim(),
            horario,
            observacao: observacao?.trim() || "",
            alimentos: alimentosPayload,
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

  // GET progresso da refeição no dia
  app.get(
    "/api/nutricao/planos-alimentares/:clienteId/:planoId/refeicoes/:refeicaoId/progresso",
    async (req, res) => {
      const token = extractBearerToken(req);
      if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

      const { clienteId, planoId, refeicaoId } = req.params;
      const data = req.query.data as string;
      if (!data) return res.status(400).json({ message: "Parâmetro 'data' é obrigatório." });

      try {
        const result = await stagingPassthrough(
          `/api/nutricao/planos-alimentares/${clienteId}/${planoId}/refeicoes/${refeicaoId}/progresso?data=${data}`,
          { bearerToken: token }
        );
        return res.status(result.status).json(result.data);
      } catch (err: any) {
        console.error("[progresso-refeicao] staging exception:", err.message);
        return res.status(502).json({ message: "Erro ao buscar progresso." });
      }
    }
  );

  // POST confirmar alimento do plano (manual — sem registro_id, com data_referencia e status)
  app.post(
    "/api/nutricao/planos-alimentares/:clienteId/:planoId/refeicoes/:refeicaoId/alimentos/:alimentoPlanoId/confirmar",
    async (req, res) => {
      const token = extractBearerToken(req);
      if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });

      const { clienteId, planoId, refeicaoId, alimentoPlanoId } = req.params;

      try {
        const result = await stagingPassthrough(
          `/api/nutricao/planos-alimentares/${clienteId}/${planoId}/refeicoes/${refeicaoId}/alimentos/${alimentoPlanoId}/confirmar`,
          { method: "POST", bearerToken: token, body: req.body }
        );
        return res.status(result.status).json(result.data);
      } catch (err: any) {
        console.error("[confirmar-alimento] staging exception:", err.message);
        return res.status(502).json({ message: "Erro ao confirmar alimento." });
      }
    }
  );

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

  // ─── Refeições do Usuário — slots do diário alimentar (B2C, token do usuário) ─

  app.get("/api/nutricao/refeicoes", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough("/api/nutricao/refeicoes", { bearerToken: token });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[refeicoes/list] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao buscar refeições." });
    }
  });

  app.post("/api/nutricao/refeicoes/criar-padrao", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough("/api/nutricao/refeicoes/criar-padrao", {
        method: "POST",
        bearerToken: token,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[refeicoes/criar-padrao] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao criar refeições padrão." });
    }
  });

  app.post("/api/nutricao/refeicoes", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough("/api/nutricao/refeicoes", {
        method: "POST",
        bearerToken: token,
        body: req.body,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[refeicoes/create] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao criar refeição." });
    }
  });

  app.patch("/api/nutricao/refeicoes/:id", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(422).json({ message: "refeicao_id deve ser um número inteiro." });
    try {
      const result = await stagingPassthrough(`/api/nutricao/refeicoes/${id}`, {
        method: "PATCH",
        bearerToken: token,
        body: req.body,
      });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[refeicoes/patch] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao editar refeição." });
    }
  });

  app.delete("/api/nutricao/refeicoes/:id", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(422).json({ message: "refeicao_id deve ser um número inteiro." });
    try {
      const result = await stagingPassthrough(`/api/nutricao/refeicoes/${id}`, {
        method: "DELETE",
        bearerToken: token,
      });
      if (result.status === 204) return res.status(204).end();
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[refeicoes/delete] proxy error:", err.message);
      return res.status(502).json({ message: "Erro ao remover refeição." });
    }
  });

  // ─── Catálogo Nutricional — todos exigem JWTAuth, usamos token do usuário ────

  app.get("/api/nutricao/catalogo/fontes", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough("/api/nutricao/catalogo/fontes", { bearerToken: token });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/fontes error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/grupos", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough("/api/nutricao/catalogo/grupos", { bearerToken: token });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/grupos error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/tipos", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough("/api/nutricao/catalogo/tipos", { bearerToken: token });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/tipos error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/nutrientes", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const params: Record<string, string> = {};
      if (req.query.categoria) params.categoria = req.query.categoria as string;
      const result = await stagingPassthrough("/api/nutricao/catalogo/nutrientes", { bearerToken: token, params });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/nutrientes error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  // GET /alimentos/meus — alimentos cadastrados pelo próprio profissional
  app.get("/api/nutricao/catalogo/alimentos/meus", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const params: Record<string, string> = {};
      if (req.query.limite) params.limite = req.query.limite as string;
      if (req.query.offset) params.offset = req.query.offset as string;
      const result = await stagingPassthrough("/api/nutricao/catalogo/alimentos/meus", { bearerToken: token, params });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/alimentos/meus error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/alimentos/codigo/:codigo", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/nutricao/catalogo/alimentos/codigo/${req.params.codigo}`, { bearerToken: token });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/alimentos/codigo/:codigo error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/alimentos/:id", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    try {
      const result = await stagingPassthrough(`/api/nutricao/catalogo/alimentos/${req.params.id}`, { bearerToken: token });
      return res.status(result.status).json(result.data);
    } catch (err: any) {
      console.error("[proxy] /catalogo/alimentos/:id error:", err.message);
      return res.status(502).json({ message: "Erro ao conectar com o servidor." });
    }
  });

  app.get("/api/nutricao/catalogo/alimentos", async (req, res) => {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
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
      const result = await stagingPassthrough("/api/nutricao/catalogo/alimentos", { bearerToken: token, params });
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
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: "Token de autenticação ausente." });
    const { alimento_id, quantidade_consumida } = req.body;
    const qtd = Number(quantidade_consumida);
    if (!alimento_id || isNaN(qtd) || qtd <= 0) {
      return res.status(422).json({ message: "alimento_id e quantidade_consumida (>0) são obrigatórios." });
    }
    try {
      const result = await stagingPassthrough("/api/nutricao/catalogo/calcular", {
        method: "POST",
        bearerToken: token,
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
