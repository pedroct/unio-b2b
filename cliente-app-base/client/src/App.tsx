import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClienteSidebar } from "@/components/cliente-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import InicioPage from "@/pages/inicio";

function PlaceholderPage({ titulo }: { titulo: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      <p className="text-sm text-muted-foreground mt-1">Em breve.</p>
    </div>
  );
}

function ClienteLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <ClienteSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-3 border-b shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location !== "/login") {
      return <Redirect to="/login" />;
    }
    return <LoginPage />;
  }

  if (location === "/login" || location === "/" || location === "") {
    return <Redirect to="/inicio" />;
  }

  return (
    <ClienteLayout>
      <Switch>
        <Route path="/inicio" component={InicioPage} />
        <Route path="/nutricao">
          <PlaceholderPage titulo="Nutrição" />
        </Route>
        <Route path="/treino">
          <PlaceholderPage titulo="Treino" />
        </Route>
        <Route path="/biometria">
          <PlaceholderPage titulo="Biometria" />
        </Route>
        <Route path="/hidratacao">
          <PlaceholderPage titulo="Hidratação" />
        </Route>
        <Route path="/configuracoes">
          <PlaceholderPage titulo="Configurações" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </ClienteLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
