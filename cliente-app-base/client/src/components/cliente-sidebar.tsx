import { useLocation, Link } from "wouter";
import { Home, UtensilsCrossed, Dumbbell, Activity, Droplets, Settings, LogOut } from "lucide-react";
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
  { title: "Início", url: "/inicio", icon: Home },
  { title: "Nutrição", url: "/nutricao", icon: UtensilsCrossed },
  { title: "Treino", url: "/treino", icon: Dumbbell },
  { title: "Biometria", url: "/biometria", icon: Activity },
  { title: "Hidratação", url: "/hidratacao", icon: Droplets },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function ClienteSidebar() {
  const [location] = useLocation();
  const { cliente, logout } = useAuth();

  const initials = cliente?.nome
    ? cliente.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "CL";

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
                const isActive = location === item.url || (item.url !== "/inicio" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
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
            <p className="text-sm font-medium truncate" data-testid="text-cliente-name">
              {cliente?.nome || "Cliente"}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-cliente-email">
              {cliente?.email || ""}
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
