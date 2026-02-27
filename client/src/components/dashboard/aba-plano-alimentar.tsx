import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFoodName, formatNutrient, formatUnit, formatHorario } from "@/lib/formatters";
import { normalizarPlanoAlimentar, normalizarResumoPlano } from "@/lib/api-normalizers";
import { Input } from "@/components/ui/input";
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
  Check,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { EmptyState } from "@/components/empty-state";
import { ModalDiasSemana } from "@/components/dashboard/modal-dias-semana";
import { ModalNovaRefeicao } from "@/components/dashboard/modal-nova-refeicao";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PlanoAlimentar, ResumoPlanoAlimentar, DiaSemana } from "@shared/schema";
import { DIAS_SEMANA } from "@shared/schema";

interface AbaPlanoAlimentarProps {
  pacienteId: string;
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

export function AbaPlanoAlimentar({ pacienteId }: AbaPlanoAlimentarProps) {
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>("");
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("segunda");
  const [modalDiasAberto, setModalDiasAberto] = useState(false);
  const [modalNovaRefeicaoAberta, setModalNovaRefeicaoAberta] = useState(false);
  const [editandoDescricao, setEditandoDescricao] = useState(false);
  const [novaDescricao, setNovaDescricao] = useState("");
  const { toast } = useToast();

  const { data: planosLista, isLoading: isLoadingLista } = useQuery<ResumoPlanoAlimentar[]>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "planos-alimentares"],
    queryFn: async () => {
      const res = await fetch(
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao carregar planos");
      const raw = await res.json();
      return (raw as any[]).map(normalizarResumoPlano);
    },
  });

  const planoId = planoSelecionadoId || (planosLista && planosLista.length > 0 ? planosLista[0].id : "");

  const planoResumo = planosLista?.find((p) => p.id === planoId);

  useEffect(() => {
    if (planoResumo && planoResumo.diasAtivos.length > 0 && !planoResumo.diasAtivos.includes(diaSelecionado)) {
      setDiaSelecionado(planoResumo.diasAtivos[0]);
    }
  }, [planoId, planoResumo]);

  const { data: plano, isLoading: isLoadingPlano } = useQuery<PlanoAlimentar>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar", planoId, diaSelecionado],
    queryFn: async () => {
      const res = await fetch(
        `/api/profissional/dashboard/pacientes/${pacienteId}/plano-alimentar?planoId=${planoId}&diaSemana=${diaSelecionado}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao carregar plano alimentar");
      const raw = await res.json();
      return normalizarPlanoAlimentar(raw);
    },
    enabled: !!planoId,
  });

  const salvarDiasMutation = useMutation({
    mutationFn: async (diasAtivos: DiaSemana[]) => {
      const res = await apiRequest(
        "PUT",
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares/${planoId}/dias`,
        { diasAtivos }
      );
      return res.json();
    },
    onSuccess: (_data, diasAtivos) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "planos-alimentares"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar"],
      });
      setModalDiasAberto(false);
      if (diasAtivos.length > 0 && !diasAtivos.includes(diaSelecionado)) {
        setDiaSelecionado(diasAtivos[0]);
      }
      toast({
        title: "Dias atualizados",
        description: diasAtivos.length > 0
          ? `Plano alimentar ativo para ${diasAtivos.length} dia(s) da semana.`
          : "Plano alimentar inativado. Nenhum dia selecionado.",
      });
    },
  });

  const salvarDescricaoMutation = useMutation({
    mutationFn: async (descricao: string) => {
      const res = await apiRequest(
        "PUT",
        `/api/profissional/dashboard/pacientes/${pacienteId}/planos-alimentares/${planoId}/descricao`,
        { descricao }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "planos-alimentares"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar"],
      });
      setEditandoDescricao(false);
      toast({
        title: "Descrição atualizada",
        description: "A descrição do plano alimentar foi salva com sucesso.",
      });
    },
  });

  const isLoading = isLoadingLista || isLoadingPlano;

  if (isLoading) return <PlanoAlimentarSkeleton />;

  if (!planosLista || planosLista.length === 0) {
    return (
      <EmptyState
        icon={<UtensilsCrossed className="h-12 w-12" />}
        title="Sem plano alimentar"
        description="Nenhum plano alimentar cadastrado. Crie um plano para começar a acompanhar a nutrição."
        module="nutrition"
      />
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
    { name: "Proteína", value: plano.nutrientes.proteina.gramas, color: "#5B8C6F" },
    { name: "Carboidrato", value: plano.nutrientes.carboidrato.gramas, color: "#D9A441" },
    { name: "Gordura", value: plano.nutrientes.gordura.gramas, color: "#D97952" },
  ];

  function iniciarEdicaoDescricao() {
    setNovaDescricao(plano!.descricao);
    setEditandoDescricao(true);
  }

  function confirmarDescricao() {
    const desc = novaDescricao.trim();
    if (desc && desc !== plano!.descricao) {
      salvarDescricaoMutation.mutate(desc);
    } else {
      setEditandoDescricao(false);
    }
  }

  function cancelarEdicaoDescricao() {
    setEditandoDescricao(false);
    setNovaDescricao("");
  }

  return (
    <div className="space-y-6" data-testid="tab-plano-alimentar">
      <ModalDiasSemana
        open={modalDiasAberto}
        onOpenChange={setModalDiasAberto}
        diasAtivos={plano.diasAtivos}
        plano={plano}
        outrosPlanos={outrosPlanos}
        onSalvar={(dias) => salvarDiasMutation.mutate(dias)}
        isSaving={salvarDiasMutation.isPending}
      />

      {modalNovaRefeicaoAberta && (
        <ModalNovaRefeicao
          open={modalNovaRefeicaoAberta}
          onOpenChange={setModalNovaRefeicaoAberta}
          pacienteId={pacienteId}
          planoId={planoId}
          planoDescricao={plano.descricao}
        />
      )}

      {planosLista.length > 1 && (
        <div className="flex items-center gap-3" data-testid="seletor-plano">
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
            <SelectTrigger className="max-w-md" data-testid="select-plano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planosLista.map((p) => (
                <SelectItem key={p.id} value={p.id} data-testid={`option-plano-${p.id}`}>
                  {p.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-start gap-2" data-testid="campo-descricao-plano">
        {editandoDescricao ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              className="flex-1"
              placeholder="Descrição do plano alimentar"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarDescricao();
                if (e.key === "Escape") cancelarEdicaoDescricao();
              }}
              data-testid="input-descricao-plano"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={confirmarDescricao}
              disabled={salvarDescricaoMutation.isPending}
              data-testid="button-confirmar-descricao"
            >
              <Check className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelarEdicaoDescricao}
              data-testid="button-cancelar-descricao"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              data-testid="text-descricao-plano"
            >
              {plano.descricao}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={iniciarEdicaoDescricao}
              data-testid="button-editar-descricao"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalDiasAberto(true)}
            data-testid="button-editar-dias"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar dias da semana
          </Button>
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

      {diasVisiveis.length === 0 && (
        <Card data-testid="aviso-plano-inativo">
          <CardContent className="pt-6 text-center space-y-3">
            <UtensilsCrossed className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">Plano alimentar inativo</p>
            <p className="text-xs text-muted-foreground">
              Nenhum dia da semana está selecionado para este plano. Clique em
              "Editar dias da semana" para ativar o plano selecionando pelo menos um dia.
            </p>
          </CardContent>
        </Card>
      )}

      {diasVisiveis.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
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
          </div>

          {plano.refeicoes.map((refeicao) => (
            <Card key={refeicao.id} data-testid={`card-refeicao-${refeicao.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                      <UtensilsCrossed className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {refeicao.nome}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{refeicao.horario}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar refeição"
                      aria-label="Editar refeição"
                      data-testid={`button-editar-refeicao-${refeicao.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Duplicar refeição"
                      aria-label="Duplicar refeição"
                      data-testid={`button-duplicar-refeicao-${refeicao.id}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      title="Excluir refeição"
                      aria-label="Excluir refeição"
                      data-testid={`button-excluir-refeicao-${refeicao.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-0 px-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Alimento</th>
                      <th className="px-3 py-2 text-center font-medium w-16">Qtd.</th>
                      <th className="px-4 py-2 text-left font-medium">Unidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {refeicao.alimentos.map((alimento) => (
                      <tr
                        key={alimento.id}
                        data-testid={`item-alimento-${alimento.id}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-foreground">{formatFoodName(alimento.nome)}</td>
                        <td className="px-3 py-2.5 text-center text-foreground tabular-nums">{alimento.quantidade}</td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatUnit(alimento.unidade)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 pb-1">
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 mt-2"
                    data-testid={`button-substituir-${refeicao.id}`}
                  >
                    <ArrowRightLeft className="h-3 w-3 mr-1.5" />
                    Adicionar substituta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Resumo de nutrientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
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
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Flame className="h-4 w-4 text-primary mb-0.5" />
                    <span className="text-lg font-bold" data-testid="text-total-calorias">
                      {plano.nutrientes.calorias.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">kcal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {[
                  {
                    nome: "Proteína",
                    gramas: plano.nutrientes.proteina.gramas,
                    percentual: plano.nutrientes.proteina.percentual,
                    color: "#5B8C6F",
                    testId: "ptn",
                  },
                  {
                    nome: "Carboidrato",
                    gramas: plano.nutrientes.carboidrato.gramas,
                    percentual: plano.nutrientes.carboidrato.percentual,
                    color: "#D9A441",
                    testId: "cho",
                  },
                  {
                    nome: "Gordura",
                    gramas: plano.nutrientes.gordura.gramas,
                    percentual: plano.nutrientes.gordura.percentual,
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
                  {plano.nutrientes.fibra}g
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
      )}
    </div>
  );
}
