import { useQuery } from "@tanstack/react-query";
import { Lock, Bell } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaCardiometabolico, TendenciaBiomarcador } from "@shared/schema";
import { TENDENCIA_FROM_API } from "@shared/schema";
import { TOOLTIPS_COMPONENTES } from "./tooltips-longevidade";

interface AbaCardiometabolicoProps {
  pacienteId: string;
}

const CARDIO_CONFIGS: {
  metricType: string;
  nome: string;
  defaultUnit: string;
  invertedSemantics: boolean;
  labelSecundario?: string;
  eixo: "autonomico" | "aerobio";
  tooltip?: string;
}[] = [
  { metricType: "hrv_rmssd",        nome: "HRV",               defaultUnit: "ms",        invertedSemantics: false, eixo: "autonomico", tooltip: TOOLTIPS_COMPONENTES.hrv },
  { metricType: "resting_hr",       nome: "FC de repouso",     defaultUnit: "bpm",       invertedSemantics: true,  eixo: "autonomico", tooltip: TOOLTIPS_COMPONENTES.fcr },
  { metricType: "vo2_max",          nome: "VO₂ máximo",        defaultUnit: "mL/kg/min", invertedSemantics: false, eixo: "aerobio",    tooltip: TOOLTIPS_COMPONENTES.vo2 },
  { metricType: "hr_recovery_1min", nome: "Recuperação da FC", defaultUnit: "bpm",       invertedSemantics: false, labelSecundario: "Média das últimas 5 sessões", eixo: "aerobio", tooltip: TOOLTIPS_COMPONENTES.recuperacao },
];

const METABOLICO_CONFIGS: {
  metricType: string;
  nome: string;
  defaultUnit: string;
  invertedSemantics: boolean;
  tooltip?: string;
}[] = [
  { metricType: "body_fat_pct",   nome: "Gordura corporal", defaultUnit: "%",  invertedSemantics: true,  tooltip: TOOLTIPS_COMPONENTES.gordura },
  { metricType: "waist_circ",     nome: "Cintura",          defaultUnit: "cm", invertedSemantics: true,  tooltip: TOOLTIPS_COMPONENTES.cintura },
  { metricType: "lean_mass",      nome: "Massa magra",      defaultUnit: "kg", invertedSemantics: false, tooltip: TOOLTIPS_COMPONENTES.massa_magra },
  { metricType: "tendencia_peso", nome: "Tendência de peso",defaultUnit: "kg", invertedSemantics: false, tooltip: TOOLTIPS_COMPONENTES.tendencia_peso },
];

const METABOLICO_LOCKED_LABELS = [
  "Gordura corporal",
  "Circunferência abdominal",
  "Tendência de peso",
  "Glicemia (CGM)",
];

function normTrend(t: string | null | undefined): TendenciaBiomarcador {
  if (!t) return null;
  return TENDENCIA_FROM_API[t] ?? TENDENCIA_FROM_API[t.toLowerCase()] ?? null;
}

