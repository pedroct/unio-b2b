import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, Moon, Dumbbell, Lock, Bell, Check } from "lucide-react";
import { CardScore } from "./card-score";
import { GradeGenerica } from "./card-biomarcador";
import type { BiomarcadorItem } from "./card-biomarcador";
import { GraficoTendenciaScore } from "./grafico-tendencia-score";
import { EstadoDiaZero } from "./estado-dia-zero";
import type { RespostaCockpit, RespostaCardiometabolico, ScorePilar, ComponentesCockpit } from "@shared/schema";
import { CLASSIFICACAO_FROM_LABEL, TENDENCIA_FROM_API } from "@shared/schema";
import type { TendenciaBiomarcador } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AbaCockpitProps {
  pacienteId: string;
}

const ICONES_PILAR: Record<string, typeof Activity> = {
  metabolic: Activity,
  recovery: Moon,
  functional: Dumbbell,
};

const LABELS_PILAR: Record<string, string> = {
  cardiovascular: "Score Cardiovascular",
  metabolic: "Score Metabólico",
  recovery: "Score Recuperação",
  functional: "Score Funcional",
};

const TIPO_TO_COMPONENTE: Record<string, string> = {
  metabolic: "score_metabolico",
  recovery: "score_recuperacao",
  functional: "score_funcional",
};

const ORDEM_PILARES = ["cardiovascular", "metabolic", "recovery", "functional"];

interface ComponenteConfig {
  key: string;
  nome: string;
  defaultUnit: string;
  invertedSemantics?: boolean;
  defaultReferencia?: string;
}

const COMPONENTES_POR_PILAR: Record<string, ComponenteConfig[]> = {
  cardiovascular: [
    { key: "hrv", nome: "HRV (RMSSD)", defaultUnit: "ms" },
    { key: "fcr", nome: "FC de Repouso", defaultUnit: "bpm", invertedSemantics: true },
    { key: "vo2", nome: "VO₂ Máximo", defaultUnit: "mL/kg/min" },
    { key: "recuperacao", nome: "Recuperação da FC", defaultUnit: "bpm", defaultReferencia: "Média das últimas 5 sessões" },
  ],
  metabolic: [
    { key: "gordura", nome: "% Gordura Corporal", defaultUnit: "%" },
    { key: "cintura", nome: "Cintura", defaultUnit: "cm" },
    { key: "massa_magra", nome: "Massa Magra", defaultUnit: "kg" },
    { key: "tendencia_peso", nome: "Tendência Peso", defaultUnit: "kg", invertedSemantics: true },
  ],
  recovery: [
    { key: "sono_total", nome: "Sono Total", defaultUnit: "min" },
    { key: "sono_rem_profundo", nome: "REM + Profundo", defaultUnit: "min" },
    { key: "hrv_noturna", nome: "HRV Noturna", defaultUnit: "ms" },
    { key: "fc_noturna", nome: "FC Noturna", defaultUnit: "bpm", invertedSemantics: true },
  ],
  functional: [
    { key: "velocidade_caminhada", nome: "Velocidade de Caminhada", defaultUnit: "m/s", defaultReferencia: "Média 30d" },
    { key: "forca", nome: "Força", defaultUnit: "nível", defaultReferencia: "Avaliação funcional" },
    { key: "volume_treino", nome: "Volume de Treino", defaultUnit: "min/semana", defaultReferencia: "Soma 7d" },
    { key: "estabilidade", nome: "Estabilidade", defaultUnit: "%", defaultReferencia: "Walking Steadiness" },
  ],
};

function normTrend(t: string | null | undefined): TendenciaBiomarcador {
  if (!t) return null;
  return TENDENCIA_FROM_API[t] ?? TENDENCIA_FROM_API[t.toLowerCase()] ?? null;
}

function normClassificacao(c: string | null | undefined) {
  if (!c) return null;
  return CLASSIFICACAO_FROM_LABEL[c] ?? CLASSIFICACAO_FROM_LABEL[c.toLowerCase()] ?? null;
}

function buildBiomarcadorItems(componentes: ComponentesCockpit, pilarTipo: string): BiomarcadorItem[] {
  const configs = COMPONENTES_POR_PILAR[pilarTipo];
  if (!configs) return [];
  return configs
    .filter((cfg) => componentes[cfg.key] != null)
    .map((cfg) => {
      const comp = componentes[cfg.key];
      return {
        key: cfg.key,
        nome: cfg.nome,
        value: comp?.valor ?? null,
        valorFormatado: comp?.valor_formatado ?? null,
        unit: comp?.unidade ?? cfg.defaultUnit,
        trend: normTrend(comp?.tendencia),
        referencia: comp?.referencia ?? cfg.defaultReferencia,
        invertedSemantics: cfg.invertedSemantics,
      };
    });
}

function buildCardioFromLegacy(cardio: RespostaCardiometabolico): BiomarcadorItem[] {
  const configs = COMPONENTES_POR_PILAR.cardiovascular;
  const metricMap: Record<string, string> = {
    hrv: "hrv_rmssd",
    fcr: "resting_hr",
    vo2: "vo2_max",
    recuperacao: "hr_recovery_1min",
  };
  return configs.map((cfg) => {
    const m = cardio.metricas_cardio.find(mc => mc.metric_type === metricMap[cfg.key]);
    return {
      key: cfg.key,
      nome: cfg.nome,
      value: m?.valor_atual ?? null,
      unit: m?.unidade ?? cfg.defaultUnit,
      trend: normTrend(m?.tendencia),
      baseline: m?.media_30d ?? undefined,
      referencia: cfg.defaultReferencia,
      invertedSemantics: cfg.invertedSemantics,
    };
  });
}

