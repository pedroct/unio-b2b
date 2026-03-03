import { HeartPulse, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassificacaoScore } from "@shared/schema";
import { LABELS_CLASSIFICACAO } from "@shared/schema";

interface CardScoreProps {
  score: number | null;
  classification: ClassificacaoScore | null;
  delta_30d: number | null;
  updated_at: string | null;
  isLoading?: boolean;
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

export function CardScore({ score, classification, delta_30d, updated_at, isLoading }: CardScoreProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
        data-testid="card-score-skeleton"
      >
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-14 w-20 mb-3" />
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-3 w-36" />
      </div>
    );
  }

  if (score === null || classification === null) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
        data-testid="card-score-insuficiente"
      >
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="h-5 w-5" style={{ color: "var(--mod-longevidade-icon)" }} />
          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--mod-longevidade-text)" }}>
            Score Cardiovascular
          </span>
        </div>
        <p className="font-serif text-5xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>—</p>
        <p className="text-sm mt-3 text-muted-foreground">Dados insuficientes para cálculo</p>
      </div>
    );
  }

  const DeltaIcon = delta_30d !== null && delta_30d > 0 ? TrendingUp : delta_30d !== null && delta_30d < 0 ? TrendingDown : Minus;

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
      data-testid="card-score-cardiovascular"
    >
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse className="h-5 w-5" style={{ color: "var(--mod-longevidade-icon)" }} />
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--mod-longevidade-text)" }}>
          Score Cardiovascular
        </span>
      </div>

      <p className="font-serif text-5xl font-bold leading-none" style={{ color: "var(--mod-longevidade-text)" }} data-testid="text-score-value">
        {score}
      </p>

      <div className="flex items-center gap-3 mt-4">
        <span
          className={`score-badge--${classification} inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold`}
          data-testid="badge-classificacao"
        >
          {LABELS_CLASSIFICACAO[classification]}
        </span>

        {delta_30d !== null && (
          <span className="flex items-center gap-1 text-sm" style={{ color: `var(--score-${classification}-icon)` }} data-testid="text-delta">
            <DeltaIcon className="h-3.5 w-3.5" />
            {delta_30d > 0 ? "+" : ""}{delta_30d} pts nos últimos 30 dias
          </span>
        )}
      </div>

      {updated_at && (
        <p className="text-xs text-muted-foreground mt-3" data-testid="text-atualizado">
          Atualizado {formatarData(updated_at)}
        </p>
      )}
    </div>
  );
}