function formatarBr(valor: number | null, casas = 1): string | null {
  if (valor === null) return null;
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

function formatTendenciaPeso(valor: number | null): string | null {
  if (valor === null) return null;
  const abs = Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (valor > 0) return `+${abs} kg`;
  if (valor < 0) return `\u2212${abs} kg`;
  return `0,00 kg`;
}

function labelReferencia(ref: string | null | undefined): string | undefined {
  if (!ref) return undefined;
  if (ref.toLowerCase() === "clínico" || ref.toLowerCase() === "clinico") return "Último registro";
  return ref;
}

export function AbaCardiometabolico({ pacienteId }: AbaCardiometabolicoProps) {
  const { data, isLoading } = useQuery<RespostaCardiometabolico>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cardiometabolico"],
  });

  const metricas = data?.metricas_cardio ?? [];
  const metabolicas = data?.metricas_metabolicas ?? [];
  const bloqueado = data ? data.secao_metabolica_bloqueada : true;

  const autonomico = CARDIO_CONFIGS.filter(c => c.eixo === "autonomico");
  const aerobio    = CARDIO_CONFIGS.filter(c => c.eixo === "aerobio");

  function renderCardioCard(cfg: typeof CARDIO_CONFIGS[0]) {
    const m        = metricas.find(mc => mc.metric_type === cfg.metricType);
    const valor    = m?.valor_atual ?? null;
    const unidade  = m?.unidade ?? cfg.defaultUnit;
    const baseline = m?.media_30d ?? undefined;
    const label    = cfg.labelSecundario ?? (baseline != null ? "Média 30d" : undefined);

    let tendencia = normTrend(m?.tendencia);
    if (tendencia && baseline != null && valor !== null) {
      const delta = Math.abs(valor - baseline);
      if (delta < 0.5) tendencia = null;
    }

    const casas = unidade === "mL/kg/min" ? 2 : 1;
    const valorFormatado = formatarBr(valor, casas);

    return (
      <CardBiomarcador
        key={cfg.metricType}
        nome={cfg.nome}
        valor={valor}
        valorFormatado={valorFormatado !== null ? `${valorFormatado} ${unidade}` : null}
        unidade={unidade}
        tendencia={tendencia}
        baseline={baseline}
        invertedSemantics={cfg.invertedSemantics}
        labelSecundario={label}
        aguardandoLeitura={valor === null}
        tooltip={cfg.tooltip}
      />
    );
  }

  function renderMetabolicoCard(cfg: typeof METABOLICO_CONFIGS[0]) {
    const m = metabolicas.find(mc => mc.metric_type === cfg.metricType);
    if (!m) return null;

    const isPeso = cfg.metricType === "tendencia_peso";
    const unidade = m.unidade ?? cfg.defaultUnit;

    let valorFormatado: string | null | undefined;
    if (isPeso) {
      valorFormatado = formatTendenciaPeso(m.valor) ?? undefined;
    } else {
      const formatted = formatarBr(m.valor, 1);
      valorFormatado = formatted !== null ? `${formatted} ${unidade}` : undefined;
    }

    return (
      <CardBiomarcador
        key={cfg.metricType}
        nome={cfg.nome}
        valor={m.valor}
        valorFormatado={valorFormatado}
        unidade={unidade}
        tendencia={null}
        invertedSemantics={cfg.invertedSemantics}
        labelSecundario={labelReferencia(m.referencia)}
        aguardandoLeitura={m.valor === null}
        tooltip={cfg.tooltip}
      />
    );
  }

  return (
    <div className="space-y-8" data-testid="aba-cardiometabolico">

      {/* ── Cardiovascular ── */}
      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-cardiovascular">
          Cardiovascular
        </h3>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="axis-sublabel mb-3" data-testid="label-eixo-autonomico">Controle autonômico</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {autonomico.map(renderCardioCard)}
              </div>
            </div>
            <div>
              <p className="axis-sublabel mb-3" data-testid="label-eixo-aerobio">Capacidade aeróbia</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aerobio.map(renderCardioCard)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Metabólico ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-label-longevidade" data-testid="label-metabolico">
            Metabólico
          </h3>
          {bloqueado && (
            <>
              <Lock className="h-3.5 w-3.5" style={{ color: "var(--mod-longevidade-disabled)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--sys-text-muted)" }}>
                {data?.mensagem_bloqueio_metabolico ?? data?.mensagem_bloqueio ?? "A análise metabólica completa e composição corporal estarão disponíveis em breve."}
              </span>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
          </div>
        ) : !bloqueado ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {METABOLICO_CONFIGS.map(renderMetabolicoCard)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {METABOLICO_LOCKED_LABELS.map((nome) => (
                <div
                  key={nome}
                  className="rounded-lg p-4 opacity-60"
                  style={{ background: "var(--sys-bg-secondary)", border: "1px dashed var(--sys-border-light)" }}
                  data-testid={`card-metabolico-${nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-3 w-3" style={{ color: "var(--sys-text-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--sys-text-muted)" }}>{nome}</p>
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
          </>
        )}
      </section>
    </div>
  );
}
