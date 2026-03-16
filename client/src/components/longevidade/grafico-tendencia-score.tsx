import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaHistoricoScores } from "@shared/schema";

interface GraficoTendenciaScoreProps {
  pacienteId: string;
}

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatarData30d(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

function formatarData90d(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const mes = parseInt(parts[1], 10) - 1;
  return `${parseInt(parts[2], 10)} ${MESES_CURTOS[mes] ?? parts[1]}`;
}

function formatarData365d(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 2) return dateStr;
  const mes = parseInt(parts[1], 10) - 1;
  const ano = parts[0].slice(2);
  return `${MESES_CURTOS[mes] ?? parts[1]} ${ano}`;
}

function getTickFormatter(intervalo: string) {
  if (intervalo === "365d") return formatarData365d;
  if (intervalo === "90d") return formatarData90d;
  return formatarData30d;
}

interface ChartPoint {
  data: string;
  cardiovascular: number | undefined;
  metabolico: number | undefined;
  recuperacao: number | undefined;
  funcional: number | undefined;
}

const PILAR_KEYS: Array<"cardiovascular" | "metabolico" | "recuperacao" | "funcional"> = ["cardiovascular", "metabolico", "recuperacao", "funcional"];

function isoWeekKey(dateStr: string): string {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function aggregateWeekly(points: ChartPoint[]): ChartPoint[] {
  const weeks = new Map<string, { points: ChartPoint[]; lastDate: string }>();

  for (const pt of points) {
    const wk = isoWeekKey(pt.data);
    const entry = weeks.get(wk);
    if (entry) {
      entry.points.push(pt);
      if (pt.data > entry.lastDate) entry.lastDate = pt.data;
    } else {
      weeks.set(wk, { points: [pt], lastDate: pt.data });
    }
  }

  const result: ChartPoint[] = [];
  for (const [, { points: wkPts, lastDate }] of weeks) {
    const agg: ChartPoint = { data: lastDate, cardiovascular: undefined, metabolico: undefined, recuperacao: undefined, funcional: undefined };
    for (const key of PILAR_KEYS) {
      const vals = wkPts.map(p => p[key]).filter((v): v is number => v !== undefined);
      if (vals.length > 0) {
        agg[key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
      }
    }
    result.push(agg);
  }

  result.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  return result;
}

interface PilarConfig {
  key: "cardiovascular" | "metabolico" | "recuperacao" | "funcional";
  label: string;
  color: string;
}

const PILARES_CHART: PilarConfig[] = [
  { key: "cardiovascular", label: "Cardiovascular", color: "#4A5899" },
  { key: "metabolico",     label: "Metabólico",     color: "#AD8C48" },
  { key: "recuperacao",    label: "Recuperação",     color: "#3D7A8C" },
  { key: "funcional",      label: "Funcional",       color: "#648D4A" },
];

function classificarScore(valor: number): string {
  if (valor >= 80) return "Excelente";
  if (valor >= 60) return "Bom";
  if (valor >= 40) return "Atenção";
  return "Risco Aumentado";
}

function MultiTooltip({ active, payload, label, intervalo }: any) {
  if (!active || !payload?.length) return null;
  const validPayloads = payload.filter((p: any) => p.value != null);
  if (validPayloads.length === 0) return null;

  const formatter = getTickFormatter(intervalo === "365d" ? "90d" : "30d");

  return (
    <div className="rounded-lg px-3 py-2 text-sm shadow-lg" style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}>
      <p className="text-xs text-muted-foreground mb-1">{formatter(label)}</p>
      {validPayloads.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-xs" style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-bold text-xs" style={{ color: "var(--mod-longevidade-text)" }}>{entry.value.toFixed(1)}</span>
          <span className="text-[10px] text-muted-foreground">{classificarScore(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

const PERIODOS = [
  { intervalo: "30d", label: "30 dias" },
  { intervalo: "90d", label: "90 dias" },
  { intervalo: "365d", label: "365 dias" },
];

function computeTickInterval(dataLength: number, intervalo: string): number {
  if (intervalo === "365d") {
    return dataLength > 12 ? Math.floor(dataLength / 12) : 0;
  }
  if (intervalo === "90d") {
    return dataLength > 6 ? Math.floor(dataLength / 6) : 0;
  }
  return dataLength > 7 ? Math.floor(dataLength / 7) : 0;
}

export function GraficoTendenciaScore({ pacienteId }: GraficoTendenciaScoreProps) {
  const [intervalo, setIntervalo] = useState("30d");

  const { data: resposta, isLoading } = useQuery<RespostaHistoricoScores>({
    queryKey: [`/api/painel-longevidade/clientes/${pacienteId}/historico-scores?intervalo=${intervalo}`],
    enabled: !!pacienteId,
  });

  const rawData = useMemo<ChartPoint[]>(() => {
    if (!resposta?.historico) return [];
    return resposta.historico
      .filter(p => p.cardiovascular != null || p.metabolico != null || p.recuperacao != null || p.funcional != null)
      .map(p => ({
        data: p.data,
        cardiovascular: p.cardiovascular ?? undefined,
        metabolico: p.metabolico ?? undefined,
        recuperacao: p.recuperacao ?? undefined,
        funcional: p.funcional ?? undefined,
      }));
  }, [resposta]);

  const chartData = useMemo(() => {
    if (intervalo === "365d" && rawData.length > 60) {
      return aggregateWeekly(rawData);
    }
    return rawData;
  }, [rawData, intervalo]);

  const activePilares = useMemo(() => {
    return PILARES_CHART.filter(pc =>
      chartData.some(d => d[pc.key] !== undefined)
    );
  }, [chartData]);

  const xInterval = computeTickInterval(chartData.length, intervalo);
  const showLegend = activePilares.length > 1;
  const tickFormatter = getTickFormatter(intervalo);

  return (
    <div data-testid="grafico-tendencia-score">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
          Tendência dos scores
        </h3>
        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.intervalo}
              onClick={() => setIntervalo(p.intervalo)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: intervalo === p.intervalo ? "#4A5899" : "transparent",
                color: intervalo === p.intervalo ? "#fff" : "#8B9286",
                border: intervalo === p.intervalo ? "none" : "1px solid #D4D9D0",
              }}
              data-testid={`button-periodo-${p.intervalo}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : chartData.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              {activePilares.map(pc => (
                <linearGradient key={`grad-${pc.key}`} id={`gradiente-${pc.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={pc.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={pc.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="data"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <ReferenceArea y1={80} y2={100} fill="#4CA785" fillOpacity={0.04} />
            <ReferenceArea y1={60} y2={80} fill="#4A5899" fillOpacity={0.04} />
            <ReferenceArea y1={40} y2={60} fill="#D9A441" fillOpacity={0.04} />
            <ReferenceArea y1={0}  y2={40} fill="#D97952" fillOpacity={0.04} />
            <Tooltip content={<MultiTooltip intervalo={intervalo} />} />
            <ReferenceLine y={80} stroke="#4CA785" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={60} stroke="#4A5899" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={40} stroke="#D9A441" strokeDasharray="4 4" strokeOpacity={0.3} />
            {activePilares.map(pc => (
              <Area
                key={pc.key}
                type="monotone"
                dataKey={pc.key}
                name={pc.label}
                stroke={pc.color}
                strokeWidth={2}
                fill={`url(#gradiente-${pc.key})`}
                dot={false}
                activeDot={{ r: 4, fill: pc.color, stroke: "#fff", strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: "#5F6B5A" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Sem dados de tendência disponíveis
        </div>
      )}
    </div>
  );
}
