import { useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UtensilsCrossed, Plus, X, Check, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HORARIOS_REFEICAO, DESCRICOES_REFEICAO_PADRAO } from "@shared/schema";
import type { AlimentoPlano } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ModalAdicionarAlimento } from "./modal-adicionar-alimento";

interface ModalNovaRefeicaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  planoId: string;
  planoDescricao: string;
  onSuccess?: () => void;
}

interface FormData {
  horario: string;
  descricao: string;
  alimentos: AlimentoPlano[];
  observacao: string;
}

const INITIAL_FORM: FormData = {
  horario: "07:00",
  descricao: "",
  alimentos: [],
  observacao: "",
};

function DescricaoCombobox({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = DESCRICOES_REFEICAO_PADRAO.filter((d) =>
    d.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          placeholder="Selecione ou digite"
          className={cn(
            "pr-8",
            hasError && "border-destructive"
          )}
          data-testid="input-descricao"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            inputRef.current?.focus();
          }}
          data-testid="toggle-descricao-dropdown"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {dropdownOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          <ul className="max-h-[200px] overflow-y-auto py-1">
            {filtered.map((desc) => (
              <li key={desc}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    value === desc && "bg-accent/50"
                  )}
                  onClick={() => {
                    setInputValue(desc);
                    onChange(desc);
                    setDropdownOpen(false);
                  }}
                  data-testid={`option-descricao-${desc.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      value === desc ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  {desc}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ModalNovaRefeicao({
  open,
  onOpenChange,
  pacienteId,
  planoId,
  planoDescricao,
  onSuccess,
}: ModalNovaRefeicaoProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<{ descricao?: string; alimentos?: string }>({});
  const [modalAlimentoAberta, setModalAlimentoAberta] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest(
        "POST",
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares/${planoId}/refeicoes`,
        {
          nome: data.descricao,
          horario: data.horario,
          alimentos: data.alimentos,
          observacao: data.observacao || undefined,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return (
            key[0] === "/api/profissional/dashboard/pacientes" &&
            key[1] === pacienteId &&
            (key[2] === "plano-alimentar" || key[2] === "planos-alimentares")
          );
        },
      });
      onSuccess?.();
    },
  });

  function validate(): boolean {
    const newErrors: { descricao?: string; alimentos?: string } = {};
    if (!form.descricao.trim()) {
      newErrors.descricao = "Informe o nome da refeição.";
    }
    if (form.alimentos.length === 0) {
      newErrors.alimentos = "Adicione ao menos um alimento à refeição.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave(keepOpen: boolean) {
    if (!validate()) return;
    try {
      await mutation.mutateAsync(form);
      if (keepOpen) {
        toast({
          title: "Refeição adicionada",
          description: "Refeição adicionada. Preencha a próxima.",
        });
        setForm(INITIAL_FORM);
        setErrors({});
      } else {
        toast({
          title: "Refeição adicionada com sucesso",
        });
        onOpenChange(false);
      }
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a refeição. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  function handleRemoveAlimento(id: string) {
    setForm((prev) => ({
      ...prev,
      alimentos: prev.alimentos.filter((a) => a.id !== id),
    }));
  }

  function handleAdicionarAlimento() {
    setModalAlimentoAberta(true);
  }

  function handleAlimentoAdicionado(alimento: AlimentoPlano) {
    setForm((prev) => ({
      ...prev,
      alimentos: [...prev.alimentos, alimento],
    }));
    setErrors((prev) => ({ ...prev, alimentos: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        data-testid="modal-nova-refeicao"
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl" data-testid="text-modal-titulo">
            Nova refeição
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {planoDescricao}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="horario" className="text-sm font-medium">
                Horário
              </Label>
              <Select
                value={form.horario}
                onValueChange={(v) => setForm((prev) => ({ ...prev, horario: v }))}
              >
                <SelectTrigger id="horario" data-testid="select-horario">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {HORARIOS_REFEICAO.map((h) => (
                    <SelectItem key={h} value={h} data-testid={`option-horario-${h}`}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Nome da refeição
              </Label>
              <DescricaoCombobox
                value={form.descricao}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, descricao: val }));
                  if (val.trim()) {
                    setErrors((prev) => ({ ...prev, descricao: undefined }));
                  }
                }}
                hasError={!!errors.descricao}
              />
              {errors.descricao && (
                <p className="text-xs text-destructive mt-1" data-testid="error-descricao">
                  {errors.descricao}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Selecione da lista ou digite um nome personalizado
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Alimentos selecionados
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdicionarAlimento}
                data-testid="button-adicionar-alimento"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar alimento
              </Button>
            </div>

            {form.alimentos.length === 0 ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground",
                  errors.alimentos && "border-destructive"
                )}
                data-testid="empty-alimentos"
              >
                <UtensilsCrossed className="h-8 w-8 mb-2 opacity-40" />
                <span className="text-sm">Adicione alimentos usando o botão acima</span>
                {errors.alimentos && (
                  <p className="text-xs text-destructive mt-2" data-testid="error-alimentos">
                    {errors.alimentos}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium">Alimento</th>
                      <th className="px-2 py-2 text-center font-medium w-14">Qtd.</th>
                      <th className="px-3 py-2 text-left font-medium">Unidade</th>
                      <th className="w-9"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {form.alimentos.map((alimento) => (
                      <tr
                        key={alimento.id}
                        data-testid={`item-alimento-modal-${alimento.id}`}
                      >
                        <td className="px-3 py-2 text-foreground">{alimento.nome}</td>
                        <td className="px-2 py-2 text-center tabular-nums">{alimento.quantidade}</td>
                        <td className="px-3 py-2 text-muted-foreground">{alimento.unidade}</td>
                        <td className="px-1 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveAlimento(alimento.id)}
                            data-testid={`button-remover-alimento-${alimento.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacao" className="text-sm font-medium">
              Observação
            </Label>
            <Textarea
              id="observacao"
              value={form.observacao}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, observacao: e.target.value }))
              }
              placeholder="Orientações ou observações sobre esta refeição"
              rows={3}
              data-testid="textarea-observacao"
            />
            <p className="text-xs text-muted-foreground">Visível para o cliente no aplicativo</p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            data-testid="button-cancelar-refeicao"
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={mutation.isPending}
              data-testid="button-salvar-e-continuar"
            >
              {mutation.isPending ? "Salvando..." : "Salvar e adicionar outra"}
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(false)}
              disabled={mutation.isPending}
              data-testid="button-salvar-refeicao"
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <ModalAdicionarAlimento
        open={modalAlimentoAberta}
        onOpenChange={setModalAlimentoAberta}
        refeicaoNome={form.descricao || "Nova refeição"}
        onAdicionarAlimento={handleAlimentoAdicionado}
      />
    </Dialog>
  );
}
