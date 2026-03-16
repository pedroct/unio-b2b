import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { TendenciaBiomarcador } from "@shared/schema";
import { InfoTooltip } from "./info-tooltip";

interface CardBiomarcadorProps {
  nome: string;
  valor: number | null;
  valorFormatado?: string | null;
  unidade: string;
  tendencia: TendenciaBiomarcador;
  baseline?: number;
  invertedSemantics?: boolean;
  labelSecundario?: string;
  sparklineData?: number[];
  aguardandoLeitura?: boolean;
  tooltip?: string;
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
  if (!tendencia || tendencia === "stable") return "#8B9286";
  const positivo = invertedSemantics ? tendencia === "down" : tendencia === "up";
  return positivo ? "#4CA785" : "#D97952";
}

function copyTendencia(tendencia: TendenciaBiomarcador, diff: number | null, unidade: string, invertedSemantics: boolean): string {
  if (!tendencia || tendencia === "stable") return "Estável";
  const sinal = diff !== null && diff > 0 ? "+" : "";
  const diffStr = diff !== null ? ` ${sinal}${diff} ${unidade}` : "";
  if (tendencia === "up") return `Em alta${diffStr}`;
  return `Em queda${diffStr}`;
}

function SparklineMini({ data, cor }: { data: number[]; cor: string }) {
  const pts = data.map((v, i) => ({ v, i }));
  return (
    <div className="mt-2 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`sg-${cor.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={cor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={cor} strokeWidth={1.5} dot={false} fill={`url(#sg-${cor.replace(/[^a-z]/gi, "")})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function corSparkline(tendencia: TendenciaBiomarcador, invertedSemantics: boolean): string {
  if (!tendencia || tendencia === "stable") return "#8B9286";
  const positivo = invertedSemantics ? tendencia === "down" : tendencia === "up";
  return positivo ? "#4CA785" : "#D97952";
}

export function CardBiomarcador({
  nome,
  valor,
  valorFormatado,
  unidade,
  tendencia,
  baseline,
  invertedSemantics = false,
  labelSecundario,
  sparklineData,
  aguardandoLeitura = false,
  tooltip,
}: CardBiomarcadorProps) {
  const insuficiente = valor === null || aguardandoLeitura;
  const IconeTendencia = tendencia ? ICONE_TENDENCIA[tendencia] : null;
  const diff = calcularDiff(valor, baseline);
  const cor = corTendencia(tendencia, invertedSemantics);
  const copy = copyTendencia(tendencia, diff, unidade, invertedSemantics);

  return (
    <div
      className="rounded-xl p-4 transition-all duration-150"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8EBE5",
        boxShadow: "0 1px 3px rgba(47, 86, 65, 0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(74, 88, 153, 0.3)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(47, 86, 65, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E8EBE5";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(47, 86, 65, 0.06)";
      }}
      data-testid={`card-biomarcador-${nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
    >
      <div className="flex items-center gap-1 mb-2">
        <p className="text-sm font-semibold flex-1" style={{ color: "#2F5641" }}>
          {nome}
        </p>
        {tooltip && <InfoTooltip text={tooltip} side="top" />}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="font-bold"
          style={{
            fontSize: 28,
            color: insuficiente ? "#8B9286" : "#2F5641",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {insuficiente ? "—" : (valorFormatado || valor)}
        </span>
        {!insuficiente && !valorFormatado && (
          <span className="text-sm" style={{ color: "#8B9286" }}>{unidade}</span>
        )}
      </div>

      {insuficiente ? (
        <p className="text-xs mt-2" style={{ color: "#8B9286" }}>{aguardandoLeitura ? "Aguardando leitura" : "Dados insuficientes"}</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {IconeTendencia && (
            <span className="flex items-center gap-1" style={{ color: cor, fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
              <IconeTendencia className="h-3.5 w-3.5" />
              {copy}
            </span>
          )}
          {labelSecundario && (
            <p style={{ fontSize: 11, color: "#8B9286", fontFamily: "'Inter', sans-serif" }}>{labelSecundario}</p>
          )}
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && !insuficiente && (
        <SparklineMini data={sparklineData} cor={corSparkline(tendencia, invertedSemantics)} />
      )}
    </div>
  );
}

export interface BiomarcadorItem {
  key: string;
  nome: string;
  value: number | null;
  valorFormatado?: string | null;
  unit: string;
  trend: TendenciaBiomarcador;
  baseline?: number;
  referencia?: string;
  invertedSemantics?: boolean;
  formatValue?: (v: number) => string;
  tooltip?: string;
}

interface GradeGenericaProps {
  items: BiomarcadorItem[];
  testId?: string;
}

export function GradeGenerica({ items, testId = "grade-biomarcadores" }: GradeGenericaProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid={testId}>
      {items.map((item) => (
        <CardBiomarcador
          key={item.key}
          nome={item.nome}
          valor={item.value}
          valorFormatado={item.valorFormatado}
          unidade={item.unit}
          tendencia={item.trend}
          baseline={item.baseline}
          invertedSemantics={item.invertedSemantics}
          labelSecundario={item.referencia}
          aguardandoLeitura={item.value === null}
          tooltip={item.tooltip}
        />
      ))}
    </div>
  );
}
