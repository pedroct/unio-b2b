import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed, Flame } from "lucide-react";
import type { DiaSemana, PlanoAlimentar } from "@shared/schema";
import { DIAS_SEMANA } from "@shared/schema";

interface ModalDiasSemanaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diasAtivos: DiaSemana[];
  plano: PlanoAlimentar;
  onSalvar: (dias: DiaSemana[]) => void;
  isSaving?: boolean;
}

const TODOS_OS_DIAS: DiaSemana[] = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const DIAS_DE_SEMANA: DiaSemana[] = ["segunda", "terca", "quarta", "quinta", "sexta"];
const FIM_DE_SEMANA: DiaSemana[] = ["sabado", "domingo"];

function getResumoDias(dias: DiaSemana[]): string {
  if (dias.length === 0) return "Nenhum dia";
  if (dias.length === 7) return "Todos os dias";
  const temSegASex = DIAS_DE_SEMANA.every((d) => dias.includes(d));
  const temFds = FIM_DE_SEMANA.every((d) => dias.includes(d));
  if (temSegASex && !temFds) return "Dias de semana";
  if (temFds && !temSegASex && dias.length === 2) return "Fim de semana";
  return dias
    .map((d) => DIAS_SEMANA.find((ds) => ds.valor === d)?.rotulo)
    .filter(Boolean)
    .join(", ");
}

export function ModalDiasSemana({
  open,
  onOpenChange,
  diasAtivos,
  plano,
  onSalvar,
  isSaving,
}: ModalDiasSemanaProps) {
  const [selecionados, setSelecionados] = useState<DiaSemana[]>(diasAtivos);

  useEffect(() => {
    if (open) {
      setSelecionados(diasAtivos);
    }
  }, [open, diasAtivos]);

  function toggleDia(dia: DiaSemana) {
    setSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  function aplicarAtalho(tipo: "todos" | "semana" | "fds" | "nenhum") {
    switch (tipo) {
      case "todos":
        setSelecionados([...TODOS_OS_DIAS]);
        break;
      case "semana":
        setSelecionados([...DIAS_DE_SEMANA]);
        break;
      case "fds":
        setSelecionados([...FIM_DE_SEMANA]);
        break;
      case "nenhum":
        setSelecionados([]);
        break;
    }
  }

  const isAtalhoAtivo = (tipo: "todos" | "semana" | "fds" | "nenhum") => {
    switch (tipo) {
      case "todos":
        return selecionados.length === 7;
      case "semana":
        return selecionados.length === 5 && DIAS_DE_SEMANA.every((d) => selecionados.includes(d));
      case "fds":
        return selecionados.length === 2 && FIM_DE_SEMANA.every((d) => selecionados.includes(d));
      case "nenhum":
        return selecionados.length === 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" data-testid="modal-dias-semana">
        <DialogHeader>
          <DialogTitle data-testid="titulo-modal-dias">Dias da semana</DialogTitle>
          <DialogDescription className="sr-only">
            Selecione os dias da semana para este plano alimentar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Selecione os dias da semana para este plano alimentar
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { tipo: "todos", rotulo: "Todos os dias" },
                  { tipo: "semana", rotulo: "Dias de semana" },
                  { tipo: "fds", rotulo: "Fim de semana" },
                  { tipo: "nenhum", rotulo: "Nenhum" },
                ] as const
              ).map(({ tipo, rotulo }) => (
                <Button
                  key={tipo}
                  variant={isAtalhoAtivo(tipo) ? "default" : "outline"}
                  size="sm"
                  onClick={() => aplicarAtalho(tipo)}
                  data-testid={`button-atalho-${tipo}`}
                >
                  {rotulo}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap" data-testid="grid-dias-semana">
            {DIAS_SEMANA.map((dia) => {
              const ativo = selecionados.includes(dia.valor);
              return (
                <Button
                  key={dia.valor}
                  variant={ativo ? "default" : "outline"}
                  size="sm"
                  className="rounded-full min-w-[110px]"
                  onClick={() => toggleDia(dia.valor)}
                  data-testid={`button-toggle-${dia.valor}`}
                >
                  {dia.rotulo}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">Legenda:</span>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span>Plano alimentar atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full border border-muted-foreground" />
              <span>Outros planos alimentares</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
              <span>Sem planos alimentares</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Plano alimentar atual</span>
              <Badge variant="default" data-testid="badge-plano-atual-status">
                {plano.status === "ativo" ? "Ativo" : "Rascunho"}
              </Badge>
            </div>

            <div
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
              data-testid="card-plano-atual"
            >
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-3 flex-wrap flex-1 text-sm">
                <Badge variant="outline" className="text-xs">
                  {getResumoDias(selecionados)}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Flame className="h-3 w-3" />
                  <span>{plano.nutrientes.calorias.toLocaleString("pt-BR")} kcal</span>
                </div>
                <span className="text-muted-foreground">{plano.descricao}</span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {plano.dataCriacao}
              </span>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2" data-testid="legenda-explicativa">
            <p className="text-sm font-medium">Legenda:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Badge variant="default" className="text-xs" data-testid="badge-legenda-ativo">
                  Ativo
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Estará disponível para o paciente via aplicativo, e-mail e impressão. Ative
                  marcando pelo menos um dia da semana.
                </p>
              </div>
              <div className="space-y-1">
                <Badge variant="destructive" className="text-xs" data-testid="badge-legenda-inativo">
                  Inativo
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Para o paciente não ver o plano inacabado enquanto você elabora, inative
                  desmarcando todos os dias da semana.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Outros planos alimentares ativos
            </p>
            <div className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground italic">
                Nenhum outro plano alimentar ativo no momento.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancelar-dias"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setSelecionados([]);
              onSalvar([]);
            }}
            disabled={isSaving}
            data-testid="button-inativar-plano"
          >
            Inativar
          </Button>
          <Button
            onClick={() => onSalvar(selecionados)}
            disabled={isSaving}
            data-testid="button-salvar-dias"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
