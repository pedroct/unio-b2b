import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Settings2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import { NutritionTab } from "@/components/dashboard/nutrition-tab";
import { BiometryTab } from "@/components/dashboard/biometry-tab";
import { TrainingTab } from "@/components/dashboard/training-tab";
import { AbaPlanoAlimentar } from "@/components/dashboard/aba-plano-alimentar";
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
      <div className="flex items-center gap-3">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {isLoading ? (
          <PatientHeaderSkeleton />
        ) : patient ? (
          <div className="flex items-center justify-between flex-1 gap-4">
            <div className="flex items-center gap-4">
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start" data-testid="tabs-dashboard">
          <TabsTrigger value="overview" data-testid="tab-trigger-overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="nutrition" data-testid="tab-trigger-nutrition">
            Nutrição
          </TabsTrigger>
          <TabsTrigger value="biometry" data-testid="tab-trigger-biometry">
            Biometria
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-trigger-training">
            Treinamento
          </TabsTrigger>
          <TabsTrigger value="plano-alimentar" data-testid="tab-trigger-plano-alimentar">
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
            Plano Alimentar
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <OverviewTab patientId={patientId} />
          </TabsContent>
          <TabsContent value="nutrition">
            <NutritionTab patientId={patientId} />
          </TabsContent>
          <TabsContent value="biometry">
            <BiometryTab patientId={patientId} />
          </TabsContent>
          <TabsContent value="training">
            <TrainingTab patientId={patientId} />
          </TabsContent>
          <TabsContent value="plano-alimentar">
            <AbaPlanoAlimentar pacienteId={patientId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
