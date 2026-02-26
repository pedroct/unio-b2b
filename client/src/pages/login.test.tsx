import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./login";

const { loginMock, toastMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  toastMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    professional: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/ui/select", () => {
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void;
  } | null>(null);

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
      <SelectContext.Provider value={{ onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children, "data-testid": testId }: { children: React.ReactNode; "data-testid"?: string }) => (
      <button type="button" data-testid={testId}>
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const ctx = React.useContext(SelectContext);
      return (
        <button type="button" onClick={() => ctx?.onValueChange?.(value)}>
          {children}
        </button>
      );
    },
  };
});

vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useLocation: () => ["/login", navigateMock],
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
    toastMock.mockReset();
    navigateMock.mockReset();
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByTestId("page-login")).toBeInTheDocument();
    expect(screen.getByTestId("text-login-title")).toHaveTextContent(
      "Bem-vindo de volta",
    );
    expect(screen.getByTestId("input-registration")).toBeInTheDocument();
    expect(screen.getByTestId("select-uf")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
    expect(screen.getByTestId("button-login")).toBeInTheDocument();
  });

  it("formats the registration number", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByTestId("input-registration");
    await user.type(input, "crm12345");

    expect(input).toHaveValue("CRM-12345");
  });

  it("formats the CPF input", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByTestId("input-password");
    await user.type(input, "12345678901");

    expect(input).toHaveValue("123.456.789-01");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByTestId("input-password");
    const toggle = screen.getByTestId("button-toggle-password");

    expect(input).toHaveAttribute("type", "password");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
  });

  it("submits and navigates on success", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByTestId("input-registration"), "crm12345");
    await user.click(screen.getByTestId("select-uf"));
    await user.click(screen.getByText("SP"));
    await user.type(screen.getByTestId("input-password"), "12345678901");
    await user.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("CRM-12345", "SP", "12345678901");
      expect(navigateMock).toHaveBeenCalledWith("/pacientes");
    });
  });

  it("shows toast on login error", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValueOnce(new Error("Falha"));

    render(<LoginPage />);

    await user.type(screen.getByTestId("input-registration"), "crm12345");
    await user.click(screen.getByTestId("select-uf"));
    await user.click(screen.getByText("SP"));
    await user.type(screen.getByTestId("input-password"), "12345678901");
    await user.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: "Erro de autenticação",
        description: "Falha",
        variant: "destructive",
      });
    });
  });
});
