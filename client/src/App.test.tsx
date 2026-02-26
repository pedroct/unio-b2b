import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

let mockLocation = "/login";
const mockNavigate = vi.fn();
let authState = {
  isAuthenticated: false,
  isLoading: false,
};

vi.mock("wouter", () => ({
  useLocation: () => [mockLocation, mockNavigate],
  Redirect: ({ to }: { to: string }) => (
    <div data-testid="redirect" data-to={to} />
  ),
  Route: ({ path, component: Component }: { path?: string; component?: () => JSX.Element }) => {
    if (!path && Component) {
      return <Component />;
    }
    if (path === mockLocation && Component) {
      return <Component />;
    }
    return null;
  },
  Switch: ({ children }: { children: React.ReactNode }) => {
    const elements = React.Children.toArray(children) as React.ReactElement[];
    for (const element of elements) {
      if (!React.isValidElement(element)) {
        continue;
      }
      const { path } = element.props as { path?: string };
      if (!path || path === mockLocation) {
        return element;
      }
    }
    return null;
  },
}));

vi.mock("@/lib/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    professional: null,
    tokens: authState.isAuthenticated ? { accessToken: "token" } : null,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/components/app-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarTrigger: () => <button data-testid="button-sidebar-toggle" />,
}));

vi.mock("@/pages/login", () => ({
  default: () => <div data-testid="page-login-mock" />,
}));

vi.mock("@/pages/patients", () => ({
  default: () => <div data-testid="page-patients" />,
}));

vi.mock("@/pages/patient-dashboard", () => ({
  default: () => <div data-testid="page-dashboard" />,
}));

vi.mock("@/pages/patient-settings", () => ({
  default: () => <div data-testid="page-settings" />,
}));

vi.mock("@/pages/not-found", () => ({
  default: () => <div data-testid="page-not-found" />,
}));

describe("App", () => {
  it("shows loading state while auth is loading", () => {
    authState = { isAuthenticated: false, isLoading: true };
    mockLocation = "/login";

    render(<App />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("redirects to login when unauthenticated", () => {
    authState = { isAuthenticated: false, isLoading: false };
    mockLocation = "/pacientes";

    render(<App />);

    const redirect = screen.getByTestId("redirect");
    expect(redirect).toHaveAttribute("data-to", "/login");
  });

  it("renders login page on /login when unauthenticated", () => {
    authState = { isAuthenticated: false, isLoading: false };
    mockLocation = "/login";

    render(<App />);

    expect(screen.getByTestId("page-login-mock")).toBeInTheDocument();
  });

  it("renders patients page when authenticated", () => {
    authState = { isAuthenticated: true, isLoading: false };
    mockLocation = "/pacientes";

    render(<App />);

    expect(screen.getByTestId("page-patients")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
  });
});
