import type { Express } from "express";
import type { Server } from "http";
import { clienteLoginSchema } from "../shared/schema";

export async function registerRoutes(httpServer: Server, app: Express) {
  app.post("/api/auth/login", async (req, res) => {
    const parsed = clienteLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Dados inválidos.";
      return res.status(422).json({ message: firstError });
    }

    const { email } = parsed.data;
    const nome = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    return res.json({
      cliente: {
        id: "c1",
        nome,
        email,
        telefone: "(11) 99999-0000",
      },
      tokens: {
        access: "mock-access-token-cliente",
        refresh: "mock-refresh-token-cliente",
      },
    });
  });

  return httpServer;
}
