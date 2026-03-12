import { HeartPulse, Activity, Moon, Dumbbell, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassificacaoScore, TendenciaBiomarcador } from "@shared/schema";
import { LABELS_CLASSIFICACAO } from "@shared/schema";
import { InfoTooltip } from "./info-tooltip";

interface CardScoreProps {
  score: number | null;
  classification: ClassificacaoScore | null;
  tendencia: TendenciaBiomarcador;
  is_partial?: boolean;
  updated_at: string | null;
  isLoading?: boolean;
  title?: string;
  pilarTipo?: string;
  tooltip?: string;
}

const ICONES_PILAR: Record<string, typeof HeartPulse> = {
  cardiovascular: HeartPulse,
  metabolic: Activity,
  recovery: Moon,
  functional: Dumbbell,
};

const TITULOS_PILAR: Record<string, string> = {
  cardiovascular: "Score Cardiovascular",
  metabolic: "Score Metabólico",
  recovery: "Score Recuperação",
  functional: "Score Funcional",
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

const ICONE_TENDENCIA = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function CardScore({ score, classification, tendencia, is_partial = false, updated_at, isLoading, title, pilarTipo = "cardiovascular", tooltip }: CardScoreProps) {
  const Icone = ICONES_PILAR[pilarTipo] ?? HeartPulse;
  const tituloExibido = title ?? TITULOS_PILAR[pilarTipo] ?? "Score";

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
        className="rounded-xl p-6 h-full"
        style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
        data-testid={`card-score-insuficiente-${pilarTipo}`}
      >
        <div className="flex items-start gap-2 mb-4 min-h-[40px]">
          <Icone className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "var(--mod-longevidade-icon)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider leading-tight flex-1" style={{ color: "var(--mod-longevidade-text)" }}>
            {tituloExibido}
          </span>
          {tooltip && <InfoTooltip text={tooltip} side="top" />}
        </div>
        <p className="text-5xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>—</p>
        <p className="text-sm mt-3 text-muted-foreground">Dados insuficientes para cálculo</p>
      </div>
    );
  }

  const TendenciaIcon = tendencia ? ICONE_TENDENCIA[tendencia] : null;

  return (
    <div
      className="rounded-xl p-6 h-full flex flex-col"
      style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
      data-testid={`card-score-${pilarTipo}`}
    >
      <div className="flex items-start gap-2 mb-4 min-h-[40px]">
        <Icone className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "var(--mod-longevidade-icon)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider leading-tight flex-1" style={{ color: "var(--mod-longevidade-text)" }}>
          {tituloExibido}
        </span>
        {tooltip && <InfoTooltip text={tooltip} side="top" />}
      </div>

      <p className="text-5xl font-bold leading-none" style={{ color: "var(--mod-longevidade-text)" }} data-testid={`text-score-value-${pilarTipo}`}>
        {Math.round(score)}
      </p>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span
          className={`score-badge--${classification} inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap`}
          data-testid={`badge-classificacao-${pilarTipo}`}
        >
          {LABELS_CLASSIFICACAO[classification]}
        </span>

        {is_partial && (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
            style={{ background: "var(--score-attention-bg)", color: "var(--score-attention-icon)" }}
            data-testid={`badge-parcial-${pilarTipo}`}
          >
            <AlertTriangle className="h-3 w-3" />
            Score parcial
          </span>
        )}

        {TendenciaIcon && (
          <span className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: `var(--score-${classification}-icon)` }} data-testid={`text-tendencia-${pilarTipo}`}>
            <TendenciaIcon className="h-3.5 w-3.5" />
            {tendencia === "up" ? "Em alta" : tendencia === "down" ? "Em queda" : "Estável"}
          </span>
        )}
      </div>

      {updated_at && (
        <p className="text-xs text-muted-foreground mt-auto pt-3" data-testid={`text-atualizado-${pilarTipo}`}>
          Atualizado {formatarData(updated_at)}
        </p>
      )}
    </div>
  );
}
