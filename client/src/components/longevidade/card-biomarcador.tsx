import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TendenciaBiomarcador } from "@shared/schema";

interface CardBiomarcadorProps {
  nome: string;
  valor: number | null;
  unidade: string;
  tendencia: TendenciaBiomarcador;
  baseline?: number;
}

const ICONE_TENDENCIA = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const LABEL_TENDENCIA: Record<string, string> = {
  up: "Subindo",
  down: "Descendo",
  stable: "Estável",
};

export function CardBiomarcador({ nome, valor, unidade, tendencia, baseline }: CardBiomarcadorProps) {
  const insuficiente = valor === null;
  const IconeTendencia = tendencia ? ICONE_TENDENCIA[tendencia] : null;

  return (
    <div
      className={`rounded-lg p-4 ${insuficiente ? "biomarker-card--insufficient" : ""}`}
      style={{
        background: "var(--mod-longevidade-bg-subtle)",
        border: "1px solid var(--mod-longevidade-border)",
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
        <div className="flex items-center gap-2 mt-2">
          {IconeTendencia && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--mod-longevidade-icon)" }}>
              <IconeTendencia className="h-3.5 w-3.5" />
              {LABEL_TENDENCIA[tendencia!]}
            </span>
          )}
          {baseline !== undefined && (
            <span className="text-xs text-muted-foreground">
              Baseline: {baseline} {unidade}
            </span>
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
    { key: "hrv", nome: "HRV (RMSSD)", ...componentes.hrv },
    { key: "rhr", nome: "Freq. Cardíaca de Repouso", ...componentes.rhr },
    { key: "vo2", nome: "VO₂ Máximo", ...componentes.vo2 },
    { key: "recovery", nome: "Recuperação da FC", ...componentes.recovery },
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
        />
      ))}
    </div>
  );
}
