import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatFoodName, formatNutrient, formatUnit, formatHorario } from "@/lib/formatters";
import { normalizarPlanoAlimentar, normalizarResumoPlano, calcularNutrientesPlano } from "@/lib/api-normalizers";
import { fetchWithAuth } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Plus,
  List,
  Pencil,
  Copy,
  Trash2,
  ArrowRightLeft,
  UtensilsCrossed,
  Flame,
  CheckCircle2,
  XCircle,
  CircleDashed,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { EmptyState } from "@/components/empty-state";
import { ModalNovaRefeicao } from "@/components/dashboard/modal-nova-refeicao";
import { ModalEditarRefeicao } from "@/components/dashboard/modal-editar-refeicao";
import { ModalNovoPlano } from "@/components/dashboard/modal-novo-plano";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PlanoAlimentar, ResumoPlanoAlimentar, DiaSemana, Refeicao, ProgressoRefeicao, ItemProgressoAlimento } from "@shared/schema";
import { DIAS_SEMANA } from "@shared/schema";

interface AbaPlanoAlimentarProps {
  pacienteId: string;
  initialPlanoId?: string;
}


const DIAS_ROTULOS: Record<DiaSemana, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

function PlanoAlimentarSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-40 rounded-full mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── RefeicaoCard — card de refeição com progresso de aderência do dia ───────

interface RefeicaoCardProps {
  refeicao: Refeicao;
  pacienteId: string;
  planoId: string;
  dataReferencia: string;
  onEditar: () => void;
  onExcluir: () => void;
}

function StatusIcon({ status }: { status: string | undefined }) {
  if (!status || status === "pendente") return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/50" />;
  if (status === "confirmado") return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
  if (status === "parcial") return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
  return <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />;
}

