import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, getQueryFn } from "./queryClient";

type MockResponse = {
  ok: boolean;
  status: number;
  statusText?: string;
  text: () => Promise<string>;
  json: () => Promise<any>;
};

const buildResponse = ({
  ok,
  status,
  body,
  statusText = "",
}: {
  ok: boolean;
  status: number;
  body: string;
  statusText?: string;
}): MockResponse => ({
  ok,
  status,
  statusText,
  text: async () => body,
  json: async () => JSON.parse(body),
});

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("queryClient", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("apiRequest returns response on success", async () => {
    fetchMock.mockResolvedValue(
      buildResponse({ ok: true, status: 200, body: "{}" }),
    );

    const res = await apiRequest("POST", "/api/test", { ok: true });

    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
      credentials: "include",
    });
  });

  it("apiRequest throws when response is not ok", async () => {
    fetchMock.mockResolvedValue(
      buildResponse({ ok: false, status: 500, body: "Erro" }),
    );

    await expect(apiRequest("GET", "/api/test")).rejects.toThrow(
      "500: Erro",
    );
  });

  it("getQueryFn returns null on 401 when configured", async () => {
    fetchMock.mockResolvedValue(
      buildResponse({ ok: false, status: 401, body: "Unauthorized" }),
    );

    const queryFn = getQueryFn({ on401: "returnNull" });
    const result = await queryFn({ queryKey: ["/api/secure"] } as any);

    expect(result).toBeNull();
  });

  it("getQueryFn returns json when ok", async () => {
    fetchMock.mockResolvedValue(
      buildResponse({ ok: true, status: 200, body: "{\"ok\":true}" }),
    );

    const queryFn = getQueryFn({ on401: "throw" });
    const result = await queryFn({ queryKey: ["/api/data"] } as any);

    expect(result).toEqual({ ok: true });
  });

  it("getQueryFn throws when response is not ok", async () => {
    fetchMock.mockResolvedValue(
      buildResponse({ ok: false, status: 500, body: "Erro" }),
    );

    const queryFn = getQueryFn({ on401: "throw" });

    await expect(
      queryFn({ queryKey: ["/api/data"] } as any),
    ).rejects.toThrow("500: Erro");
  });
});
