import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

let isMobile = false;

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content" {...props}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function SidebarShell() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Tooltip text">Item</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarTrigger data-testid="sidebar-trigger" />
    </SidebarProvider>
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    isMobile = false;
    document.cookie = "";
  });

  it("toggles state via trigger", async () => {
    const user = userEvent.setup();
    const { container } = render(<SidebarShell />);

    const sidebar = container.querySelector("[data-slot='sidebar']");
    expect(sidebar).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByTestId("sidebar-trigger"));

    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });

  it("toggles via keyboard shortcut", () => {
    const { container } = render(<SidebarShell />);
    const sidebar = container.querySelector("[data-slot='sidebar']");

    fireEvent.keyDown(window, { key: "b", ctrlKey: true });

    expect(sidebar).toHaveAttribute("data-state", "collapsed");
  });

  it("renders tooltip content when provided", () => {
    render(<SidebarShell />);

    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });

  it("renders mobile sheet content", async () => {
    isMobile = true;
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>Content</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );

    expect(screen.getByTestId("sheet-content")).toHaveAttribute(
      "data-mobile",
      "true",
    );
  });

  it("throws when useSidebar is called outside provider", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Problem = () => {
      useSidebar();
      return <div />;
    };

    expect(() => render(<Problem />)).toThrow(
      "useSidebar must be used within a SidebarProvider.",
    );
    errorSpy.mockRestore();
  });

  it("renders menu extras and sub items", () => {
    render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon" variant="floating">
          <SidebarHeader>
            <SidebarInput placeholder="Search" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Group</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Add" />
              <SidebarSeparator />
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={{ children: "Tooltip" }}
                      data-testid="menu-button"
                    >
                      Item
                    </SidebarMenuButton>
                    <SidebarMenuAction aria-label="Action" />
                    <SidebarMenuBadge>2</SidebarMenuBadge>
                  </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenuSkeleton showIcon data-testid="menu-skeleton" />
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton data-testid="sub-button">
                      Sub
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset data-testid="sidebar-inset" />
      </SidebarProvider>,
    );

    expect(screen.getByTestId("menu-button")).toBeInTheDocument();
    expect(screen.getByTestId("menu-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("sub-button")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-inset")).toBeInTheDocument();
  });
});
