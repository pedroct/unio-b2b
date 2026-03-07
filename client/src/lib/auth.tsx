import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { Professional, AuthTokens } from "@shared/schema";

interface AuthContextType {
  professional: Professional | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (registrationNumber: string, uf: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("unio_auth");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setProfessional(data.professional);
        setTokens(data.tokens);
      } catch {
        localStorage.removeItem("unio_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const profileFetchedRef = useRef(false);

  useEffect(() => {
    if (!professional || !tokens) return;
    if (profileFetchedRef.current) return;
    if (professional.name && !/^[A-Z]{2,5}\d+$/i.test(professional.name)) return;

    profileFetchedRef.current = true;
    (async () => {
      try {
        const profileRes = await fetch("/api/profissional/me", {
          headers: { "Authorization": `Bearer ${tokens.access}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.name) {
            const updated = {
              ...professional,
              name: profile.name,
              specialty: profile.specialty || professional.specialty,
              email: profile.email || professional.email,
            };
            setProfessional(updated);
            const stored = localStorage.getItem("unio_auth");
            if (stored) {
              const data = JSON.parse(stored);
              data.professional = updated;
              localStorage.setItem("unio_auth", JSON.stringify(data));
            }
          }
        }
      } catch {}
    })();
  }, [professional?.name, tokens?.access]);

  const login = useCallback(async (registrationNumber: string, uf: string, password: string) => {
    const res = await fetch("/api/auth/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber, uf, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Erro ao fazer login" }));
      throw new Error(error.message || "Credenciais inválidas");
    }

    const data = await res.json();
    setProfessional(data.professional);
    setTokens(data.tokens);
    localStorage.setItem("unio_auth", JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setProfessional(null);
    setTokens(null);
    localStorage.removeItem("unio_auth");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        professional,
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
