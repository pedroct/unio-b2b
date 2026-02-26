import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AbaPlanoAlimentar } from "@/components/dashboard/aba-plano-alimentar";
import type { Patient } from "@shared/schema";

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function PrescricaoAlimentarPage() {
  const [, params] = useRoute("/prescricao-alimentar/:pacienteId");
  const pacienteId = params?.pacienteId || "";

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/profissional/pacientes", pacienteId],
    enabled: !!pacienteId,
  });

  const initials = patient?.name
    ? patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-prescricao-alimentar">
      <div className="flex items-center gap-3">
        <Link href="/pacientes">
          <Button variant="ghost" size="icon" data-testid="button-back-prescricao">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {isLoading ? (
          <HeaderSkeleton />
        ) : patient ? (
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight" data-testid="text-prescricao-paciente">
                  Prescrição Alimentar
                </h1>
                <Badge variant="outline" className="text-xs">
                  {patient.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Gerencie as refeições e dias da semana do plano alimentar
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {pacienteId && <AbaPlanoAlimentar pacienteId={pacienteId} />}
    </div>
  );
}
