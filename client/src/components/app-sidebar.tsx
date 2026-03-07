import { useLocation, Link } from "wouter";
import { Users, LayoutDashboard, Settings, LogOut, UtensilsCrossed } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import unioLogo from "@assets/Unio_Logo_1771972757927.png";

const navItems = [
  { title: "Clientes", url: "/pacientes", icon: Users },
  { title: "Visão geral", url: "/dashboard", icon: LayoutDashboard },
  { title: "Prescrição alimentar", url: "/prescricao-alimentar", icon: UtensilsCrossed },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

function isRegistrationNumber(name: string): boolean {
  return /^[A-Z]{2,5}\d+$/i.test(name);
}

function formatRegistrationDisplay(reg: string, uf: string): string {
  const match = reg.match(/^([A-Z]+)(\d+)$/i);
  if (match) {
    return `${match[1].toUpperCase()} ${match[2]} — ${uf.toUpperCase()}`;
  }
  return reg;
}

export function AppSidebar() {
  const [location] = useLocation();
  const { professional, logout } = useAuth();

  const nameIsReg = professional?.name ? isRegistrationNumber(professional.name) : false;
  const displayName = professional?.name
    ? (nameIsReg ? "Profissional" : professional.name)
    : "Profissional";
  const displaySpecialty = professional?.name
    ? (nameIsReg
      ? formatRegistrationDisplay(professional.name, professional.uf || "")
      : (professional.specialty || "Especialidade"))
    : "Especialidade";

  const initials = nameIsReg
    ? "PR"
    : (professional?.name
      ? professional.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
      : "UN");

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex flex-col gap-1">
          <img src={unioLogo} alt="UNIO" className="h-6 object-contain object-left" data-testid="text-brand-name" />
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground font-medium">Dados que cuidam de você</p>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-professional-name">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-professional-specialty">
              {displaySpecialty}
            </p>
          </div>
          <SidebarMenuButton
            onClick={logout}
            className="h-9 w-9 p-0 flex items-center justify-center shrink-0"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
