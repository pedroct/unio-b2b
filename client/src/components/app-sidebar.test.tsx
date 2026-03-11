import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./app-sidebar";

const logoutMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/clientes"],
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    professional: { name: "Dra. Ana", specialty: "Cardiologia" },
    logout: logoutMock,
  }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarSeparator: () => <div />,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean }) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@assets/Unio_Logo_1771972757927.png", () => ({
  default: "logo",
}));

describe("AppSidebar", () => {
  it("renders nav and professional info", () => {
    render(<AppSidebar />);

    expect(screen.getByTestId("text-brand-name")).toBeInTheDocument();
    expect(screen.getByTestId("nav-clientes")).toBeInTheDocument();
    expect(screen.getByTestId("text-professional-name")).toHaveTextContent(
      "Dra. Ana",
    );
    expect(screen.getByTestId("text-professional-specialty")).toHaveTextContent(
      "Cardiologia",
    );
  });

  it("calls logout", async () => {
    const user = userEvent.setup();
    render(<AppSidebar />);

    await user.click(screen.getByTestId("button-logout"));

    expect(logoutMock).toHaveBeenCalled();
  });
});
