import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Flame } from "lucide-react";
import type { PlanoAlimentar, ResumoPlanoAlimentar, DiaSemana } from "@shared/schema";

interface SheetPlanoAlimentarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  pacienteNome?: string;
}

const DIAS_CURTOS: Record<DiaSemana, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
  domingo: "Dom",
};

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

function PlanoContent({
  plano,
  pacienteNome,
}: {
  plano: PlanoAlimentar;
  pacienteNome?: string;
}) {
  return (
    <div className="space-y-6 pb-6" data-testid={`conteudo-plano-${plano.id}`}>
      <div className="text-center space-y-1 pb-2">
        {pacienteNome && (
          <p className="text-sm font-medium" data-testid="text-paciente-nome-plano">
            {pacienteNome}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{plano.dataCriacao}</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <p
          className="text-sm text-center font-medium"
          data-testid={`text-descricao-plano-${plano.id}`}
        >
          {plano.descricao}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className="text-xs">
            {plano.diasAtivos.map((d) => DIAS_CURTOS[d]).join(", ")}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="h-3 w-3" />
            <span>{plano.nutrientes.calorias.toLocaleString("pt-BR")} kcal</span>
          </div>
        </div>
      </div>

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

            <table className="w-full text-sm">
              <tbody className="divide-y">
                {refeicao.alimentos.map((alimento) => (
                  <tr
                    key={alimento.id}
                    data-testid={`alimento-view-${alimento.id}`}
                  >
                    <td className="px-4 py-2.5 text-foreground">
                      {alimento.nome}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground whitespace-nowrap">
                      {alimento.quantidade}
                    </td>
                    {alimento.grupo && (
                      <td className="px-4 py-2.5 text-xs text-muted-foreground text-right whitespace-nowrap">
                        {alimento.grupo}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SheetPlanoAlimentar({
  open,
  onOpenChange,
  pacienteId,
  pacienteNome,
}: SheetPlanoAlimentarProps) {
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>("");

  const { data: planosLista, isLoading: isLoadingLista } = useQuery<ResumoPlanoAlimentar[]>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "planos-alimentares"],
    queryFn: async () => {
      const res = await fetch(
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao carregar planos");
      return res.json();
    },
    enabled: open,
  });

  const planosAtivos = (planosLista || []).filter(
    (p) => p.status === "ativo" && p.diasAtivos.length > 0
  );

  const planoIdAtual = planoSelecionadoId || planosAtivos[0]?.id || "";
  const planoResumoAtual = planosAtivos.find((p) => p.id === planoIdAtual);
  const diaSemanaParaQuery = planoResumoAtual?.diasAtivos[0] || "segunda";

  const { data: plano, isLoading: isLoadingPlano } = useQuery<PlanoAlimentar>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar", planoIdAtual, diaSemanaParaQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/profissional/dashboard/pacientes/${pacienteId}/plano-alimentar?planoId=${planoIdAtual}&diaSemana=${diaSemanaParaQuery}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao carregar plano");
      return res.json();
    },
    enabled: open && !!planoIdAtual,
  });

  const isLoading = isLoadingLista || isLoadingPlano;

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
            Visualização dos planos alimentares ativos
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <SheetSkeleton />
        ) : planosAtivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Sem plano alimentar</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum plano alimentar ativo para este paciente.
            </p>
          </div>
        ) : (
          <>
            {planosAtivos.length > 1 && (
              <div className="mb-6" data-testid="seletor-plano-sheet">
                <Select
                  value={planoIdAtual}
                  onValueChange={setPlanoSelecionadoId}
                >
                  <SelectTrigger className="w-full" data-testid="select-plano-sheet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planosAtivos.map((p) => (
                      <SelectItem key={p.id} value={p.id} data-testid={`option-plano-sheet-${p.id}`}>
                        {p.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {plano && <PlanoContent plano={plano} pacienteNome={pacienteNome} />}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
