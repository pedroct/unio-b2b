import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, ChevronRight } from "lucide-react";
import type { Patient } from "@shared/schema";

function ListaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 py-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PrescricaoAlimentarListaPage() {
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/profissional/pacientes"],
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="page-prescricao-lista">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" data-testid="titulo-prescricao-lista">
              Prescrição alimentar
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecione um cliente para gerenciar o plano alimentar
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <ListaSkeleton />
      ) : (
        <div className="space-y-3">
          {patients
            ?.filter((p) => p.status === "active")
            .map((patient) => {
              const initials = patient.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Link
                  key={patient.id}
                  href={`/prescricao-alimentar/${patient.id}`}
                >
                  <Card
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                    data-testid={`card-prescricao-${patient.id}`}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.age} anos · {patient.gender === "M" ? "Masculino" : "Feminino"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        Aderência dieta: {patient.adherenceDiet}%
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
