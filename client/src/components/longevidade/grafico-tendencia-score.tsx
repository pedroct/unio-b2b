import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaHistoricoScores } from "@shared/schema";

interface GraficoTendenciaScoreProps {
  pacienteId: string;
}

function formatarDataCurta(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

interface PilarConfig {
  key: "cardiovascular" | "metabolico" | "recuperacao";
  label: string;
  color: string;
}

const PILARES_CHART: PilarConfig[] = [
  { key: "cardiovascular", label: "Cardiovascular", color: "#4A5899" },
  { key: "metabolico", label: "Metabólico", color: "#5B8C6F" },
  { key: "recuperacao", label: "Recuperação", color: "#3D7A8C" },
];

function classificarScore(valor: number): string {
  if (valor >= 80) return "Excelente";
  if (valor >= 60) return "Bom";
  if (valor >= 40) return "Atenção";
  return "Risco Aumentado";
}

function MultiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const validPayloads = payload.filter((p: any) => p.value != null);
  if (validPayloads.length === 0) return null;

  return (
    <div className="rounded-lg px-3 py-2 text-sm shadow-lg" style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}>
      <p className="text-xs text-muted-foreground mb-1">{formatarDataCurta(label)}</p>
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

export function GraficoTendenciaScore({ pacienteId }: GraficoTendenciaScoreProps) {
  const [intervalo, setIntervalo] = useState("30d");

  const { data: resposta, isLoading } = useQuery<RespostaHistoricoScores>({
    queryKey: [`/api/painel-longevidade/clientes/${pacienteId}/historico-scores?intervalo=${intervalo}`],
    enabled: !!pacienteId,
  });

  const chartData = useMemo(() => {
    if (!resposta?.historico) return [];
    return resposta.historico
      .filter(p => p.cardiovascular != null || p.metabolico != null || p.recuperacao != null)
      .map(p => ({
        data: p.data,
        cardiovascular: p.cardiovascular ?? undefined,
        metabolico: p.metabolico ?? undefined,
        recuperacao: p.recuperacao ?? undefined,
      }));
  }, [resposta]);

  const activePilares = useMemo(() => {
    return PILARES_CHART.filter(pc =>
      chartData.some(d => (d as any)[pc.key] !== undefined)
    );
  }, [chartData]);

  const xInterval = chartData.length > 7 ? Math.floor(chartData.length / 7) : 1;
  const showLegend = activePilares.length > 1;

  return (
    <div data-testid="grafico-tendencia-score">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
          Tendência do Score
        </h3>
        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.intervalo}
              onClick={() => setIntervalo(p.intervalo)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: intervalo === p.intervalo ? "var(--mod-longevidade-base)" : "transparent",
                color: intervalo === p.intervalo ? "#fff" : "var(--sys-text-muted)",
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
                  <stop offset="0%" stopColor={pc.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={pc.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="data"
              tickFormatter={formatarDataCurta}
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
            <ReferenceArea y1={80} y2={100} fill="var(--score-excellent-bg)" fillOpacity={0.5} />
            <ReferenceArea y1={60} y2={80} fill="var(--score-good-bg)" fillOpacity={0.5} />
            <ReferenceArea y1={40} y2={60} fill="var(--score-attention-bg)" fillOpacity={0.5} />
            <ReferenceArea y1={0} y2={40} fill="var(--score-risk-bg)" fillOpacity={0.5} />
            <Tooltip content={<MultiTooltip />} />
            <ReferenceLine y={80} stroke="var(--score-excellent-border)" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={60} stroke="var(--score-good-border)" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={40} stroke="var(--score-attention-border)" strokeDasharray="4 4" strokeOpacity={0.3} />
            {activePilares.map((pc, idx) => (
              <Area
                key={pc.key}
                type="monotone"
                dataKey={pc.key}
                name={pc.label}
                stroke={pc.color}
                strokeWidth={idx === 0 ? 2 : 1.5}
                fill={`url(#gradiente-${pc.key})`}
                dot={false}
                activeDot={{ r: 4, fill: pc.color, stroke: "#fff", strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
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
