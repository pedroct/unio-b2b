import { useQuery } from "@tanstack/react-query";
import { Activity, Moon, Dumbbell, Lock, Bell } from "lucide-react";
import { CardScore } from "./card-score";
import { GradeBiomarcadores } from "./card-biomarcador";
import { GraficoTendenciaScore } from "./grafico-tendencia-score";
import { EstadoDiaZero } from "./estado-dia-zero";
import type { RespostaCockpit, RespostaCardiometabolico, ScorePilar } from "@shared/schema";
import { CLASSIFICACAO_FROM_LABEL } from "@shared/schema";

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

export function AbaCockpit({ pacienteId }: AbaCockpitProps) {
  const { data: cockpit, isLoading: loadingCockpit } = useQuery<RespostaCockpit>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cockpit"],
  });

  const { data: cardio, isLoading: loadingCardio } = useQuery<RespostaCardiometabolico>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cardiometabolico"],
    enabled: !!cockpit?.scores?.some(s => s.tipo === "cardiovascular" && s.ativo),
  });

  const isLoading = loadingCockpit;

  if (!isLoading && !cockpit) {
    return <EstadoDiaZero />;
  }

  const scoreCV = cockpit?.scores?.find(s => s.tipo === "cardiovascular");
  const classificacaoEN = scoreCV?.classificacao ? CLASSIFICACAO_FROM_LABEL[scoreCV.classificacao] ?? null : null;
  const scoresFuturos = cockpit?.scores?.filter(s => s.tipo !== "cardiovascular") ?? [];

  const componentesParaGrade = cardio ? {
    hrv: (() => {
      const m = cardio.metricas_cardio.find(mc => mc.metric_type === "hrv_rmssd");
      return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "ms", trend: m?.tendencia ?? null, baseline: m?.media_30d ?? undefined };
    })(),
    rhr: (() => {
      const m = cardio.metricas_cardio.find(mc => mc.metric_type === "resting_hr");
      return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "bpm", trend: m?.tendencia ?? null, baseline: m?.media_30d ?? undefined };
    })(),
    vo2: (() => {
      const m = cardio.metricas_cardio.find(mc => mc.metric_type === "vo2_max");
      return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "mL/kg/min", trend: m?.tendencia ?? null, baseline: m?.media_30d ?? undefined };
    })(),
    recovery: (() => {
      const m = cardio.metricas_cardio.find(mc => mc.metric_type === "hr_recovery_1min");
      return { value: m?.valor_atual ?? null, unit: m?.unidade ?? "bpm", trend: m?.tendencia ?? null, baseline: m?.media_30d ?? undefined };
    })(),
  } : null;

  return (
    <div className="space-y-6" data-testid="aba-cockpit">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <CardScore
            score={scoreCV?.score ?? null}
            classification={classificacaoEN}
            tendencia={scoreCV?.tendencia ?? null}
            is_partial={scoreCV?.is_partial ?? false}
            updated_at={cockpit?.data_atualizacao ?? null}
            isLoading={isLoading}
          />
        </div>

        {scoresFuturos.map((sf: ScorePilar) => {
          const Icone = ICONES_PILAR[sf.tipo] ?? Activity;
          const label = LABELS_PILAR[sf.tipo] ?? sf.tipo;
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
                className="text-[10px] mt-2 flex items-center gap-1 hover:underline"
                style={{ color: "var(--mod-longevidade-base)" }}
                onClick={() => {}}
                data-testid={`button-avisar-${sf.tipo}`}
              >
                <Bell className="h-3 w-3" />
                Me avise quando disponível
              </button>
            </div>
          );
        })}
      </div>

      {componentesParaGrade && !loadingCardio && (
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
