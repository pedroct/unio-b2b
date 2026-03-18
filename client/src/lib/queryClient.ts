import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

function getAccessToken(): string | null {
  try {
    const stored = localStorage.getItem("unio_auth");
    if (stored) {
      const data = JSON.parse(stored);
      return data.tokens?.access || null;
    }
  } catch {}
  return null;
}

function getRefreshToken(): string | null {
  try {
    const stored = localStorage.getItem("unio_auth");
    if (stored) {
      const data = JSON.parse(stored);
      return data.tokens?.refresh || null;
    }
  } catch {}
  return null;
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Unauthorized handler — clears session and redirects to login
// ---------------------------------------------------------------------------

let _refreshing: Promise<boolean> | null = null;

export function handleUnauthorized(): void {
  localStorage.removeItem("unio_auth");
  window.location.replace("/");
}

// ---------------------------------------------------------------------------
// Token refresh — singleton promise to avoid parallel refresh races
// ---------------------------------------------------------------------------

async function tryRefreshToken(): Promise<boolean> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) return false;

      const newTokens = await res.json();
      const stored = localStorage.getItem("unio_auth");
      if (!stored) return false;
      const data = JSON.parse(stored);
      data.tokens = { ...data.tokens, ...newTokens };
      localStorage.setItem("unio_auth", JSON.stringify(data));
      return true;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
}

// ---------------------------------------------------------------------------
// fetchWithAuth — wraps fetch with automatic refresh + redirect on 401
// ---------------------------------------------------------------------------

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = buildAuthHeaders(
    (init.headers as Record<string, string>) ?? {}
  );
  let res = await fetch(url, { ...init, headers, credentials: "include" });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = buildAuthHeaders(
        (init.headers as Record<string, string>) ?? {}
      );
      res = await fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
    }
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error("401: Sessão expirada. Faça login novamente.");
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// throwIfResNotOk
// ---------------------------------------------------------------------------

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// apiRequest — mutations / imperative calls
// ---------------------------------------------------------------------------

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await fetchWithAuth(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

// ---------------------------------------------------------------------------
// getQueryFn — default queryFn for useQuery with queryKey-based URL
// ---------------------------------------------------------------------------

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetchWithAuth(queryKey.join("/") as string);
      await throwIfResNotOk(res);
      return await res.json();
    } catch (err: any) {
      if (
        err?.message?.startsWith("401") &&
        unauthorizedBehavior === "returnNull"
      ) {
        return null;
      }
      throw err;
    }
  };

// ---------------------------------------------------------------------------
// QueryClient
// ---------------------------------------------------------------------------

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
