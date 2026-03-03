import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaTendenciaScore } from "@shared/schema";

interface GraficoTendenciaScoreProps {
  pacienteId: string;
}

function formatarDataCurta(dateStr: string): string {
  const [, mes, dia] = dateStr.split("-");
  return `${dia}/${mes}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const valor = payload[0].value;
  let classificacao = "Risco Aumentado";
  if (valor >= 80) classificacao = "Excelente";
  else if (valor >= 60) classificacao = "Bom";
  else if (valor >= 40) classificacao = "Atenção";

  return (
    <div className="rounded-lg px-3 py-2 text-sm shadow-lg" style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}>
      <p className="text-xs text-muted-foreground">{formatarDataCurta(label)}</p>
      <p className="font-bold" style={{ color: "var(--mod-longevidade-text)" }}>{valor.toFixed(1)}</p>
      <p className="text-xs" style={{ color: "var(--mod-longevidade-icon)" }}>{classificacao}</p>
    </div>
  );
}

const PERIODOS = [
  { value: "30d" as const, label: "30 dias" },
  { value: "90d" as const, label: "90 dias" },
  { value: "365d" as const, label: "365 dias" },
];

export function GraficoTendenciaScore({ pacienteId }: GraficoTendenciaScoreProps) {
  const [periodo, setPeriodo] = useState<"30d" | "90d" | "365d">("30d");

  const { data, isLoading } = useQuery<RespostaTendenciaScore>({
    queryKey: [`/api/profissional/dashboard/pacientes/${pacienteId}/cardiovascular-score/tendencia?periodo=${periodo}`],
    enabled: !!pacienteId,
  });

  const xInterval = periodo === "365d" ? 50 : periodo === "90d" ? 13 : 4;

  return (
    <div data-testid="grafico-tendencia-score">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
          Tendência do Score
        </h3>
        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: periodo === p.value ? "var(--mod-longevidade-base)" : "transparent",
                color: periodo === p.value ? "#fff" : "var(--sys-text-muted)",
              }}
              data-testid={`button-periodo-${p.value}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : data?.data?.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="gradienteScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mod-longevidade-base)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--mod-longevidade-base)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
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
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={80} stroke="var(--score-excellent-border)" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={60} stroke="var(--score-good-border)" strokeDasharray="4 4" strokeOpacity={0.3} />
            <ReferenceLine y={40} stroke="var(--score-attention-border)" strokeDasharray="4 4" strokeOpacity={0.3} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--mod-longevidade-base)"
              strokeWidth={2}
              fill="url(#gradienteScore)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--mod-longevidade-base)", stroke: "#fff", strokeWidth: 2 }}
            />
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
