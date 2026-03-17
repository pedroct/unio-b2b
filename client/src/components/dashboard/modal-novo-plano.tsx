import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { normalizarResumoPlano } from "@/lib/api-normalizers";
import type { DiaSemana, ResumoPlanoAlimentar } from "@shared/schema";

const DIAS_CONFIG: { valor: DiaSemana; rotulo: string; abrev: string }[] = [
  { valor: "segunda", rotulo: "Segunda-feira", abrev: "Seg" },
  { valor: "terca",   rotulo: "Terça-feira",   abrev: "Ter" },
  { valor: "quarta",  rotulo: "Quarta-feira",   abrev: "Qua" },
  { valor: "quinta",  rotulo: "Quinta-feira",   abrev: "Qui" },
  { valor: "sexta",   rotulo: "Sexta-feira",    abrev: "Sex" },
  { valor: "sabado",  rotulo: "Sábado",         abrev: "Sáb" },
  { valor: "domingo", rotulo: "Domingo",         abrev: "Dom" },
];

const SUGESTOES = [
  "Dieta hiperproteica",
  "Dieta hipocalórica",
  "Dieta Low Carb",
  "Dieta cetogênica",
  "Dieta mediterrânea",
  "Dieta vegetariana",
  "Dieta para ganho de massa",
  "Dieta de manutenção",
  "Plano fim de semana",
  "Plano pré-competição",
];

interface ModalNovoPlanoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  diasOcupados: DiaSemana[][];
  onSuccess?: (plano: ResumoPlanoAlimentar) => void;
}

export function ModalNovoPlano({
  open,
  onOpenChange,
  pacienteId,
  diasOcupados,
  onSuccess,
}: ModalNovoPlanoProps) {
  const { toast } = useToast();
  const [descricao, setDescricao] = useState("");
  const [diasSelecionados, setDiasSelecionados] = useState<DiaSemana[]>([]);
  const [erroDescricao, setErroDescricao] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);

  useEffect(() => {
    if (open) {
      setDescricao("");
      setDiasSelecionados([]);
      setErroDescricao("");
      setDropdownAberto(false);
    }
  }, [open]);

  const diasJaUsados = new Set(diasOcupados.flat());

  function toggleDia(dia: DiaSemana) {
    setDiasSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares`,
        { descricao: descricao.trim(), diasAtivos: diasSelecionados }
      );
      const raw = await res.json();
      return normalizarResumoPlano(raw);
    },
    onSuccess: (plano) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "planos-alimentares"],
      });
      toast({
        title: "Plano criado com sucesso",
        description: `"${plano.descricao}" está pronto. Adicione refeições para começar.`,
      });
      onOpenChange(false);
      onSuccess?.(plano);
    },
    onError: () => {
      toast({
        title: "Erro ao criar plano",
        description: "Não foi possível criar o plano alimentar. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  function handleSalvar() {
    if (!descricao.trim()) {
      setErroDescricao("Informe um nome para o plano.");
      return;
    }
    setErroDescricao("");
    mutation.mutate();
  }

  const sugestoesFiltradas = SUGESTOES.filter((s) =>
    s.toLowerCase().includes(descricao.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" data-testid="modal-novo-plano">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl" data-testid="text-titulo-novo-plano">
            Novo plano alimentar
          </DialogTitle>
          <DialogDescription>
            Defina o nome e os dias da semana. Adicione refeições após criar o plano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome-plano" className="text-sm font-medium">
              Nome do plano <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="nome-plano"
                value={descricao}
                onChange={(e) => {
                  setDescricao(e.target.value);
                  if (e.target.value.trim()) setErroDescricao("");
                  setDropdownAberto(true);
                }}
                onFocus={() => setDropdownAberto(true)}
                onBlur={() => setTimeout(() => setDropdownAberto(false), 150)}
                placeholder="Ex.: Dieta hiperproteica"
                className={cn(erroDescricao && "border-destructive")}
                autoComplete="off"
                data-testid="input-nome-plano"
              />
              {dropdownAberto && sugestoesFiltradas.length > 0 && descricao.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <ul className="max-h-[180px] overflow-y-auto py-1">
                    {sugestoesFiltradas.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onMouseDown={() => {
                            setDescricao(s);
                            setDropdownAberto(false);
                            setErroDescricao("");
                          }}
                          data-testid={`sugestao-plano-${s.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {erroDescricao && (
              <p className="text-xs text-destructive" data-testid="error-nome-plano">
                {erroDescricao}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Dias da semana
            </Label>
            <p className="text-xs text-muted-foreground">
              Selecione os dias em que este plano será aplicado. Dias já em uso por outro plano aparecem desabilitados.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {DIAS_CONFIG.map(({ valor, rotulo, abrev }) => {
                const ocupado = diasJaUsados.has(valor) && !diasSelecionados.includes(valor);
                const selecionado = diasSelecionados.includes(valor);
                return (
                  <button
                    key={valor}
                    type="button"
                    disabled={ocupado}
                    onClick={() => toggleDia(valor)}
                    title={ocupado ? `${rotulo} já está em outro plano` : rotulo}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      selecionado
                        ? "bg-primary text-primary-foreground border-primary"
                        : ocupado
                          ? "opacity-30 cursor-not-allowed bg-muted text-muted-foreground border-border"
                          : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    )}
                    data-testid={`button-dia-novo-plano-${valor}`}
                  >
                    {abrev}
                  </button>
                );
              })}
            </div>
            {diasSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {diasSelecionados.map((dia) => {
                  const config = DIAS_CONFIG.find((d) => d.valor === dia)!;
                  return (
                    <Badge key={dia} variant="secondary" className="text-xs" data-testid={`badge-dia-selecionado-${dia}`}>
                      {config.rotulo}
                    </Badge>
                  );
                })}
              </div>
            )}
            {diasSelecionados.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhum dia selecionado — o plano será criado como rascunho.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            data-testid="button-cancelar-novo-plano"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={mutation.isPending}
            data-testid="button-salvar-novo-plano"
          >
            {mutation.isPending ? "Criando..." : "Criar plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
