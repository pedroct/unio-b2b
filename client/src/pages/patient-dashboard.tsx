import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, HeartPulse, Activity, Moon, Dumbbell, UtensilsCrossed, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AbaCockpit } from "@/components/longevidade/aba-cockpit";
import { AbaCardiometabolico } from "@/components/longevidade/aba-cardiometabolico";
import { AbaRecuperacaoSono } from "@/components/longevidade/aba-recuperacao-sono";
import { AbaPerformanceFuncional } from "@/components/longevidade/aba-performance-funcional";
import { AbaTrancada } from "@/components/longevidade/aba-trancada";
import { ErroAcessoPaciente } from "@/components/longevidade/erro-acesso";
import type { Patient } from "@shared/schema";

function truncarEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local[0]}****@${domain}`;
}

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

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ["/api/profissional/pacientes", patientId],
    enabled: !!patientId,
  });

  const httpStatus = error?.message ? parseInt(error.message.split(":")[0]) : null;

  if (!isLoading && httpStatus === 403) {
    return <ErroAcessoPaciente tipo="forbidden" />;
  }
  if (!isLoading && (httpStatus === 404 || (!patient && !isLoading))) {
    return <ErroAcessoPaciente tipo="not-found" />;
  }

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
                  <h1
                    className="text-xl font-semibold tracking-tight"
                    style={{ color: "var(--sys-text-primary)" }}
                    data-testid="text-patient-name"
                  >
                    {patient.name}
                  </h1>
                  <span
                    className="badge-status-ativo text-[11px] font-medium px-2 py-0.5 rounded-full"
                    data-testid="badge-status"
                  >
                    {patient.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--sys-text-secondary)" }}
                  data-testid="text-patient-info"
                >
                  {patient.age} anos · {patient.gender === "M" ? "Masculino" : "Feminino"} · {truncarEmail(patient.email)}
                </p>
              </div>
            </div>

          </div>
        ) : null}
      </div>

      <Tabs defaultValue="cockpit" className="w-full">
        <TabsList className="tabs-longevidade w-full justify-start flex-wrap h-auto gap-1" data-testid="tabs-longevidade">
          <TabsTrigger value="cockpit" data-testid="tab-trigger-cockpit">
            <HeartPulse className="h-3.5 w-3.5 mr-1.5" />
            Cockpit
          </TabsTrigger>
          <TabsTrigger value="cardiometabolico" data-testid="tab-trigger-cardiometabolico">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Cardiometabólico
          </TabsTrigger>
          <TabsTrigger value="recuperacao" data-testid="tab-trigger-recuperacao">
            <Moon className="h-3.5 w-3.5 mr-1.5" />
            Recuperação & Sono
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-trigger-performance">
            <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="nutricao" data-testid="tab-trigger-nutricao" className="tab-bloqueada gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1" />
            Nutrição
            <Lock className="h-3 w-3 ml-0.5" />
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
            <AbaRecuperacaoSono pacienteId={patientId} />
          </TabsContent>
          <TabsContent value="performance">
            <AbaPerformanceFuncional pacienteId={patientId} />
          </TabsContent>
          <TabsContent value="nutricao">
            <AbaTrancada
              titulo="Nutrição"
              mensagem="Nutrição estará disponível em breve. Você terá acesso a correlações entre ingestão alimentar e biomarcadores: proteína relativa versus massa magra, carga glicêmica e variabilidade da glicose, e balanço calórico versus tendência de peso — dados que transformam nutrição em motor de saúde."
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