export function AbaCockpit({ pacienteId }: AbaCockpitProps) {
  const { toast } = useToast();
  const [interesseRegistrado, setInteresseRegistrado] = useState<Set<string>>(new Set());

  const { data: cockpit, isLoading: loadingCockpit } = useQuery<RespostaCockpit>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cockpit"],
  });

  const scoreCV = cockpit?.scores?.find(s => s.tipo === "cardiovascular");
  const temComponentesCockpit = !!scoreCV?.componentes;

  const { data: cardio, isLoading: loadingCardio } = useQuery<RespostaCardiometabolico>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cardiometabolico"],
    enabled: !!scoreCV?.ativo && !temComponentesCockpit,
  });

  const interesseMutation = useMutation({
    mutationFn: async (componente: string) => {
      await apiRequest("POST", "/api/painel-longevidade/interesse", { componente });
    },
    onSuccess: (_data, componente) => {
      setInteresseRegistrado(prev => new Set(prev).add(componente));
      toast({
        title: "Interesse registrado",
        description: "Você será notificado quando este módulo estiver disponível.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu interesse. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const isLoading = loadingCockpit;

  if (!isLoading && !cockpit) {
    return <EstadoDiaZero />;
  }

  const sortedScores = cockpit?.scores
    ? [...cockpit.scores].sort((a, b) => {
        const ia = ORDEM_PILARES.indexOf(a.tipo);
        const ib = ORDEM_PILARES.indexOf(b.tipo);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    : [];

  const ativosScores = sortedScores.filter(s => s.ativo !== false);
  const inativosScores = sortedScores.filter(s => s.ativo === false);

  return (
    <div className="space-y-6" data-testid="aba-cockpit">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {ativosScores.map((pilar: ScorePilar) => {
          const classificacao = normClassificacao(pilar.classificacao);
          const tendenciaRaw = pilar.tendencia_score ?? pilar.tendencia ?? null;
          const tendencia = normTrend(tendenciaRaw);
          return (
            <div key={pilar.tipo} className="lg:col-span-1">
              <CardScore
                score={pilar.score}
                classification={classificacao}
                tendencia={tendencia}
                is_partial={pilar.is_partial ?? false}
                updated_at={cockpit?.data_atualizacao ?? null}
                isLoading={isLoading}
                pilarTipo={pilar.tipo}
              />
            </div>
          );
        })}

        {inativosScores.map((sf: ScorePilar) => {
          const Icone = ICONES_PILAR[sf.tipo] ?? Activity;
          const label = LABELS_PILAR[sf.tipo] ?? sf.tipo;
          const componente = TIPO_TO_COMPONENTE[sf.tipo] ?? sf.tipo;
          const jaRegistrou = interesseRegistrado.has(componente);
          return (
            <div
              key={sf.tipo}
              className="rounded-xl p-5 h-full flex flex-col items-center justify-center text-center"
              style={{ background: "var(--sys-bg-secondary)", border: "1px solid var(--sys-border-light)" }}
              data-testid={`card-score-futuro-${sf.tipo}`}
            >
              <div className="relative mb-3">
                <Icone className="h-6 w-6" style={{ color: "var(--sys-text-muted)" }} />
                <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5" style={{ color: "var(--sys-text-muted)" }} />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--sys-text-muted)" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--sys-text-muted)" }}>—</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--sys-text-muted)" }}>
                {sf.mensagem_bloqueio ?? "Disponível em breve"}
              </p>
              <button
                className="text-[10px] mt-2 flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-default disabled:no-underline"
                style={{ color: jaRegistrou ? "var(--sys-success)" : "var(--mod-longevidade-base)" }}
                onClick={() => interesseMutation.mutate(componente)}
                disabled={jaRegistrou || interesseMutation.isPending}
                data-testid={`button-avisar-${sf.tipo}`}
              >
                {jaRegistrou ? (
                  <>
                    <Check className="h-3 w-3" />
                    Interesse registrado
                  </>
                ) : (
                  <>
                    <Bell className="h-3 w-3" />
                    Me avise quando disponível
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {ativosScores.map((pilar) => {
        let items: BiomarcadorItem[] | null = null;

        if (pilar.componentes && Object.keys(pilar.componentes).length > 0) {
          items = buildBiomarcadorItems(pilar.componentes, pilar.tipo);
        } else if (pilar.tipo === "cardiovascular" && cardio && !loadingCardio) {
          items = buildCardioFromLegacy(cardio);
        }

        if (!items || items.length === 0) {
          if (pilar.score != null) {
            return (
              <div key={`componentes-${pilar.tipo}`}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--mod-longevidade-text)" }}>
                  Componentes — {LABELS_PILAR[pilar.tipo] ?? pilar.tipo}
                </h3>
                <p className="text-sm text-muted-foreground">Dados dos componentes serão disponibilizados em breve.</p>
              </div>
            );
          }
          return null;
        }

        return (
          <div key={`componentes-${pilar.tipo}`}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--mod-longevidade-text)" }}>
              Componentes — {LABELS_PILAR[pilar.tipo] ?? pilar.tipo}
            </h3>
            <GradeGenerica items={items} testId={`grade-biomarcadores-${pilar.tipo}`} />
          </div>
        );
      })}

      <GraficoTendenciaScore pacienteId={pacienteId} />
    </div>
  );
}
