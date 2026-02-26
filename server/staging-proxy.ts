let cachedToken: { access: string; refresh: string; expiresAt: number } | null = null;

const STAGING_URL = process.env.STAGING_API_URL || "https://staging.unio.tec.br";
const STAGING_EMAIL = process.env.STAGING_EMAIL || "";
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || "";

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.access;
  }

  const res = await fetch(`${STAGING_URL}/api/auth/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: STAGING_EMAIL, password: STAGING_PASSWORD }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Staging auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    access: data.access,
    refresh: data.refresh,
    expiresAt: Date.now() + 25 * 60 * 1000,
  };

  return cachedToken.access;
}

export async function stagingFetch(
  path: string,
  options: { method?: string; body?: any; params?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const token = await getAccessToken();

  let url = `${STAGING_URL}${path}`;
  if (options.params) {
    const qs = new URLSearchParams(options.params).toString();
    if (qs) url += `?${qs}`;
  }

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}
