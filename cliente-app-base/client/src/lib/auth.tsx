import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Cliente, AuthTokens } from "@shared/schema";

interface AuthContextType {
  cliente: Cliente | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("unio_cliente_auth");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setCliente(data.cliente);
        setTokens(data.tokens);
      } catch {
        localStorage.removeItem("unio_cliente_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Erro ao fazer login" }));
      throw new Error(error.message || "Credenciais inválidas");
    }

    const data = await res.json();
    setCliente(data.cliente);
    setTokens(data.tokens);
    localStorage.setItem("unio_cliente_auth", JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setCliente(null);
    setTokens(null);
    localStorage.removeItem("unio_cliente_auth");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        cliente,
        tokens,
        isAuthenticated: !!tokens,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
