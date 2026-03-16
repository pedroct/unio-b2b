import { HeartPulse, Activity, Moon, Dumbbell, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  cardiovascular: "Score cardiovascular",
  metabolic: "Score metabólico",
  recovery: "Score recuperação",
  functional: "Score funcional",
};

const ACCENT_BAR_COR: Record<string, string> = {
  cardiovascular: "#4A5899",
  metabolic: "#AD8C48",
  recovery: "#3D7A8C",
  functional: "#648D4A",
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  const agora = new Date();
  const mesmoAno = d.getFullYear() === agora.getFullYear();
  const data = mesmoAno
    ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

const ICONE_TENDENCIA = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const LABEL_TENDENCIA: Record<string, string> = {
  up: "Tendência em alta",
  down: "Tendência em queda",
  stable: "Tendência estável",
};

export function CardScore({ score, classification, tendencia, is_partial = false, updated_at, isLoading, title, pilarTipo = "cardiovascular", tooltip }: CardScoreProps) {
  const Icone = ICONES_PILAR[pilarTipo] ?? HeartPulse;
  const tituloExibido = title ?? TITULOS_PILAR[pilarTipo] ?? "Score";
  const accentCor = ACCENT_BAR_COR[pilarTipo] ?? "#4A5899";

  const cardStyle = {
    background: "#FFFFFF",
    border: "1px solid #E8EBE5",
    borderTop: `3px solid ${accentCor}`,
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(47, 86, 65, 0.06)",
  };

  if (isLoading) {
    return (
      <div className="p-6" style={cardStyle} data-testid="card-score-skeleton">
        <Skeleton className="h-4 w-40 mb-4" />
        <Skeleton className="h-14 w-20 mb-3" />
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-3 w-36" />
      </div>
    );
  }

  if (score === null || classification === null) {
    return (
      <div className="p-6 h-full" style={cardStyle} data-testid={`card-score-insuficiente-${pilarTipo}`}>
        <div className="flex items-start gap-2 mb-4 min-h-[40px]">
          <Icone className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accentCor }} />
          <span className="font-medium leading-tight flex-1" style={{ color: "#8B9286", fontSize: 13 }}>
            {tituloExibido}
          </span>
          {tooltip && <InfoTooltip text={tooltip} side="top" />}
        </div>
        <p className="text-5xl font-bold" style={{ color: "#2F5641", fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)" }}>—</p>
        <p className="text-sm mt-3" style={{ color: "#8B9286" }}>Dados insuficientes para cálculo</p>
      </div>
    );
  }

  const TendenciaIcon = tendencia ? ICONE_TENDENCIA[tendencia] : Minus;
  const tendenciaLabel = tendencia ? LABEL_TENDENCIA[tendencia] : "Tendência estável";

  return (
    <div className="p-6 h-full flex flex-col" style={cardStyle} data-testid={`card-score-${pilarTipo}`}>
      <div className="flex items-start gap-2 mb-4 min-h-[40px]">
        <Icone className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: accentCor }} />
        <span className="font-medium leading-tight flex-1" style={{ color: "#8B9286", fontSize: 13 }}>
          {tituloExibido}
        </span>
        {tooltip && <InfoTooltip text={tooltip} side="top" />}
      </div>

      <p
        className="text-5xl font-bold leading-none"
        style={{ color: "#2F5641", fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)" }}
        data-testid={`text-score-value-${pilarTipo}`}
      >
        {Math.round(score)}
      </p>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span
          className={`score-badge--${classification} inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap`}
          data-testid={`badge-classificacao-${pilarTipo}`}
        >
          {LABELS_CLASSIFICACAO[classification]}
        </span>
      </div>

      {is_partial ? (
        <div className="mt-3" data-testid={`badge-parcial-${pilarTipo}`}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#D9A441" }}>Dados parciais</p>
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#8B9286" }}>
            {TendenciaIcon && <TendenciaIcon className="h-3.5 w-3.5" />}
            {tendenciaLabel}
          </span>
        </div>
      ) : TendenciaIcon ? (
        <span
          className="flex items-center gap-1 text-xs mt-3 whitespace-nowrap"
          style={{ color: "#8B9286" }}
          data-testid={`text-tendencia-${pilarTipo}`}
        >
          <TendenciaIcon className="h-3.5 w-3.5" />
          {tendenciaLabel}
        </span>
      ) : null}

      {updated_at && (
        <p className="text-xs mt-auto pt-3" style={{ color: "#8B9286" }} data-testid={`text-atualizado-${pilarTipo}`}>
          Atualizado em {formatarData(updated_at)}
        </p>
      )}
    </div>
  );
}
