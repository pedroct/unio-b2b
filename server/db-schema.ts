import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const planosAlimentares = pgTable("planos_alimentares_local", {
  id: text("id").primaryKey(),
  pacienteId: text("paciente_id").notNull(),
  descricao: text("descricao").notNull(),
  status: text("status").notNull().default("rascunho"),
  diasAtivos: jsonb("dias_ativos").notNull().default([]),
  refeicoes: jsonb("refeicoes").notNull().default([]),
  nutrientes: jsonb("nutrientes").notNull().default({}),
  dataCriacao: timestamp("data_criacao").notNull().defaultNow(),
});
