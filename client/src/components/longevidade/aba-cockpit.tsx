import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, Moon, Dumbbell, Lock, Bell, Check } from "lucide-react";
import { CardScore } from "./card-score";
import { GradeBiomarcadores } from "./card-biomarcador";
import { GraficoTendenciaScore } from "./grafico-tendencia-score";
import { EstadoDiaZero } from "./estado-dia-zero";
import type { RespostaCockpit, RespostaCardiometabolico, ScorePilar } from "@shared/schema";
import { CLASSIFICACAO_FROM_LABEL, TENDENCIA_FROM_API } from "@shared/schema";
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
  metabolic: "Score Metabólico",
  recovery: "Score Recuperação",
  functional: "Score Funcional",
};

const TIPO_TO_COMPONENTE: Record<string, string> = {
  metabolic: "score_metabolico",
  recovery: "score_recuperacao",
  functional: "score_funcional",
};

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

  const classificacaoEN = scoreCV?.classificacao
    ? (CLASSIFICACAO_FROM_LABEL[scoreCV.classificacao] ?? CLASSIFICACAO_FROM_LABEL[scoreCV.classificacao.toLowerCase()] ?? null)
    : null;
  const tendenciaRaw = scoreCV?.tendencia_score ?? scoreCV?.tendencia ?? null;
  const tendenciaCV = tendenciaRaw
    ? (TENDENCIA_FROM_API[tendenciaRaw] ?? TENDENCIA_FROM_API[tendenciaRaw.toLowerCase()] ?? null)
    : null;
  const scoresFuturos = cockpit?.scores?.filter(s => s.tipo !== "cardiovascular") ?? [];

  function normTrend(t: string | null | undefined) {
    if (!t) return null;
    return TENDENCIA_FROM_API[t] ?? null;
  }

  const componentesParaGrade = (() => {
    if (scoreCV?.componentes) {
      const c = scoreCV.componentes;
      return {
        hrv: { value: c.hrv?.valor ?? null, unit: c.hrv?.unidade ?? "ms", trend: normTrend(c.hrv?.tendencia), referencia: c.hrv?.referencia ?? undefined },
        rhr: { value: c.fcr?.valor ?? null, unit: c.fcr?.unidade ?? "bpm", trend: normTrend(c.fcr?.tendencia), referencia: c.fcr?.referencia ?? undefined },
        vo2: { value: c.vo2?.valor ?? null, unit: c.vo2?.unidade ?? "mL/kg/min", trend: normTrend(c.vo2?.tendencia), referencia: c.vo2?.referencia ?? undefined },
        recovery: { value: c.recuperacao?.valor ?? null, unit: c.recuperacao?.unidade ?? "bpm", trend: normTrend(c.recuperacao?.tendencia), referencia: c.recuperacao?.referencia ?? undefined },
      };
    }
    if (cardio) {
      return {
        hrv: (() => {
          const m = cardio.metricas_cardio.find(mc => mc.metric_type === "hrv_rmssd");
          return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "ms", trend: normTrend(m?.tendencia), baseline: m?.media_30d ?? undefined };
        })(),
        rhr: (() => {
          const m = cardio.metricas_cardio.find(mc => mc.metric_type === "resting_hr");
          return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "bpm", trend: normTrend(m?.tendencia), baseline: m?.media_30d ?? undefined };
        })(),
        vo2: (() => {
          const m = cardio.metricas_cardio.find(mc => mc.metric_type === "vo2_max");
          return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "mL/kg/min", trend: normTrend(m?.tendencia), baseline: m?.media_30d ?? undefined };
        })(),
        recovery: (() => {
          const m = cardio.metricas_cardio.find(mc => mc.metric_type === "hr_recovery_1min");
          return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "bpm", trend: normTrend(m?.tendencia), baseline: m?.media_30d ?? undefined };
        })(),
      };
    }
    return null;
  })();

  return (
    <div className="space-y-6" data-testid="aba-cockpit">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <CardScore
            score={scoreCV?.score ?? null}
            classification={classificacaoEN}
            tendencia={tendenciaCV}
            is_partial={scoreCV?.is_partial ?? false}
            updated_at={cockpit?.data_atualizacao ?? null}
            isLoading={isLoading}
          />
        </div>

        {scoresFuturos.map((sf: ScorePilar) => {
          const Icone = ICONES_PILAR[sf.tipo] ?? Activity;
          const label = LABELS_PILAR[sf.tipo] ?? sf.tipo;
          const componente = TIPO_TO_COMPONENTE[sf.tipo] ?? sf.tipo;
          const jaRegistrou = interesseRegistrado.has(componente);
          return (
            <div
              key={sf.tipo}
              className="rounded-xl p-5 flex flex-col items-center justify-center text-center"
              style={{ background: "var(--sys-bg-secondary)", border: "1px solid var(--sys-border-light)" }}
              data-testid={`card-score-futuro-${sf.tipo}`}
            >
              <div className="relative mb-3">
                <Icone className="h-6 w-6" style={{ color: "var(--sys-text-muted)" }} />
                <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5" style={{ color: "var(--sys-text-muted)" }} />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--sys-text-muted)" }}>{label}</p>
              <p className="font-serif text-2xl font-bold" style={{ color: "var(--sys-text-muted)" }}>—</p>
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

      {componentesParaGrade && !(loadingCardio && !temComponentesCockpit) && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--mod-longevidade-text)" }}>
            Componentes do Score
          </h3>
          <GradeBiomarcadores componentes={componentesParaGrade} />
        </div>
      )}

      <GraficoTendenciaScore pacienteId={pacienteId} />
    </div>
  );
}
