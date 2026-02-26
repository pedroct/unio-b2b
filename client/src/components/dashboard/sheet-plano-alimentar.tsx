import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed } from "lucide-react";
import type { PlanoAlimentar } from "@shared/schema";

interface SheetPlanoAlimentarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  pacienteNome?: string;
}

function SheetSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-5 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SheetPlanoAlimentar({
  open,
  onOpenChange,
  pacienteId,
  pacienteNome,
}: SheetPlanoAlimentarProps) {
  const { data: plano, isLoading } = useQuery<PlanoAlimentar>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar", "segunda"],
    queryFn: async () => {
      const res = await fetch(
        `/api/profissional/dashboard/pacientes/${pacienteId}/plano-alimentar?diaSemana=segunda`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao carregar plano alimentar");
      return res.json();
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-testid="sheet-plano-alimentar"
      >
        <SheetHeader className="pb-4">
          <SheetTitle data-testid="titulo-sheet-plano">Plano Alimentar</SheetTitle>
          <SheetDescription>
            Visualização do plano alimentar atual
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <SheetSkeleton />
        ) : !plano ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Sem plano alimentar</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum plano alimentar ativo para este paciente.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-6" data-testid="conteudo-plano-alimentar">
            <div className="text-center space-y-1 pb-2">
              {pacienteNome && (
                <p className="text-sm font-medium" data-testid="text-paciente-nome-plano">
                  {pacienteNome}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{plano.dataCriacao}</p>
            </div>

            <Separator />

            <p
              className="text-sm text-center italic text-muted-foreground"
              data-testid="text-descricao-plano"
            >
              {plano.descricao}
            </p>

            <div className="space-y-4">
              {plano.refeicoes.map((refeicao) => (
                <div
                  key={refeicao.id}
                  className="rounded-lg border overflow-hidden"
                  data-testid={`refeicao-view-${refeicao.id}`}
                >
                  <div className="bg-primary px-4 py-2">
                    <span className="text-sm font-semibold text-primary-foreground">
                      {refeicao.horario} - {refeicao.nome}
                    </span>
                  </div>

                  <div className="divide-y">
                    {refeicao.alimentos.map((alimento) => (
                      <div
                        key={alimento.id}
                        className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm"
                        data-testid={`alimento-view-${alimento.id}`}
                      >
                        <span className="text-foreground">
                          {alimento.nome} ({alimento.quantidade})
                        </span>
                        {alimento.grupo && (
                          <span className="text-xs text-muted-foreground text-right shrink-0 max-w-[180px]">
                            {alimento.grupo}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
