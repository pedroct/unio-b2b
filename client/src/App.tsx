import React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import PatientsPage from "@/pages/patients";
import PatientDashboardPage from "@/pages/patient-dashboard";
import PatientSettingsPage from "@/pages/patient-settings";
import PrescricaoAlimentarPage from "@/pages/prescricao-alimentar";
import PrescricaoAlimentarListaPage from "@/pages/prescricao-alimentar-lista";
import PrescricaoAlimentarPlanosPage from "@/pages/prescricao-alimentar-planos";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
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
    return <Redirect to="/clientes" />;
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/clientes" component={PatientsPage} />
        <Route path="/clientes/:id/dashboard" component={PatientDashboardPage} />
        <Route path="/clientes/:id/configuracoes" component={PatientSettingsPage} />
        <Route path="/prescricao-alimentar/:pacienteId/plano/:planoId" component={PrescricaoAlimentarPage} />
        <Route path="/prescricao-alimentar/:pacienteId" component={PrescricaoAlimentarPlanosPage} />
        <Route path="/prescricao-alimentar" component={PrescricaoAlimentarListaPage} />
        <Route path="/dashboard" component={PatientsPage} />
        <Route path="/configuracoes">
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
            <p className="text-sm text-muted-foreground mt-1">Em breve.</p>
          </div>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
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
