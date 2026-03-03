import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Settings2, HeartPulse, Activity, Moon, Dumbbell, UtensilsCrossed, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AbaCockpit } from "@/components/longevidade/aba-cockpit";
import { AbaCardiometabolico } from "@/components/longevidade/aba-cardiometabolico";
import { AbaTrancada } from "@/components/longevidade/aba-trancada";
import type { Patient } from "@shared/schema";

function PatientHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function PatientDashboardPage() {
  const [, params] = useRoute("/pacientes/:id/dashboard");
  const patientId = params?.id || "";

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/profissional/pacientes", patientId],
    enabled: !!patientId,
  });

  const initials = patient?.name
    ? patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-patient-dashboard">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {isLoading ? (
          <PatientHeaderSkeleton />
        ) : patient ? (
          <div className="flex items-center justify-between flex-1 gap-4 flex-wrap min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold tracking-tight" data-testid="text-patient-name">
                    {patient.name}
                  </h1>
                  <Badge
                    variant={patient.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {patient.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-patient-info">
                  {patient.age} anos · {patient.gender === "M" ? "Masculino" : "Feminino"} · {patient.email}
                </p>
              </div>
            </div>

            <Link href={`/pacientes/${patientId}/configuracoes`}>
              <Button variant="outline" size="sm" data-testid="button-patient-settings">
                <Settings2 className="h-4 w-4 mr-2" />
                Metas
              </Button>
            </Link>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="cockpit" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1" data-testid="tabs-longevidade">
          <TabsTrigger value="cockpit" data-testid="tab-trigger-cockpit">
            <HeartPulse className="h-3.5 w-3.5 mr-1.5" />
            Cockpit
          </TabsTrigger>
          <TabsTrigger value="cardiometabolico" data-testid="tab-trigger-cardiometabolico">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Cardiometabólico
          </TabsTrigger>
          <TabsTrigger value="recuperacao" data-testid="tab-trigger-recuperacao" className="gap-1">
            <Moon className="h-3.5 w-3.5 mr-1" />
            Recuperação & Sono
            <Lock className="h-3 w-3 ml-0.5 text-muted-foreground" />
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-trigger-performance" className="gap-1">
            <Dumbbell className="h-3.5 w-3.5 mr-1" />
            Performance
            <Lock className="h-3 w-3 ml-0.5 text-muted-foreground" />
          </TabsTrigger>
          <TabsTrigger value="nutricao" data-testid="tab-trigger-nutricao" className="gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1" />
            Nutrição
            <Lock className="h-3 w-3 ml-0.5 text-muted-foreground" />
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="cockpit">
            <AbaCockpit pacienteId={patientId} />
          </TabsContent>
          <TabsContent value="cardiometabolico">
            <AbaCardiometabolico pacienteId={patientId} />
          </TabsContent>
          <TabsContent value="recuperacao">
            <AbaTrancada
              titulo="Recuperação & Sono"
              mensagem="Recuperação & Sono estará disponível em breve. Aqui você acompanhará tempo de sono, estágios REM e profundo, HRV noturna e equilíbrio entre carga de treino e recuperação."
            />
          </TabsContent>
          <TabsContent value="performance">
            <AbaTrancada
              titulo="Performance & Funcionalidade"
              mensagem="Performance & Funcionalidade estará disponível em breve. Aqui você acompanhará volume semanal de treino, zonas de frequência cardíaca, velocidade de caminhada e indicadores de força."
            />
          </TabsContent>
          <TabsContent value="nutricao">
            <AbaTrancada
              titulo="Nutrição"
              mensagem="Nutrição como driver biológico estará disponível em breve. Aqui você verá correlações entre proteína relativa e massa magra, calorias vs gasto energético, e impacto da alimentação nos biomarcadores."
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
