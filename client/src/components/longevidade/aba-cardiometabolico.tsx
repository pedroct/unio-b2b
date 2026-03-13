import { useQuery } from "@tanstack/react-query";
import { Lock, Bell } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaCardiometabolico, RespostaCockpit, MetricaCardio, ComponenteScore } from "@shared/schema";
import { LABELS_BIOMARCADOR, TENDENCIA_FROM_API } from "@shared/schema";
import { TOOLTIPS_COMPONENTES } from "./tooltips-longevidade";

interface AbaCardiometabolicoProps {
  pacienteId: string;
}

const CARDIO_CONFIGS: {
  key: string;
  metricType: string;
  nome: string;
  defaultUnit: string;
  invertedSemantics: boolean;
  labelSecundario?: string;
  eixo: "autonomico" | "aerobio";
  tooltip?: string;
}[] = [
  { key: "hrv", metricType: "hrv_rmssd", nome: "HRV", defaultUnit: "ms", invertedSemantics: false, eixo: "autonomico", tooltip: TOOLTIPS_COMPONENTES.hrv },
  { key: "fcr", metricType: "resting_hr", nome: "FC de Repouso", defaultUnit: "bpm", invertedSemantics: true, eixo: "autonomico", tooltip: TOOLTIPS_COMPONENTES.fcr },
  { key: "vo2", metricType: "vo2_max", nome: "VO₂ Máximo", defaultUnit: "mL/kg/min", invertedSemantics: false, eixo: "aerobio", tooltip: TOOLTIPS_COMPONENTES.vo2 },
  { key: "recuperacao", metricType: "hr_recovery_1min", nome: "Recuperação da FC", defaultUnit: "bpm", invertedSemantics: false, labelSecundario: "Média das últimas 5 sessões", eixo: "aerobio", tooltip: TOOLTIPS_COMPONENTES.recuperacao },
];

const biomarcadoresMetabolicos = [
  { nome: "% Gordura corporal" },
  { nome: "Circunferência abdominal" },
  { nome: "Tendência de peso" },
  { nome: "Glicemia (CGM)" },
];

function normTrend(t: string | null | undefined) {
  if (!t) return null;
  return TENDENCIA_FROM_API[t] ?? TENDENCIA_FROM_API[t.toLowerCase()] ?? null;
}

interface CardioCardData {
  key: string;
  metricType: string;
  nome: string;
  valor: number | null;
  valorFormatado?: string | null;
  unidade: string;
  tendencia: ReturnType<typeof normTrend>;
  baseline?: number;
  sparklineData?: number[];
  invertedSemantics: boolean;
  labelSecundario?: string;
  aguardandoLeitura: boolean;
  tooltip?: string;
}

function buildCardioCards(
  cockpitCV: Record<string, ComponenteScore | null> | null | undefined,
  metricas: MetricaCardio[],
): CardioCardData[] {
  return CARDIO_CONFIGS.map((cfg) => {
    const fromCockpit = cockpitCV?.[cfg.key];
    const fromCardio = metricas.find(m => m.metric_type === cfg.metricType);

    const valor = fromCockpit != null ? fromCockpit.valor : (fromCardio?.valor_atual ?? null);
    const valorFormatado = fromCockpit?.valor_formatado ?? null;
    const unidade = fromCockpit?.unidade ?? fromCardio?.unidade ?? cfg.defaultUnit;
    const tendencia = normTrend(fromCockpit?.tendencia ?? fromCardio?.tendencia);
    const baseline = fromCardio?.media_30d ?? undefined;
    const sparklineData = fromCardio?._sparkline_mock;

    if (valor === null && !fromCardio) return null;

    return {
      key: cfg.key,
      metricType: cfg.metricType,
      nome: cfg.nome,
      valor,
      valorFormatado,
      unidade,
      tendencia,
      baseline,
      sparklineData,
      invertedSemantics: cfg.invertedSemantics,
      labelSecundario: cfg.labelSecundario,
      aguardandoLeitura: valor === null,
      tooltip: cfg.tooltip,
    };
  }).filter((c): c is CardioCardData => c !== null);
}

export function AbaCardiometabolico({ pacienteId }: AbaCardiometabolicoProps) {
  const { data: cockpit, isLoading: loadingCockpit } = useQuery<RespostaCockpit>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cockpit"],
  });

  const cockpitCV = cockpit?.scores?.find(s => s.tipo === "cardiovascular")?.componentes;
  const temComponentesCockpit = !!cockpitCV;

  const { data: cardio, isLoading: loadingCardio } = useQuery<RespostaCardiometabolico>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cardiometabolico"],
    enabled: !loadingCockpit,
  });

  const isLoading = loadingCockpit || loadingCardio;

  const cardioCards = buildCardioCards(cockpitCV, cardio?.metricas_cardio ?? []);
  const autonomico = cardioCards.filter(c => CARDIO_CONFIGS.find(cfg => cfg.key === c.key)?.eixo === "autonomico");
  const aerobio = cardioCards.filter(c => CARDIO_CONFIGS.find(cfg => cfg.key === c.key)?.eixo === "aerobio");

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
        ) : cardioCards.length > 0 ? (
          <div className="space-y-6">
            {autonomico.length > 0 && (
              <div>
                <p className="axis-sublabel mb-3" data-testid="label-eixo-autonomico">Controle autonômico</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {autonomico.map((c) => (
                    <CardBiomarcador
                      key={c.key}
                      nome={c.nome}
                      valor={c.valor}
                      valorFormatado={c.valorFormatado ?? undefined}
                      unidade={c.unidade}
                      tendencia={c.tendencia}
                      baseline={c.baseline}
                      invertedSemantics={c.invertedSemantics}
                      labelSecundario={c.labelSecundario}
                      sparklineData={c.sparklineData}
                      aguardandoLeitura={c.aguardandoLeitura}
                      tooltip={c.tooltip}
                    />
                  ))}
                </div>
              </div>
            )}

            {aerobio.length > 0 && (
              <div>
                <p className="axis-sublabel mb-3" data-testid="label-eixo-aerobio">Capacidade aeróbia</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aerobio.map((c) => (
                    <CardBiomarcador
                      key={c.key}
                      nome={c.nome}
                      valor={c.valor}
                      valorFormatado={c.valorFormatado ?? undefined}
                      unidade={c.unidade}
                      tendencia={c.tendencia}
                      baseline={c.baseline}
                      invertedSemantics={c.invertedSemantics}
                      labelSecundario={c.labelSecundario}
                      sparklineData={c.sparklineData}
                      aguardandoLeitura={c.aguardandoLeitura}
                      tooltip={c.tooltip}
                    />
                  ))}
                </div>
              </div>
            )}
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
            {cardio?.secao_metabolica_bloqueada
              ? (cardio.mensagem_bloqueio_metabolico ?? cardio.mensagem_bloqueio ?? "Em breve")
              : "A análise metabólica completa e composição corporal estarão disponíveis em breve."}
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
