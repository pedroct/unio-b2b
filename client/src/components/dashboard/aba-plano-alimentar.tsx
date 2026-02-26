import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PlanoAlimentar, DiaSemana } from "@shared/schema";
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
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSemana>("segunda");
  const [modalDiasAberto, setModalDiasAberto] = useState(false);
  const { toast } = useToast();

  const { data: plano, isLoading } = useQuery<PlanoAlimentar>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "plano-alimentar", diaSelecionado],
    queryFn: async () => {
      const res = await fetch(`/api/profissional/dashboard/pacientes/${pacienteId}/plano-alimentar?diaSemana=${diaSelecionado}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar plano alimentar");
      return res.json();
    },
  });

  const salvarDiasMutation = useMutation({
    mutationFn: async (diasAtivos: DiaSemana[]) => {
      const res = await apiRequest("PUT", `/api/profissional/dashboard/pacientes/${pacienteId}/plano-alimentar/dias`, { diasAtivos });
      return res.json();
    },
    onSuccess: (_data, diasAtivos) => {
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

  if (isLoading) return <PlanoAlimentarSkeleton />;

  if (!plano) {
    return (
      <EmptyState
        icon={<UtensilsCrossed className="h-12 w-12" />}
        title="Sem plano alimentar"
        description="Nenhum plano alimentar foi cadastrado para este paciente. Crie um plano para começar a acompanhar a nutrição."
        module="nutrition"
      />
    );
  }

  const diasVisiveis = DIAS_SEMANA.filter((dia) =>
    plano.diasAtivos.includes(dia.valor)
  );

  const pieData = [
    { name: "PTN", value: plano.nutrientes.proteina.gramas, color: "#5B8C6F" },
    { name: "CHO", value: plano.nutrientes.carboidrato.gramas, color: "#D9A441" },
    { name: "LIP", value: plano.nutrientes.gordura.gramas, color: "#D97952" },
  ];

  return (
    <div className="space-y-6" data-testid="tab-plano-alimentar">
      <ModalDiasSemana
        open={modalDiasAberto}
        onOpenChange={setModalDiasAberto}
        diasAtivos={plano.diasAtivos}
        plano={plano}
        onSalvar={(dias) => salvarDiasMutation.mutate(dias)}
        isSaving={salvarDiasMutation.isPending}
      />

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
              Ver minhas refeições
            </Button>
            <Button variant="outline" size="sm" data-testid="button-adicionar-refeicao">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar nova refeição
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
                      data-testid={`button-editar-refeicao-${refeicao.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-duplicar-refeicao-${refeicao.id}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      data-testid={`button-excluir-refeicao-${refeicao.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-3">
                <ul className="space-y-1.5">
                  {refeicao.alimentos.map((alimento) => (
                    <li
                      key={alimento.id}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`item-alimento-${alimento.id}`}
                    >
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>
                        <span className="text-foreground">{alimento.nome}</span>
                        <span className="text-muted-foreground ml-1">
                          — {alimento.quantidade}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 mt-3"
                  data-testid={`button-substituir-${refeicao.id}`}
                >
                  <ArrowRightLeft className="h-3 w-3 mr-1.5" />
                  Adicionar Substituta
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Resumo de Nutrientes
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
                    sigla: "PTN",
                    label: "Proteínas",
                    gramas: plano.nutrientes.proteina.gramas,
                    percentual: plano.nutrientes.proteina.percentual,
                    color: "#5B8C6F",
                  },
                  {
                    sigla: "CHO",
                    label: "Carboidratos",
                    gramas: plano.nutrientes.carboidrato.gramas,
                    percentual: plano.nutrientes.carboidrato.percentual,
                    color: "#D9A441",
                  },
                  {
                    sigla: "LIP",
                    label: "Gorduras",
                    gramas: plano.nutrientes.gordura.gramas,
                    percentual: plano.nutrientes.gordura.percentual,
                    color: "#D97952",
                  },
                ].map((macro) => (
                  <div
                    key={macro.sigla}
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                    data-testid={`card-macro-${macro.sigla.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: macro.color }}
                      />
                      <div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {macro.sigla}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          {macro.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{macro.gramas}g</span>
                      <p className="text-[11px] text-muted-foreground">
                        {macro.percentual}%
                      </p>
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
