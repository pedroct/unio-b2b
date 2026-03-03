import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const stored = localStorage.getItem("unio_auth");
    if (!stored) return false;
    const data = JSON.parse(stored);
    const refreshToken = data.tokens?.refresh;
    if (!refreshToken) return false;

    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) return false;

    const newTokens = await res.json();
    data.tokens = { ...data.tokens, ...newTokens };
    localStorage.setItem("unio_auth", JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = buildAuthHeaders(data ? { "Content-Type": "application/json" } : {});
  let res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = buildAuthHeaders(data ? { "Content-Type": "application/json" } : {});
      res = await fetch(url, {
        method,
        headers: retryHeaders,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = buildAuthHeaders();
    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const retryHeaders = buildAuthHeaders();
        const retryRes = await fetch(queryKey.join("/") as string, {
          headers: retryHeaders,
          credentials: "include",
        });

        if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
          return null;
        }
        await throwIfResNotOk(retryRes);
        return await retryRes.json();
      }

      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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
