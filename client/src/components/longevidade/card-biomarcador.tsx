import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import type { TendenciaBiomarcador } from "@shared/schema";

interface CardBiomarcadorProps {
  nome: string;
  valor: number | null;
  unidade: string;
  tendencia: TendenciaBiomarcador;
  baseline?: number;
  invertedSemantics?: boolean;
  labelSecundario?: string;
}

const ICONE_TENDENCIA = {
  up: TrendingUp,
  down: TrendingDown,
  stable: ArrowRight,
};

function calcularDiff(valor: number | null, baseline: number | undefined): number | null {
  if (valor === null || baseline === undefined) return null;
  return Math.round((valor - baseline) * 10) / 10;
}

function corTendencia(tendencia: TendenciaBiomarcador, invertedSemantics: boolean): string {
  if (!tendencia || tendencia === "stable") return "var(--sys-text-muted)";
  const positivo = invertedSemantics
    ? tendencia === "down"
    : tendencia === "up";
  return positivo ? "var(--score-excellent-icon)" : "var(--score-attention-icon)";
}

function copyTendencia(
  tendencia: TendenciaBiomarcador,
  diff: number | null,
  unidade: string,
  invertedSemantics: boolean,
): string {
  if (!tendencia) return "";
  if (tendencia === "stable") return "Estável";
  if (diff !== null) {
    const sinal = diff > 0 ? "+" : "";
    return `${sinal}${diff} ${unidade} vs referência 90d`;
  }
  const positivo = invertedSemantics
    ? tendencia === "down"
    : tendencia === "up";
  return positivo ? "Tendência positiva" : "Tendência negativa";
}

export function CardBiomarcador({
  nome,
  valor,
  unidade,
  tendencia,
  baseline,
  invertedSemantics = false,
  labelSecundario,
}: CardBiomarcadorProps) {
  const insuficiente = valor === null;
  const IconeTendencia = tendencia ? ICONE_TENDENCIA[tendencia] : null;
  const diff = calcularDiff(valor, baseline);
  const cor = corTendencia(tendencia, invertedSemantics);
  const copy = copyTendencia(tendencia, diff, unidade, invertedSemantics);

  return (
    <div
      className={`rounded-lg p-4 ${insuficiente ? "biomarker-card--insufficient" : ""}`}
      style={{
        background: "var(--mod-longevidade-bg-subtle)",
        border: "1px solid var(--mod-longevidade-border)",
        boxShadow: "var(--sys-shadow-sm)",
      }}
      data-testid={`card-biomarcador-${nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: "var(--mod-longevidade-text)" }}>
        {nome}
      </p>

      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold ${insuficiente ? "biomarker-card__value text-muted-foreground" : ""}`}>
          {insuficiente ? "—" : valor}
        </span>
        <span className="text-xs text-muted-foreground">{unidade}</span>
      </div>

      {insuficiente ? (
        <p className="text-xs text-muted-foreground mt-2">Dados insuficientes</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {IconeTendencia && (
            <span className="flex items-center gap-1 text-xs" style={{ color: cor }}>
              <IconeTendencia className="h-3.5 w-3.5" />
              {copy}
            </span>
          )}
          {labelSecundario && (
            <p className="text-[10px]" style={{ color: "var(--sys-text-muted)" }}>{labelSecundario}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface GradeBiomarcadoresProps {
  componentes: {
    hrv: { value: number | null; unit: string; trend: TendenciaBiomarcador; baseline?: number };
    rhr: { value: number | null; unit: string; trend: TendenciaBiomarcador; baseline?: number };
    vo2: { value: number | null; unit: string; trend: TendenciaBiomarcador; baseline?: number };
    recovery: { value: number | null; unit: string; trend: TendenciaBiomarcador; baseline?: number };
  };
}

export function GradeBiomarcadores({ componentes }: GradeBiomarcadoresProps) {
  const items = [
    { key: "hrv", nome: "HRV (RMSSD)", ...componentes.hrv, invertedSemantics: false },
    { key: "rhr", nome: "FC de Repouso", ...componentes.rhr, invertedSemantics: true },
    { key: "vo2", nome: "VO₂ Máximo", ...componentes.vo2, invertedSemantics: false },
    { key: "recovery", nome: "Recuperação da FC", ...componentes.recovery, invertedSemantics: false, labelSecundario: "Média das últimas 5 sessões" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grade-biomarcadores">
      {items.map((item) => (
        <CardBiomarcador
          key={item.key}
          nome={item.nome}
          valor={item.value}
          unidade={item.unit}
          tendencia={item.trend}
          baseline={item.baseline}
          invertedSemantics={item.invertedSemantics}
          labelSecundario={item.labelSecundario}
        />
      ))}
    </div>
  );
}
