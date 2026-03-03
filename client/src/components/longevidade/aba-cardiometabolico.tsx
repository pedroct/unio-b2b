import { useQuery } from "@tanstack/react-query";
import { Lock, Bell } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaCardiometabolico, MetricaCardio } from "@shared/schema";
import { LABELS_BIOMARCADOR } from "@shared/schema";

interface AbaCardiometabolicoProps {
  pacienteId: string;
}

const METRIC_CONFIG: Record<string, { invertedSemantics: boolean; labelSecundario?: string; eixo: "autonomico" | "aerobio" }> = {
  hrv_rmssd: { invertedSemantics: false, eixo: "autonomico" },
  resting_hr: { invertedSemantics: true, eixo: "autonomico" },
  vo2_max: { invertedSemantics: false, labelSecundario: "P75 · idade/sexo", eixo: "aerobio" },
  hr_recovery_1min: { invertedSemantics: false, labelSecundario: "Média das últimas 5 sessões", eixo: "aerobio" },
};

const biomarcadoresMetabolicos = [
  { nome: "% Gordura corporal" },
  { nome: "Circunferência abdominal" },
  { nome: "Tendência de peso" },
  { nome: "Glicemia (CGM)" },
];

function renderMetrica(m: MetricaCardio) {
  const config = METRIC_CONFIG[m.metric_type];
  if (!config) return null;
  const nome = LABELS_BIOMARCADOR[m.metric_type] ?? m.metric_type;
  return (
    <CardBiomarcador
      key={m.metric_type}
      nome={nome}
      valor={m.valor_atual}
      unidade={m.unidade}
      tendencia={m.tendencia}
      baseline={m.media_30d ?? undefined}
      invertedSemantics={config.invertedSemantics}
      labelSecundario={config.labelSecundario}
      sparklineData={m._sparkline_mock}
      aguardandoLeitura={m.valor_atual === null}
    />
  );
}

export function AbaCardiometabolico({ pacienteId }: AbaCardiometabolicoProps) {
  const { data, isLoading } = useQuery<RespostaCardiometabolico>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cardiometabolico"],
  });

  const metricasAutonomico = data?.metricas_cardio.filter(m => METRIC_CONFIG[m.metric_type]?.eixo === "autonomico") ?? [];
  const metricasAerobio = data?.metricas_cardio.filter(m => METRIC_CONFIG[m.metric_type]?.eixo === "aerobio") ?? [];

  return (
    <div className="space-y-8" data-testid="aba-cardiometabolico">
      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-cardiovascular">
          Cardiovascular
        </h3>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-lg" />
              ))}
            </div>
          </div>
        ) : data?.metricas_cardio ? (
          <div className="space-y-6">
            <div>
              <p className="axis-sublabel mb-3" data-testid="label-eixo-autonomico">Controle autonômico</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metricasAutonomico.map(renderMetrica)}
              </div>
            </div>

            <div>
              <p className="axis-sublabel mb-3" data-testid="label-eixo-aerobio">Capacidade aeróbia</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metricasAerobio.map(renderMetrica)}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Dados cardiovasculares não disponíveis.</p>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-label-longevidade" data-testid="label-metabolico">
            Metabólico
          </h3>
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--mod-longevidade-disabled)" }} />
          <span className="text-[10px] font-medium" style={{ color: "var(--sys-text-muted)" }}>
            {data?.secao_metabolica_bloqueada ? (data.mensagem_bloqueio ?? "Em breve") : "Em breve"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {biomarcadoresMetabolicos.map((bm) => (
            <div
              key={bm.nome}
              className="rounded-lg p-4 opacity-60"
              style={{ background: "var(--sys-bg-secondary)", border: "1px dashed var(--sys-border-light)" }}
              data-testid={`card-metabolico-${bm.nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3 w-3" style={{ color: "var(--sys-text-muted)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--sys-text-muted)" }}>{bm.nome}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--sys-text-muted)" }}>—</p>
              <p className="text-[10px]" style={{ color: "var(--sys-text-muted)" }}>Disponível em breve</p>
            </div>
          ))}
        </div>

        <button
          className="flex items-center gap-1.5 mt-4 text-xs font-medium hover:underline cursor-pointer"
          style={{ color: "var(--mod-longevidade-base)" }}
          data-testid="button-avise-metabolico"
        >
          <Bell className="h-3.5 w-3.5" />
          Me avise quando disponível
        </button>
      </section>
    </div>
  );
}
