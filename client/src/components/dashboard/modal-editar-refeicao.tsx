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
import { UtensilsCrossed, Plus, X, Check, ChevronDown, Lock, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HORARIOS_REFEICAO, DESCRICOES_REFEICAO_PADRAO } from "@shared/schema";
import type { AlimentoPlano, Refeicao, PlanoAlimentar } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ModalAdicionarAlimento } from "./modal-adicionar-alimento";

interface ModalEditarRefeicaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  planoId: string;
  diaSelecionado: string;
  refeicao: Refeicao;
  planoDescricao: string;
  onSuccess?: () => void;
}

interface FormData {
  horario: string;
  descricao: string;
  alimentos: AlimentoPlano[];
  observacao: string;
}

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
          className={cn("pr-8", hasError && "border-destructive")}
          data-testid="input-editar-descricao"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            inputRef.current?.focus();
          }}
          data-testid="toggle-editar-descricao-dropdown"
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
                  data-testid={`option-editar-descricao-${desc.toLowerCase().replace(/\s+/g, "-")}`}
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

export function ModalEditarRefeicao({
  open,
  onOpenChange,
  pacienteId,
  planoId,
  diaSelecionado,
  refeicao,
  planoDescricao,
  onSuccess,
}: ModalEditarRefeicaoProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>({
    horario: refeicao.horario,
    descricao: refeicao.nome,
    alimentos: refeicao.alimentos,
    observacao: refeicao.observacao ?? "",
  });
  const [errors, setErrors] = useState<{ horario?: string; descricao?: string; alimentos?: string }>({});
  const [modalAlimentoAberta, setModalAlimentoAberta] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const plan = queryClient.getQueryData<PlanoAlimentar>([
        "/api/profissional/dashboard/pacientes",
        pacienteId,
        "plano-alimentar",
        planoId,
        diaSelecionado,
      ]);

      const updatedRefeicao: Refeicao = {
        ...refeicao,
        nome: data.descricao,
        horario: data.horario,
        alimentos: data.alimentos,
        observacao: data.observacao,
      };

      const toStagingAlimento = (a: AlimentoPlano) => ({
        id: a.id,
        alimento_id: a.alimentoTbcaId ?? a.id,
        alimento_nome: a.nome,
        quantidade: String(a.quantidade),
        unidade: a.unidade,
      });

      const toStagingRefeicao = (r: Refeicao) => ({
        id: r.id,
        nome: r.nome,
        horario: r.horario.length === 5 ? `${r.horario}:00` : r.horario,
        observacao: r.observacao ?? "",
        alimentos: r.alimentos.map(toStagingAlimento),
      });

      const allRefeicoes = (plan?.refeicoes ?? [refeicao]).map((r) =>
        r.id === refeicao.id ? updatedRefeicao : r,
      );

      const body: Record<string, unknown> = {
        id: planoId,
        cliente_id: parseInt(pacienteId),
        descricao: plan?.descricao ?? "",
        status: plan?.status ?? "ativo",
        refeicoes: allRefeicoes.map(toStagingRefeicao),
      };
      if (plan?.profissionalId != null) {
        body.profissional_id = plan.profissionalId;
      }

      await apiRequest(
        "PUT",
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares/${planoId}`,
        body,
      );
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
      toast({ title: "Refeição atualizada com sucesso" });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const prevOpenRef = useRef(false);
  const originalAlimentoIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setForm({
        horario: refeicao.horario,
        descricao: refeicao.nome,
        alimentos: refeicao.alimentos,
        observacao: refeicao.observacao ?? "",
      });
      originalAlimentoIdsRef.current = new Set(refeicao.alimentos.map((a) => a.id));
      setErrors({});
    }
    prevOpenRef.current = open;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const formCompleto = form.horario !== "" && form.descricao.trim() !== "" && form.alimentos.length > 0;

  function validate(): boolean {
    const newErrors: { horario?: string; descricao?: string; alimentos?: string } = {};
    if (!form.horario) newErrors.horario = "Selecione um horário.";
    if (!form.descricao.trim()) newErrors.descricao = "Informe o nome da refeição.";
    if (form.alimentos.length === 0) newErrors.alimentos = "Adicione ao menos um alimento à refeição.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    await mutation.mutateAsync(form);
  }

  function handleRemoveAlimento(id: string) {
    setForm((prev) => ({ ...prev, alimentos: prev.alimentos.filter((a) => a.id !== id) }));
  }

  function handleUpdateQuantidade(id: string, quantidade: number) {
    if (isNaN(quantidade) || quantidade <= 0) return;
    setForm((prev) => ({
      ...prev,
      alimentos: prev.alimentos.map((a) =>
        a.id === id ? { ...a, quantidade } : a
      ),
    }));
  }

  function handleAlimentoAdicionado(alimento: AlimentoPlano) {
    setForm((prev) => ({ ...prev, alimentos: [...prev.alimentos, alimento] }));
    setErrors((prev) => ({ ...prev, alimentos: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        data-testid="modal-editar-refeicao"
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl" data-testid="text-modal-editar-titulo">
            Editar refeição
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {planoDescricao}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editar-horario" className="text-sm font-medium">
                Horário
              </Label>
              <Select
                value={form.horario || undefined}
                onValueChange={(v) => {
                  setForm((prev) => ({ ...prev, horario: v }));
                  if (v) setErrors((prev) => ({ ...prev, horario: undefined }));
                }}
              >
                <SelectTrigger
                  id="editar-horario"
                  className={cn(errors.horario && "border-destructive")}
                  data-testid="select-editar-horario"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {HORARIOS_REFEICAO.map((h) => (
                    <SelectItem key={h} value={h} data-testid={`option-editar-horario-${h}`}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.horario && (
                <p className="text-xs text-destructive mt-1" data-testid="error-editar-horario">
                  {errors.horario}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nome da refeição</Label>
              <DescricaoCombobox
                value={form.descricao}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, descricao: val }));
                  if (val.trim()) setErrors((prev) => ({ ...prev, descricao: undefined }));
                }}
                hasError={!!errors.descricao}
              />
              {errors.descricao && (
                <p className="text-xs text-destructive mt-1" data-testid="error-editar-descricao">
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
              <Label className="text-sm font-medium">Alimentos selecionados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalAlimentoAberta(true)}
                data-testid="button-editar-adicionar-alimento"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar alimento
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>Edição de quantidade indisponível.</strong> O backend não possui endpoint para atualizar quantidades de alimentos existentes. Um contrato foi gerado para a equipe de backend. Você pode adicionar ou remover alimentos normalmente.
              </span>
            </div>

            {form.alimentos.length === 0 ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground",
                  errors.alimentos && "border-destructive"
                )}
                data-testid="empty-editar-alimentos"
              >
                <UtensilsCrossed className="h-8 w-8 mb-2 opacity-40" />
                <span className="text-sm">Adicione alimentos usando o botão acima</span>
                {errors.alimentos && (
                  <p className="text-xs text-destructive mt-2" data-testid="error-editar-alimentos">
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
                    {form.alimentos.map((alimento) => {
                      const isExisting = originalAlimentoIdsRef.current.has(alimento.id);
                      return (
                      <tr key={alimento.id} data-testid={`item-editar-alimento-${alimento.id}`}>
                        <td className="px-3 py-2 text-foreground">{alimento.nome}</td>
                        <td className="px-1 py-1 text-center">
                          {isExisting ? (
                            <div
                              className="inline-flex items-center gap-0.5 w-16 justify-center tabular-nums rounded border border-input bg-muted/40 px-1.5 py-1 text-sm text-muted-foreground cursor-not-allowed"
                              title="Edição de quantidade indisponível — aguardando endpoint do backend"
                              data-testid={`input-quantidade-${alimento.id}`}
                            >
                              {alimento.quantidade}
                              <Lock className="h-2.5 w-2.5 opacity-50 shrink-0" />
                            </div>
                          ) : (
                            <input
                              type="number"
                              min={0.1}
                              step={0.1}
                              value={alimento.quantidade}
                              onChange={(e) =>
                                handleUpdateQuantidade(alimento.id, parseFloat(e.target.value))
                              }
                              className="w-16 text-center tabular-nums rounded border border-input bg-background px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                              data-testid={`input-quantidade-${alimento.id}`}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{alimento.unidade}</td>
                        <td className="px-1 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveAlimento(alimento.id)}
                            data-testid={`button-editar-remover-alimento-${alimento.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editar-observacao" className="text-sm font-medium">
              Observação
            </Label>
            <Textarea
              id="editar-observacao"
              value={form.observacao}
              onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
              placeholder="Orientações ou observações sobre esta refeição"
              rows={3}
              data-testid="textarea-editar-observacao"
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
            data-testid="button-cancelar-editar-refeicao"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!formCompleto || mutation.isPending}
            data-testid="button-salvar-editar-refeicao"
          >
            {mutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ModalAdicionarAlimento
        open={modalAlimentoAberta}
        onOpenChange={setModalAlimentoAberta}
        refeicaoNome={form.descricao || "Refeição"}
        onAdicionarAlimento={handleAlimentoAdicionado}
      />
    </Dialog>
  );
}
