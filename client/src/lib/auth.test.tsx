import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./auth";

type AuthSnapshot = {
  isLoading: boolean;
  isAuthenticated: boolean;
  name: string | null;
};

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function AuthConsumer({ onSnapshot }: { onSnapshot: (snapshot: AuthSnapshot) => void }) {
  const { isAuthenticated, isLoading, professional, login, logout } = useAuth();

  onSnapshot({
    isAuthenticated,
    isLoading,
    name: professional?.name ?? null,
  });

  return (
    <div>
      <button
        type="button"
        data-testid="button-login"
        onClick={() => login("CRM-12345", "SP", "123.456.789-01")}
      >
        Login
      </button>
      <button type="button" data-testid="button-logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
  });

  it("hydrates auth from localStorage", async () => {
    localStorage.setItem(
      "unio_auth",
      JSON.stringify({
        professional: { id: "p1", name: "Dra. Ana" },
        tokens: { access: "token", refresh: "refresh" },
      }),
    );

    const snapshots: AuthSnapshot[] = [];
    render(
      <AuthProvider>
        <AuthConsumer onSnapshot={(snapshot) => snapshots.push(snapshot)} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(snapshots.at(-1)?.isLoading).toBe(false);
    });

    expect(snapshots.at(-1)).toEqual({
      isAuthenticated: true,
      isLoading: false,
      name: "Dra. Ana",
    });
  });

  it("clears invalid stored auth", async () => {
    localStorage.setItem("unio_auth", "not-json");

    const snapshots: AuthSnapshot[] = [];
    render(
      <AuthProvider>
        <AuthConsumer onSnapshot={(snapshot) => snapshots.push(snapshot)} />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(snapshots.at(-1)?.isLoading).toBe(false);
    });

    expect(localStorage.getItem("unio_auth")).toBeNull();
    expect(snapshots.at(-1)?.isAuthenticated).toBe(false);
  });

  it("logs in and stores auth", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        professional: { id: "p1", name: "Dra. Ana" },
        tokens: { access: "token", refresh: "refresh" },
      }),
    });

    const snapshots: AuthSnapshot[] = [];
    render(
      <AuthProvider>
        <AuthConsumer onSnapshot={(snapshot) => snapshots.push(snapshot)} />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(snapshots.at(-1)?.isAuthenticated).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/pair", expect.any(Object));
    expect(localStorage.getItem("unio_auth")).toContain("token");
  });

  it("logs out and clears storage", async () => {
    localStorage.setItem(
      "unio_auth",
      JSON.stringify({
        professional: { id: "p1", name: "Dra. Ana" },
        tokens: { access: "token", refresh: "refresh" },
      }),
    );

    const snapshots: AuthSnapshot[] = [];
    render(
      <AuthProvider>
        <AuthConsumer onSnapshot={(snapshot) => snapshots.push(snapshot)} />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByTestId("button-logout"));

    await waitFor(() => {
      expect(snapshots.at(-1)?.isAuthenticated).toBe(false);
    });

    expect(localStorage.getItem("unio_auth")).toBeNull();
  });

  it("throws when login fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Falha" }),
    });

    const errors: string[] = [];

    const ErrorConsumer = () => {
      const { login } = useAuth();
      return (
        <button
          type="button"
          data-testid="button-login-error"
          onClick={() => login("CRM-12345", "SP", "123").catch((err) => errors.push(err.message))}
        >
          Login
        </button>
      );
    };

    render(
      <AuthProvider>
        <ErrorConsumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByTestId("button-login-error"));

    await waitFor(() => {
      expect(errors.at(-1)).toBe("Falha");
    });
  });
});