function RefeicaoCard({ refeicao, pacienteId, planoId, dataReferencia, onEditar, onExcluir }: RefeicaoCardProps) {
  const { toast } = useToast();

  const progressoQueryKey = [
    "/api/nutricao/planos-alimentares", pacienteId, planoId,
    "refeicoes", refeicao.id, "progresso", dataReferencia,
  ];

  const { data: progresso } = useQuery<ProgressoRefeicao>({
    queryKey: progressoQueryKey,
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}/refeicoes/${refeicao.id}/progresso?data=${dataReferencia}`
      );
      if (!res.ok) throw new Error("Erro ao buscar progresso");
      return res.json();
    },
    staleTime: 60_000,
  });

  const statusMap = new Map<string, ItemProgressoAlimento>();
  progresso?.alimentos.forEach((a) => statusMap.set(a.alimento_plano_id, a));

  const confirmarMutation = useMutation({
    mutationFn: async ({ alimentoPlanoId, status }: { alimentoPlanoId: string; status: string }) => {
      const res = await fetchWithAuth(
        `/api/nutricao/planos-alimentares/${pacienteId}/${planoId}/refeicoes/${refeicao.id}/alimentos/${alimentoPlanoId}/confirmar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data_referencia: dataReferencia, status }),
        }
      );
      if (!res.ok) throw new Error("Falha na confirmação");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressoQueryKey });
    },
    onError: () => {
      toast({ title: "Erro ao confirmar alimento", variant: "destructive" });
    },
  });

  const hasProgress = !!progresso;

  return (
    <Card data-testid={`card-refeicao-${refeicao.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{refeicao.nome}</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{refeicao.horario}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Editar refeição" aria-label="Editar refeição"
              onClick={onEditar} data-testid={`button-editar-refeicao-${refeicao.id}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" title="Duplicar refeição" aria-label="Duplicar refeição"
              data-testid={`button-duplicar-refeicao-${refeicao.id}`}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" title="Excluir refeição"
              aria-label="Excluir refeição" onClick={onExcluir} data-testid={`button-excluir-refeicao-${refeicao.id}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {hasProgress && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{progresso.confirmados}</span>
                /{progresso.total_alimentos} confirmados
              </span>
              <span className="font-semibold">{progresso.progresso_pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  progresso.progresso_pct === 100 ? "bg-green-500"
                    : progresso.progresso_pct > 50 ? "bg-primary"
                    : "bg-amber-400"
                )}
                style={{ width: `${progresso.progresso_pct}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="pt-0 px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Alimento</th>
              <th className="px-3 py-2 text-center font-medium w-16">Qtd.</th>
              <th className="px-4 py-2 text-left font-medium">Unidade</th>
              <th className="px-4 py-2 text-right font-medium w-20">Kcal</th>
              {hasProgress && <th className="px-3 py-2 text-center font-medium w-24">Hoje</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {refeicao.alimentos.map((alimento) => {
              const item = statusMap.get(alimento.id);
              const isPending = !item || item.status === "pendente";
              return (
                <tr key={alimento.id} data-testid={`item-alimento-${alimento.id}`} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-foreground">{formatFoodName(alimento.nome)}</td>
                  <td className="px-3 py-2.5 text-center text-foreground tabular-nums">{alimento.quantidade}</td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatUnit(alimento.unidade)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                    {alimento.calorias != null ? alimento.calorias : "—"}
                  </td>
                  {hasProgress && (
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {isPending ? (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              title="Confirmar consumo" aria-label="Confirmar alimento"
                              data-testid={`button-confirmar-${alimento.id}`}
                              disabled={confirmarMutation.isPending}
                              onClick={() => confirmarMutation.mutate({ alimentoPlanoId: alimento.id, status: "confirmado" })}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              title="Marcar como pulado" aria-label="Pular alimento"
                              data-testid={`button-pular-${alimento.id}`}
                              disabled={confirmarMutation.isPending}
                              onClick={() => confirmarMutation.mutate({ alimentoPlanoId: alimento.id, status: "pulado" })}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={item.status} />
                            {item.quantidade_consumida != null && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {item.quantidade_consumida}g
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {refeicao.alimentos.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/20">
                <td colSpan={3} className="px-4 py-2 text-xs font-medium text-muted-foreground text-right">
                  Total da refeição
                </td>
                <td className="px-4 py-2 text-right text-xs font-semibold tabular-nums text-foreground"
                  data-testid={`total-kcal-${refeicao.id}`}>
                  {refeicao.alimentos.every((a) => a.calorias == null)
                    ? "—"
                    : `${refeicao.alimentos.reduce((s, a) => s + (a.calorias ?? 0), 0)} kcal`}
                </td>
                {hasProgress && <td />}
              </tr>
            </tfoot>
          )}
        </table>
        <div className="px-4 pb-1">
          <Button variant="link" size="sm" className="px-0 mt-2"
            data-testid={`button-substituir-${refeicao.id}`}>
            <ArrowRightLeft className="h-3 w-3 mr-1.5" />
            Adicionar substituta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function AbaPlanoAlimentar({ pacienteId, initialPlanoId }: AbaPlanoAlimentarProps) {
  const { toast } = useToast();
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>(initialPlanoId ?? "");
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("segunda");
  const [dataReferencia, setDataReferencia] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [modalNovaRefeicaoAberta, setModalNovaRefeicaoAberta] = useState(false);
  const [modalNovoPlanoAberto, setModalNovoPlanoAberto] = useState(false);
  const [refeicaoEditando, setRefeicaoEditando] = useState<Refeicao | null>(null);
  const [refeicaoExcluindo, setRefeicaoExcluindo] = useState<Refeicao | null>(null);
  const { data: planosLista, isLoading: isLoadingLista } = useQuery<ResumoPlanoAlimentar[]>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "planos-alimentares"],
    enabled: !!pacienteId,
    select: (raw: any) => (Array.isArray(raw) ? raw : []).map(normalizarResumoPlano),
  });

  const planoId = planoSelecionadoId || (planosLista && planosLista.length > 0 ? planosLista[0].id : "");

  const planoResumo = planosLista?.find((p) => p.id === planoId);

  useEffect(() => {
    if (planoResumo && planoResumo.diasAtivos.length > 0 && !planoResumo.diasAtivos.includes(diaSelecionado)) {
      setDiaSelecionado(planoResumo.diasAtivos[0]);
    }
  }, [planoId, planoResumo]);

  const { data: plano, isLoading: isLoadingPlano, isFetching: isFetchingPlano } = useQuery<PlanoAlimentar>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar", planoId, diaSelecionado],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/profissional/dashboard/pacientes/${pacienteId}/plano-alimentar?planoId=${planoId}&diaSemana=${diaSelecionado}`
      );
      if (!res.ok) throw new Error("Erro ao carregar plano alimentar");
      const raw = await res.json();
      const planoNorm = normalizarPlanoAlimentar(raw);
      const { nutrientes, planoEnriquecido } = await calcularNutrientesPlano(planoNorm);
      return { ...planoEnriquecido, nutrientes };
    },
    enabled: !!planoId,
    staleTime: 0,
  });

  const isLoading = isLoadingLista || isLoadingPlano;

  if (isLoading) return <PlanoAlimentarSkeleton />;

  if (!planosLista || planosLista.length === 0) {
    return (
      <>
        <ModalNovoPlano
          open={modalNovoPlanoAberto}
          onOpenChange={setModalNovoPlanoAberto}
          pacienteId={pacienteId}
          diasOcupados={[]}
          onSuccess={(plano) => setPlanoSelecionadoId(plano.id)}
        />
        <EmptyState
          icon={<UtensilsCrossed className="h-12 w-12" />}
          title="Sem plano alimentar"
          description="Nenhum plano alimentar cadastrado. Crie um plano para começar a acompanhar a nutrição."
          module="nutrition"
          action={
            <Button onClick={() => setModalNovoPlanoAberto(true)} data-testid="button-criar-primeiro-plano">
              <Plus className="h-4 w-4 mr-2" />
              Criar plano alimentar
            </Button>
          }
        />
      </>
    );
  }

  if (!plano) {
    return <PlanoAlimentarSkeleton />;
  }

  const outrosPlanos = planosLista.filter((p) => p.id !== planoId);

  const diasVisiveis = DIAS_SEMANA.filter((dia) =>
    plano.diasAtivos.includes(dia.valor)
  );

  const pieData = [
    { name: "Proteína",    value: plano.nutrientes?.proteina?.gramas    ?? 0, color: "#5B8C6F" },
    { name: "Carboidrato", value: plano.nutrientes?.carboidrato?.gramas ?? 0, color: "#D9A441" },
    { name: "Gordura",     value: plano.nutrientes?.gordura?.gramas     ?? 0, color: "#D97952" },
  ];

  return (
    <div className="space-y-6" data-testid="tab-plano-alimentar">
      {modalNovaRefeicaoAberta && (
        <ModalNovaRefeicao
          open={modalNovaRefeicaoAberta}
          onOpenChange={setModalNovaRefeicaoAberta}
          pacienteId={pacienteId}
          planoId={planoId}
          planoDescricao={plano.descricao}
        />
      )}

      {refeicaoEditando && (
        <ModalEditarRefeicao
          open={!!refeicaoEditando}
          onOpenChange={(open) => { if (!open) setRefeicaoEditando(null); }}
          pacienteId={pacienteId}
          planoId={planoId}
          diaSelecionado={diaSelecionado}
          refeicao={refeicaoEditando}
          planoDescricao={plano.descricao}
        />
      )}

      <AlertDialog
        open={!!refeicaoExcluindo}
        onOpenChange={(open) => { if (!open) setRefeicaoExcluindo(null); }}
      >
        <AlertDialogContent data-testid="dialog-confirmar-exclusao">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir refeição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a refeição{" "}
              <strong>{refeicaoExcluindo?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-exclusao">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-exclusao"
              onClick={() => {
                if (!refeicaoExcluindo) return;
                const queryKey = [
                  "/api/profissional/dashboard/pacientes",
                  pacienteId,
                  "plano-alimentar",
                  planoId,
                  diaSelecionado,
                ];
                queryClient.setQueryData(queryKey, (old: PlanoAlimentar | undefined) => {
                  if (!old) return old;
                  return {
                    ...old,
                    refeicoes: old.refeicoes.filter((r) => r.id !== refeicaoExcluindo.id),
                  };
                });
                // Recalcula nutrientes após excluir refeição
                const planoAtualizado = queryClient.getQueryData<PlanoAlimentar>(queryKey);
                if (planoAtualizado) {
                  calcularNutrientesPlano(planoAtualizado).then(({ nutrientes, planoEnriquecido }) => {
                    queryClient.setQueryData(queryKey, (old: PlanoAlimentar | undefined) =>
                      old ? { ...planoEnriquecido, nutrientes } : old
                    );
                  });
                }
                toast({ title: "Refeição excluída com sucesso" });
                setRefeicaoExcluindo(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModalNovoPlano
        open={modalNovoPlanoAberto}
        onOpenChange={setModalNovoPlanoAberto}
        pacienteId={pacienteId}
        diasOcupados={planosLista.map((p) => p.diasAtivos)}
        onSuccess={(novo) => {
          setPlanoSelecionadoId(novo.id);
        }}
      />

      <div className="flex items-center gap-3 flex-wrap" data-testid="seletor-plano">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Plano:
        </span>
        <Select
          value={planoId}
          onValueChange={(val) => {
            setPlanoSelecionadoId(val);
            const novoPlano = planosLista.find((p) => p.id === val);
            if (novoPlano && novoPlano.diasAtivos.length > 0) {
              if (!novoPlano.diasAtivos.includes(diaSelecionado)) {
                setDiaSelecionado(novoPlano.diasAtivos[0]);
              }
            }
          }}
        >
          <SelectTrigger className="max-w-xs" data-testid="select-plano">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {planosLista.map((p) => (
              <SelectItem key={p.id} value={p.id} data-testid={`option-plano-${p.id}`}>
                {p.descricao}
                {p.status === "rascunho" && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(rascunho)</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalNovoPlanoAberto(true)}
          data-testid="button-novo-plano"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Novo plano
        </Button>
      </div>

      <div className="flex items-start gap-2" data-testid="campo-descricao-plano">
        <p
          className="text-sm font-medium truncate"
          data-testid="text-descricao-plano"
        >
          {plano.descricao}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {diasVisiveis.map((dia) => (
            <Button
              key={dia.valor}
              variant={diaSelecionado === dia.valor ? "default" : "secondary"}
              size="sm"
              className="rounded-full"
              onClick={() => setDiaSelecionado(dia.valor)}
              data-testid={`button-dia-${dia.valor}`}
            >
              {DIAS_ROTULOS[dia.valor]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={plano.status === "ativo" ? "default" : "secondary"}
            data-testid="badge-status-plano"
          >
            {plano.status === "ativo" ? "Ativo" : "Rascunho"}
          </Badge>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" data-testid="button-ver-refeicoes">
              <List className="h-3.5 w-3.5 mr-1.5" />
              Ver refeições
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalNovaRefeicaoAberta(true)}
              data-testid="button-adicionar-refeicao"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar refeição
            </Button>
            <div className="flex items-center gap-1.5 ml-auto">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <label htmlFor="data-referencia" className="text-xs text-muted-foreground whitespace-nowrap">
                Aderência em:
              </label>
              <input
                id="data-referencia"
                type="date"
                value={dataReferencia}
                onChange={(e) => setDataReferencia(e.target.value)}
                data-testid="input-data-referencia"
                className="text-xs border rounded px-2 py-1 bg-background text-foreground border-border focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {plano.refeicoes.map((refeicao) => (
            <RefeicaoCard
              key={refeicao.id}
              refeicao={refeicao}
              pacienteId={pacienteId}
              planoId={planoId}
              dataReferencia={dataReferencia}
              onEditar={() => setRefeicaoEditando(refeicao)}
              onExcluir={() => setRefeicaoExcluindo(refeicao)}
            />
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Resumo de nutrientes
                {isFetchingPlano && (
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <PieChart width={180} height={180}>
                    <Pie
                      data={pieData}
                      cx={90}
                      cy={90}
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}g`, ""]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Flame className="h-4 w-4 text-primary mb-0.5" />
                    <span className="text-lg font-bold" data-testid="text-total-calorias">
                      {(plano.nutrientes?.calorias ?? 0).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">kcal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {[
                  {
                    nome: "Proteína",
                    gramas: plano.nutrientes?.proteina?.gramas ?? 0,
                    percentual: plano.nutrientes?.proteina?.percentual ?? 0,
                    color: "#5B8C6F",
                    testId: "ptn",
                  },
                  {
                    nome: "Carboidrato",
                    gramas: plano.nutrientes?.carboidrato?.gramas ?? 0,
                    percentual: plano.nutrientes?.carboidrato?.percentual ?? 0,
                    color: "#D9A441",
                    testId: "cho",
                  },
                  {
                    nome: "Gordura",
                    gramas: plano.nutrientes?.gordura?.gramas ?? 0,
                    percentual: plano.nutrientes?.gordura?.percentual ?? 0,
                    color: "#D97952",
                    testId: "lip",
                  },
                ].map((macro) => (
                  <div
                    key={macro.nome}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                    data-testid={`card-macro-${macro.testId}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: macro.color }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {macro.nome}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{macro.gramas}g</span>
                      <span className="text-[11px] text-muted-foreground">
                        · {formatNutrient(macro.percentual)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 mt-3" data-testid="card-macro-fibra">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-muted-foreground/30" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Fibra
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {plano.nutrientes?.fibra ?? 0}g
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                data-testid="button-ver-nutrientes"
              >
                Ver todos os nutrientes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
