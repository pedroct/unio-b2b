import { z } from "zod";

export const clienteLoginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export type ClienteLoginCredentials = z.infer<typeof clienteLoginSchema>;

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  genero?: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ClienteAuthResponse {
  tokens: AuthTokens;
  cliente: Cliente;
}
