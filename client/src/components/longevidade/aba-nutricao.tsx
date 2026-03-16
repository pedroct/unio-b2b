import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, X, Utensils, TrendingUp, ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea,
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar,
  ComposedChart,
} from "recharts";
import { InfoTooltip } from "./info-tooltip";
import { TOOLTIPS_COMPONENTES } from "./tooltips-longevidade";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { RespostaNutricao, NutricaoAlerta, NutricaoRegistroDia, NutricaoGlicemia, NutricaoComposicaoCorporal } from "@shared/schema";

interface AbaNutricaoProps {
  pacienteId: string;
}

type Periodo = "7" | "30" | "90";

const BADGE_PROTEINA: { min: number; max: number; label: string; style: { background: string; color: string } }[] = [
  { min: 0,   max: 1.2, label: "Insuficiente", style: { background: "rgba(217,121,82,0.12)",  color: "#D97952" } },
  { min: 1.2, max: 1.6, label: "Subótimo",     style: { background: "rgba(217,164,65,0.12)",  color: "#D9A441" } },
  { min: 1.6, max: 2.2, label: "Adequado",     style: { background: "rgba(76,167,133,0.12)",  color: "#4CA785" } },
  { min: 2.2, max: 3.0, label: "Elevado",      style: { background: "rgba(217,164,65,0.12)",  color: "#D9A441" } },
  { min: 3.0, max: 999, label: "Excessivo",    style: { background: "rgba(217,121,82,0.12)",  color: "#D97952" } },
];

function classifyProteina(valor: number | null) {
  if (valor === null) return null;
  return BADGE_PROTEINA.find(b => valor >= b.min && valor < b.max) ?? BADGE_PROTEINA[BADGE_PROTEINA.length - 1];
}

function statusAderencia(pct: number | null): { label: string; style: { background: string; color: string } } | null {
  if (pct === null) return null;
  if (pct > 110) return  { label: "Excedente", style: { background: "rgba(217,164,65,0.12)",  color: "#D9A441" } };
  if (pct >= 90) return  { label: "Ideal",     style: { background: "rgba(76,167,133,0.12)",  color: "#4CA785" } };
  if (pct >= 70) return  { label: "Moderada",  style: { background: "rgba(217,164,65,0.12)",  color: "#D9A441" } };
  return                 { label: "Baixa",     style: { background: "rgba(217,121,82,0.12)",  color: "#D97952" } };
}

function fmtDate(iso: string) {
  return iso.slice(8, 10) + "/" + iso.slice(5, 7);
}

const URGENCIA_STYLE: Record<NutricaoAlerta["urgencia"], { icon: typeof AlertTriangle; border: string; bg: string; iconColor: string }> = {
  alta:        { icon: AlertTriangle, border: "border-red-300 dark:border-red-700",    bg: "bg-red-50 dark:bg-red-950/30",    iconColor: "text-red-500" },
  media:       { icon: AlertTriangle, border: "border-yellow-300 dark:border-yellow-700", bg: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-500" },
  informativo: { icon: Info,          border: "border-blue-200 dark:border-blue-800",   bg: "bg-blue-50 dark:bg-blue-950/30",   iconColor: "text-blue-500" },
};

function CardResumo({ title, children, tooltip }: { title: string; children: ReactNode; tooltip?: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8EBE5",
        boxShadow: "0 1px 3px rgba(47,86,65,0.06)",
      }}
    >
      <div style={{ height: 3, background: "#4A5899", borderRadius: "12px 12px 0 0" }} />
      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <p className="flex-1" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: "#2F5641" }}>
            {title}
          </p>
          {tooltip && <InfoTooltip text={tooltip} side="top" />}
        </div>
        {children}
      </div>
    </div>
  );
}

const MACRO_COLORS = { proteina: "#648D4A", carbo: "#AD8C48", gordura: "#D97952" };

function MacroDonut({ proteina, carbo, gordura }: { proteina: number | null; carbo: number | null; gordura: number | null }) {
  const p = proteina ?? 0;
  const c = carbo ?? 0;
  const g = gordura ?? 0;
  const total = p + c + g;
  if (total === 0) {
    return <p className="text-xs" style={{ color: "var(--sys-text-muted)" }}>Sem dados no período</p>;
  }
  const segments = [
    { name: "Proteína", value: p, color: MACRO_COLORS.proteina },
    { name: "Carbo",    value: c, color: MACRO_COLORS.carbo },
    { name: "Gordura",  value: g, color: MACRO_COLORS.gordura },
  ];
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 64, height: 64, flex: "0 0 64px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={18}
              outerRadius={30}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {segments.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-0.5 flex-1 min-w-0">
        {segments.map(s => (
          <span key={s.name} className="flex items-center gap-1" style={{ color: "#5F6B5A", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
            <span className="inline-block flex-shrink-0" style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
            {s.name} {Math.round(s.value)}%
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ registros }: { registros: NutricaoRegistroDia[] }) {
  const dados = registros.slice(-14).map(r => ({ v: r.aderencia_calorica_pct }));
  if (dados.length === 0) return null;
  return (
    <div style={{ height: 32, marginTop: 6 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <ReferenceLine y={70} stroke="rgba(245,158,11,0.45)" strokeDasharray="2 2" />
          <ReferenceLine y={90} stroke="rgba(34,197,94,0.3)" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="v"
            stroke="var(--mod-longevidade-base)"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TabelaRegistros({ registros }: { registros: NutricaoRegistroDia[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const ordenado = [...registros].reverse();

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--mod-longevidade-border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr style={{ background: "#F5F3EE", borderBottom: "2px solid #E8EBE5" }}>
              {["Data", "Calorias", "Proteína", "g/kg", "Aderência", "Status"].map(h => (
                <th
                  key={h}
                  className={`px-3 py-2 ${h === "Data" ? "text-left" : "text-right last:text-center"}`}
                  style={{ color: "#8B9286", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenado.map(r => {
              const semRegistros = r.refeicoes_registradas === 0;
              const badge = statusAderencia(r.aderencia_calorica_pct);
              const isOpen = expanded === r.data;

              return (
                <Fragment key={r.data}>
                  <tr
                    onClick={() => !semRegistros && setExpanded(isOpen ? null : r.data)}
                    className={`border-t transition-colors ${
                      semRegistros
                        ? "opacity-40 cursor-default"
                        : "cursor-pointer hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)]"
                    }`}
                    style={{ borderColor: "var(--mod-longevidade-border)" }}
                    data-testid={`row-registro-${r.data}`}
                  >
                    <td className="px-3 py-2 font-medium flex items-center gap-1" style={{ color: "var(--sys-text-primary)" }}>
                      {!semRegistros && (
                        isOpen
                          ? <ChevronDown className="h-3 w-3 flex-shrink-0" style={{ color: "var(--sys-text-muted)" }} />
                          : <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: "var(--sys-text-muted)" }} />
                      )}
                      {fmtDate(r.data)}
                      {semRegistros && (
                        <span className="ml-1 text-[10px]" style={{ color: "var(--sys-text-muted)" }}>Sem registros</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                      {semRegistros ? "—" : `${Math.round(r.calorias_consumidas).toLocaleString("pt-BR")} kcal`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                      {semRegistros ? "—" : `${Math.round(r.macros.proteina_g)} g`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: classifyProteina(r.proteina_relativa_g_kg)?.style.color ?? "var(--sys-text-secondary)" }}>
                      {r.proteina_relativa_g_kg !== null ? r.proteina_relativa_g_kg.toFixed(2).replace(".", ",") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                      {r.aderencia_calorica_pct !== null ? `${Math.round(r.aderencia_calorica_pct)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {badge ? (
                        <span style={{ ...badge.style, fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "3px 10px", borderRadius: 9999, display: "inline-block" }}>
                          {badge.label}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                  {isOpen && !semRegistros && (
                    <tr
                      style={{
                        background: "var(--mod-longevidade-bg-subtle)",
                        borderColor: "var(--mod-longevidade-border)",
                      }}
                      className="border-t"
                    >
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex gap-6 flex-wrap" style={{ color: "var(--sys-text-secondary)" }}>
                          <span><span style={{ color: "var(--sys-text-muted)" }}>Registros alimentares:</span> {r.refeicoes_registradas}</span>
                          {r.meta_calorica !== null && (
                            <span><span style={{ color: "var(--sys-text-muted)" }}>Meta calórica:</span> {Math.round(r.meta_calorica)} kcal</span>
                          )}
                          <span><span style={{ color: "var(--sys-text-muted)" }}>Carbo:</span> {Math.round(r.macros.carboidrato_g)} g</span>
                          <span><span style={{ color: "var(--sys-text-muted)" }}>Gordura:</span> {Math.round(r.macros.gordura_g)} g</span>
                          {r.peso_kg_referencia !== null && (
                            <span><span style={{ color: "var(--sys-text-muted)" }}>Peso ref.:</span> {r.peso_kg_referencia.toFixed(1)} kg</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CorrelacaoCaloriasVsMeta({ registros }: { registros: NutricaoRegistroDia[] }) {
  const comMeta = registros.filter(r => r.meta_calorica !== null && r.calorias_consumidas > 0);
  if (comMeta.length === 0) {
    return (
      <p className="text-xs text-center py-6" style={{ color: "var(--sys-text-muted)" }}>
        Sem dados suficientes para exibir a correlação.
      </p>
    );
  }
  const dados = comMeta.map(r => ({
    data: fmtDate(r.data),
    aderencia: r.aderencia_calorica_pct !== null ? Math.round(r.aderencia_calorica_pct) : null,
    cor: (r.aderencia_calorica_pct ?? 0) >= 90 ? "#4CA785" : (r.aderencia_calorica_pct ?? 0) >= 70 ? "#D9A441" : "#D97952",
  }));
  return (
    <div style={{ height: 130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={12}>
          <XAxis dataKey="data" tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }} unit="%" />
          <ReferenceLine y={70} stroke="rgba(245,158,11,0.5)" strokeDasharray="3 3" />
          <ReferenceLine y={90} stroke="rgba(34,197,94,0.4)" strokeDasharray="3 3" />
          <RechartsTooltip
            formatter={(v: number) => [`${v}%`, "Aderência calórica"]}
            labelStyle={{ color: "var(--sys-text-primary)", fontSize: 11, fontWeight: 600 }}
            contentStyle={{
              background: "var(--sys-bg-primary)",
              border: "1px solid var(--mod-longevidade-border)",
              borderRadius: 6,
              fontSize: 11,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
            itemStyle={{ color: "var(--sys-text-secondary)" }}
          />
          <Bar dataKey="aderencia" radius={[2, 2, 0, 0]}>
            {dados.map((d, i) => <Cell key={i} fill={d.cor} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const GLICEMIA_ZONAS = [
  { y1: 0,   y2: 100, fill: "rgba(76,167,133,0.07)",  label: "Normal (< 100 mg/dL)",       cor: "#4CA785" },
  { y1: 100, y2: 125, fill: "rgba(217,164,65,0.07)",  label: "Elevado (100–125 mg/dL)",    cor: "#D9A441" },
  { y1: 125, y2: 300, fill: "rgba(217,121,82,0.07)",  label: "Alto (> 125 mg/dL)",         cor: "#D97952" },
];

function GlicemiaCorrelacaoChart({ glicemia }: { glicemia: NutricaoGlicemia }) {
  if (!glicemia.disponivel) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <GitBranch className="h-5 w-5" style={{ color: "var(--sys-text-muted)" }} />
        <p className="text-[10px] text-center" style={{ color: "var(--sys-text-muted)" }}>
          Disponível quando dados de glicemia estiverem sincronizados via Apple Health.
        </p>
      </div>
    );
  }

  const leiturasByDay: Record<string, number[]> = {};
  for (const l of glicemia.leituras) {
    const date = new Date(l.timestamp).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    if (!leiturasByDay[date]) leiturasByDay[date] = [];
    leiturasByDay[date].push(l.glicose_mg_dl);
  }

  const mediasDiarias = Object.entries(leiturasByDay).map(([data, vals]) => ({
    data,
    glicemia_media: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
  })).sort((a, b) => a.data.localeCompare(b.data));

  const dadosCorrelacao = mediasDiarias.map(({ data, glicemia_media }) => {
    const carbs = glicemia.carboidratos_periodo.find(c => c.data === data);
    return {
      label: fmtDate(data),
      glicemia: glicemia_media,
      carboidratos: carbs?.carboidrato_g !== undefined ? Math.round(carbs.carboidrato_g) : null,
    };
  });

  if (dadosCorrelacao.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--sys-text-muted)" }}>
        Sem dados suficientes para exibir correlação.
      </p>
    );
  }

  const maxCarbs = Math.max(200, ...dadosCorrelacao.map(d => d.carboidratos ?? 0)) + 50;
  const glicemiaVals = dadosCorrelacao.map(d => d.glicemia);
  const minGlic = Math.max(40, Math.min(...glicemiaVals) - 10);
  const maxGlic = Math.min(300, Math.max(...glicemiaVals) + 20);

  const TOOLTIP_STYLE = {
    background: "var(--sys-bg-primary)",
    border: "1px solid var(--mod-longevidade-border)",
    borderRadius: 6,
    fontSize: 11,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Média", value: glicemia.media_mg_dl, unit: "mg/dL" },
          { label: "Mínima", value: glicemia.minima_mg_dl, unit: "mg/dL" },
          { label: "Máxima", value: glicemia.maxima_mg_dl, unit: "mg/dL" },
          { label: "Leituras", value: glicemia.total_leituras, unit: "" },
        ].map(c => (
          <div key={c.label} className="text-center rounded-md p-2" style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}>
            <p className="text-[9px]" style={{ color: "var(--sys-text-muted)" }}>{c.label}</p>
            <p className="text-sm font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
              {c.value !== null ? c.value : "—"}
            </p>
            {c.unit && <p className="text-[9px]" style={{ color: "var(--sys-text-muted)" }}>{c.unit}</p>}
          </div>
        ))}
      </div>

      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dadosCorrelacao} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            {GLICEMIA_ZONAS.map(z => (
              <ReferenceArea
                key={z.label}
                yAxisId="left"
                y1={Math.max(z.y1, minGlic)}
                y2={Math.min(z.y2, maxGlic)}
                fill={z.fill}
              />
            ))}
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }} interval="preserveStartEnd" />
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[minGlic, maxGlic]}
              tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }}
              unit=" mg"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, maxCarbs]}
              tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }}
              unit=" g"
            />
            <RechartsTooltip
              labelStyle={{ color: "var(--sys-text-primary)", fontSize: 11, fontWeight: 600 }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--sys-text-secondary)" }}
              formatter={(v: number, name: string) =>
                name === "glicemia"
                  ? [`${v} mg/dL`, "Glicemia média"]
                  : [`${v} g`, "Carboidratos"]
              }
            />
            <Bar yAxisId="right" dataKey="carboidratos" fill="#AD8C48" fillOpacity={0.45} radius={[2, 2, 0, 0]} barSize={10} name="carboidratos" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="glicemia"
              stroke="#4A5899"
              strokeWidth={2}
              dot={(props: { cx: number; cy: number; value: number }) => {
                const { cx, cy, value } = props;
                const cor = value < 100 ? "#4CA785" : value <= 125 ? "#D9A441" : "#D97952";
                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={cor} stroke="none" />;
              }}
              connectNulls={false}
              name="glicemia"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-3 flex-wrap">
        {GLICEMIA_ZONAS.map(z => (
          <span key={z.label} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: z.cor, opacity: 0.85 }} />
            {z.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
          <span className="inline-block w-3 h-1 rounded" style={{ background: "#AD8C48", opacity: 0.7 }} />
          Carboidratos
        </span>
      </div>
    </div>
  );
}

function ComposicaoCorporalChart({ cc }: { cc: NutricaoComposicaoCorporal }) {
  if (!cc.disponivel || (cc.massa_magra_serie.length === 0 && cc.proteina_por_massa_magra_serie.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <TrendingUp className="h-5 w-5" style={{ color: "var(--sys-text-muted)" }} />
        <p className="text-[10px] text-center" style={{ color: "var(--sys-text-muted)" }}>
          Disponível quando dados de composição corporal estiverem sincronizados.
        </p>
      </div>
    );
  }

  const porData: Record<string, { proteina?: number; massaMagra?: number }> = {};
  for (const p of cc.proteina_por_massa_magra_serie) {
    if (!porData[p.data]) porData[p.data] = {};
    porData[p.data].proteina = Math.round(p.proteina_g_por_kg_magra * 100) / 100;
  }
  for (const m of cc.massa_magra_serie) {
    if (!porData[m.data]) porData[m.data] = {};
    porData[m.data].massaMagra = Math.round(m.massa_magra_kg * 10) / 10;
  }

  const entradas = Object.entries(porData).sort(([a], [b]) => a.localeCompare(b));

  if (entradas.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--sys-text-muted)" }}>
        Sem dados suficientes para exibir correlação.
      </p>
    );
  }

  // IQR outlier filter for massa magra (backend may send erroneous sensor readings)
  const allMassVals = entradas.map(([, v]) => v.massaMagra).filter((v): v is number => v !== undefined);
  const sortedMass = [...allMassVals].sort((a, b) => a - b);
  const q1 = sortedMass[Math.floor(sortedMass.length * 0.25)] ?? 0;
  const q3 = sortedMass[Math.floor(sortedMass.length * 0.75)] ?? 0;
  const iqr = q3 - q1;
  const massLow = q1 - 1.5 * iqr;
  const massHigh = q3 + 1.5 * iqr;
  const isOutlier = (v: number) => iqr > 0 && (v < massLow || v > massHigh);

  const dados = entradas.map(([data, v]) => ({
    label: fmtDate(data),
    proteina: v.proteina ?? null,
    massaMagra: (v.massaMagra !== undefined && !isOutlier(v.massaMagra)) ? v.massaMagra : null,
  }));

  const protVals = dados.map(d => d.proteina).filter((v): v is number => v !== null);
  const massVals = dados.map(d => d.massaMagra).filter((v): v is number => v !== null);

  const minProt = Math.max(0, Math.min(...protVals) - 0.3);
  const maxProt = Math.max(3, Math.max(...protVals) + 0.3);
  const minMass = Math.max(0, Math.min(...massVals) - 2);
  const maxMass = Math.max(10, Math.max(...massVals) + 2);

  const TOOLTIP_STYLE = {
    background: "var(--sys-bg-primary)",
    border: "1px solid var(--mod-longevidade-border)",
    borderRadius: 6,
    fontSize: 11,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };

  return (
    <div className="space-y-2">
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 4, right: 40, left: -16, bottom: 0 }}>
            <ReferenceArea yAxisId="left" y1={1.6} y2={2.2} fill="rgba(76,167,133,0.08)" />
            <ReferenceLine yAxisId="left" y={1.6} stroke="rgba(76,167,133,0.5)" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="left" y={2.2} stroke="rgba(76,167,133,0.5)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }} interval="preserveStartEnd" />
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[minProt, maxProt]}
              tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }}
              tickFormatter={(v: number) => v.toFixed(1)}
              unit=" g/kg"
              tickCount={5}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[minMass, maxMass]}
              tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }}
              tickFormatter={(v: number) => Math.round(v).toString()}
              unit=" kg"
              tickCount={4}
            />
            <RechartsTooltip
              labelStyle={{ color: "var(--sys-text-primary)", fontSize: 11, fontWeight: 600 }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--sys-text-secondary)" }}
              formatter={(v: number, name: string) =>
                name === "proteina"
                  ? [`${v.toFixed(2)} g/kg`, "Prot. / kg massa magra"]
                  : [`${v.toFixed(1)} kg`, "Massa magra"]
              }
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="proteina"
              stroke="#648D4A"
              strokeWidth={2}
              dot={{ r: 3, fill: "#648D4A", strokeWidth: 0 }}
              connectNulls={false}
              name="proteina"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="massaMagra"
              stroke="#3D7A8C"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: "#3D7A8C", strokeWidth: 0 }}
              connectNulls={false}
              name="massaMagra"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 flex-wrap">
        <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
          <span className="inline-block w-4 h-0.5 rounded" style={{ background: "#648D4A" }} />
          Proteína / kg massa magra
        </span>
        <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
          <span className="inline-block w-4" style={{ borderTop: "2px dashed #3D7A8C" }} />
          Massa magra
        </span>
        <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
          <span className="inline-block w-3 h-2 rounded-sm" style={{ background: "rgba(76,167,133,0.25)" }} />
          Faixa ideal 1.6–2.2 g/kg
        </span>
      </div>
    </div>
  );
}

const CHART_BANDS = [
  { y1: 0,   y2: 1.2, fill: "rgba(217,121,82,0.06)",  label: "< 1.2" },
  { y1: 1.2, y2: 1.6, fill: "rgba(217,164,65,0.06)",  label: "1.2–1.6" },
  { y1: 1.6, y2: 2.2, fill: "rgba(76,167,133,0.06)",  label: "1.6–2.2" },
  { y1: 2.2, y2: 5.0, fill: "rgba(217,164,65,0.06)",  label: "> 2.2" },
];

function ProteinaChart({ serie }: { serie: { data: string; valor: number | null }[] }) {
  const pontos = serie.filter(p => p.valor !== null);
  if (pontos.length <= 3) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {pontos.map(p => {
          const cls = classifyProteina(p.valor);
          return (
            <div
              key={p.data}
              className="rounded-md p-3 text-center"
              style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
              data-testid={`card-proteina-${p.data}`}
            >
              <p className="text-[10px] mb-1" style={{ color: "var(--sys-text-muted)" }}>{fmtDate(p.data)}</p>
              <p className="text-lg font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
                {p.valor?.toFixed(2)}
              </p>
              <p className="text-[10px]" style={{ color: "var(--sys-text-muted)" }}>g/kg</p>
              {cls && (
                <span style={{ ...cls.style, fontSize: 9, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "2px 6px", borderRadius: 9999, display: "inline-block", marginTop: 4 }}>
                  {cls.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const dados = serie.map(p => ({
    data: fmtDate(p.data),
    valor: p.valor,
  }));
  const maxY = Math.max(4, ...pontos.map(p => p.valor!)) + 0.5;

  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          {CHART_BANDS.map(b => (
            <ReferenceArea key={b.label} y1={b.y1} y2={Math.min(b.y2, maxY)} fill={b.fill} />
          ))}
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE5" strokeWidth={0.5} vertical={false} />
          <ReferenceLine y={1.6} stroke="rgba(76,167,133,0.5)" strokeDasharray="3 3" />
          <ReferenceLine y={2.2} stroke="rgba(217,164,65,0.5)" strokeDasharray="3 3" />
          <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#8B9286", fontFamily: "'Inter', sans-serif" }} interval="preserveStartEnd" />
          <YAxis domain={[0, maxY]} tick={{ fontSize: 11, fill: "#8B9286", fontFamily: "'Inter', sans-serif" }} />
          <RechartsTooltip
            formatter={(v: number) => [v != null ? `${v.toFixed(2)} g/kg` : "—", "Proteína relativa"]}
            labelStyle={{ color: "var(--sys-text-primary)", fontSize: 11, fontWeight: 600, marginBottom: 2 }}
            contentStyle={{
              background: "var(--sys-bg-primary)",
              border: "1px solid var(--mod-longevidade-border)",
              borderRadius: 6,
              fontSize: 11,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
            itemStyle={{ color: "var(--sys-text-secondary)" }}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#648D4A"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ mensagem }: { mensagem: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <Utensils className="h-10 w-10" style={{ color: "var(--sys-text-muted)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--sys-text-secondary)" }}>Sem dados nutricionais</p>
      <p className="text-xs max-w-sm" style={{ color: "var(--sys-text-muted)" }}>
        {mensagem ?? "O cliente precisa registrar refeições no app UNIO para que os dados apareçam aqui."}
      </p>
    </div>
  );
}

function SkelNutricao() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["7d", "30d", "90d"].map(p => <Skeleton key={p} className="h-8 w-14 rounded-md" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-52 rounded-xl" />
    </div>
  );
}

export function AbaNutricao({ pacienteId }: AbaNutricaoProps) {
  const [periodo, setPeriodo] = useState<Periodo>("7");
  const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(new Set());

  const { data, isLoading, isFetching, isError } = useQuery<RespostaNutricao>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "nutricao", periodo],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/painel-longevidade/clientes/${pacienteId}/nutricao?periodo=${periodo}`);
      return res.json();
    },
    enabled: !!pacienteId,
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) return <SkelNutricao />;
  if (isError) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: "var(--sys-text-muted)" }}>
        Erro ao carregar dados nutricionais.
      </div>
    );
  }
  if (!data) {
    return (
      <EmptyState mensagem="Dados nutricionais não disponíveis para este cliente no momento." />
    );
  }

  const { resumo, alertas, serie_proteina_relativa_30d, historico, sem_dados, mensagem_sem_dados, glicemia, composicao_corporal } = data;
  const registros: NutricaoRegistroDia[] = historico?.registros ?? [];
  const coberturaPct = historico?.cobertura_pct ?? 0;
  const coberturaDias = historico?.cobertura_dias ?? 0;
  const periodoNDias = historico?.periodo_dias ?? Number(periodo);
  const baixaCobertura = coberturaPct < 50;
  const coberturaMuitoBaixa = coberturaPct < 30;

  const alertasVisiveis = coberturaMuitoBaixa
    ? []
    : alertas.filter(a => !alertasDismissed.has(a.tipo));

  function dismissAlert(tipo: string) {
    setAlertasDismissed(prev => new Set([...prev, tipo]));
  }

  const proteinaValor = periodo === "7"
    ? resumo?.proteina_relativa_g_kg_7d
    : resumo?.proteina_relativa_g_kg_30d;

  const aderenciaValor = periodo === "7"
    ? resumo?.aderencia_calorica_pct_7d
    : resumo?.aderencia_calorica_pct_30d;

  const proteinaClass = classifyProteina(proteinaValor ?? null);
  const macros = resumo?.macros_distribuicao_30d;
  const semPeso = proteinaValor === null && (historico?.medias?.calorias_consumidas ?? 0) > 0;
  const semMeta = aderenciaValor === null && (historico?.medias?.calorias_consumidas ?? 0) > 0;

  return (
    <div className="space-y-6" data-testid="aba-nutricao">
      <div className="flex items-center gap-2 flex-wrap">
        {(["7", "30", "90"] as Periodo[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            disabled={isFetching}
            data-testid={`btn-periodo-${p}`}
            className="transition-all disabled:cursor-wait"
            style={
              periodo === p
                ? { background: "#4A5899", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, borderRadius: 8, padding: "6px 14px", border: "none", opacity: isFetching ? 0.75 : 1 }
                : { background: "transparent", color: "#8B9286", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, borderRadius: 8, padding: "6px 14px", border: "1px solid #D4D9D0" }
            }
          >
            {p}d
          </button>
        ))}
        {isFetching && (
          <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>Atualizando…</span>
        )}
      </div>

      {baixaCobertura && (
        <div
          className="flex items-start gap-3 rounded-lg px-4 py-3 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30"
          data-testid="banner-baixa-cobertura"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: "var(--sys-text-secondary)" }}>
            {coberturaMuitoBaixa
              ? `Cobertura de dados muito limitada: ${coberturaDias} de ${periodoNDias} dias. Alertas nutricionais não são exibidos para evitar falsos positivos.`
              : `Cobertura de dados limitada: ${coberturaDias} de ${periodoNDias} dias. As médias podem não refletir o comportamento real.`}
          </p>
        </div>
      )}

      {alertasVisiveis.length > 0 && (
        <div className="space-y-2" data-testid="secao-alertas">
          {alertasVisiveis.map(alerta => {
            const style = URGENCIA_STYLE[alerta.urgencia];
            const Icon = style.icon;
            return (
              <div
                key={alerta.tipo}
                className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${style.border} ${style.bg}`}
                data-testid={`alerta-${alerta.tipo}`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
                <p className="text-xs flex-1" style={{ color: "var(--sys-text-secondary)" }}>
                  {alerta.mensagem}
                  {alerta.dias_consecutivos != null && (
                    <span className="ml-1 font-medium">({alerta.dias_consecutivos} dias consecutivos)</span>
                  )}
                </p>
                <button
                  onClick={() => dismissAlert(alerta.tipo)}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  data-testid={`btn-dismiss-${alerta.tipo}`}
                  aria-label="Dispensar alerta"
                >
                  <X className="h-3.5 w-3.5" style={{ color: "var(--sys-text-muted)" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {sem_dados ? (
        <EmptyState mensagem={mensagem_sem_dados} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="grid-resumo">
            <CardResumo title="Proteína relativa" tooltip={TOOLTIPS_COMPONENTES.proteina_relativa}>
              {proteinaValor !== null ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
                      {proteinaValor?.toFixed(2)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>g/kg</span>
                  </div>
                  {proteinaClass && (
                    <span style={{ ...proteinaClass.style, fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "3px 10px", borderRadius: 9999, display: "inline-block", marginTop: 6 }}>
                      {proteinaClass.label}
                    </span>
                  )}
                  {semPeso && (
                    <p className="mt-1 text-[10px]" style={{ color: "var(--sys-text-muted)" }}>
                      Peso não atualizado — registre no app para ver g/kg.
                    </p>
                  )}
                </>
              ) : (
                <div>
                  <span className="text-2xl font-bold text-muted-foreground">—</span>
                  <p className="text-[10px] mt-1" style={{ color: "var(--sys-text-muted)" }}>
                    {semPeso
                      ? "Peso corporal não atualizado — registre o peso no app para ver g/kg."
                      : "Sem registros no período."}
                  </p>
                </div>
              )}
            </CardResumo>

            <CardResumo title="Aderência calórica" tooltip={TOOLTIPS_COMPONENTES.aderencia_calorica}>
              {aderenciaValor !== null ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
                      {aderenciaValor?.toFixed(0)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "#F5F3EE" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(aderenciaValor ?? 0, 100)}%`,
                        background: (aderenciaValor ?? 0) > 110 ? "#D9A441"
                          : (aderenciaValor ?? 0) >= 90 ? "#4CA785"
                          : (aderenciaValor ?? 0) >= 70 ? "#D9A441"
                          : "#D97952",
                      }}
                    />
                  </div>
                  <MiniSparkline registros={registros} />
                </>
              ) : (
                <div>
                  <span className="text-2xl font-bold text-muted-foreground">—</span>
                  <p className="text-[10px] mt-1" style={{ color: "var(--sys-text-muted)" }}>
                    {semMeta
                      ? "Configure a meta calórica do cliente para ver a aderência."
                      : "Sem registros no período."}
                  </p>
                </div>
              )}
            </CardResumo>

            <CardResumo title="Refeições por dia" tooltip={TOOLTIPS_COMPONENTES.refeicoes_por_dia}>
              {resumo?.refeicoes_por_dia_7d !== null && resumo?.refeicoes_por_dia_7d !== undefined ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
                    {resumo.refeicoes_por_dia_7d.toFixed(1)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>média 7d</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">—</span>
              )}
            </CardResumo>

            <CardResumo title="Distribuição de macros" tooltip={TOOLTIPS_COMPONENTES.macros_distribuicao}>
              <MacroDonut
                proteina={macros?.proteina_pct ?? null}
                carbo={macros?.carboidrato_pct ?? null}
                gordura={macros?.gordura_pct ?? null}
              />
              <p className="text-[10px] mt-1.5" style={{ color: "var(--sys-text-muted)" }}>Média 30d</p>
            </CardResumo>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--mod-longevidade-bg-subtle)",
              border: "1px solid var(--mod-longevidade-border)",
            }}
            data-testid="secao-grafico-proteina"
          >
            <div className="flex items-center gap-2 mb-4">
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: "#2F5641" }}>
                Proteína relativa — evolução 30 dias
              </p>
              <InfoTooltip text={TOOLTIPS_COMPONENTES.proteina_relativa} side="top" />
            </div>

            {serie_proteina_relativa_30d.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: "var(--sys-text-muted)" }}>
                Sem dados de proteína nos últimos 30 dias.
              </p>
            ) : (
              <>
                <ProteinaChart serie={serie_proteina_relativa_30d} />
                <div className="flex gap-4 mt-3 flex-wrap">
                  {[
                    { color: "#D97952", label: "< 1.2 g/kg — Insuficiente" },
                    { color: "#D9A441", label: "1.2–1.6 g/kg — Subótimo" },
                    { color: "#4CA785", label: "1.6–2.2 g/kg — Adequado" },
                    { color: "#D9A441", label: "> 2.2 g/kg — Elevado" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
                      <span className="inline-block w-2.5 h-2 rounded-sm" style={{ background: l.color, opacity: 0.7 }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div
            className="rounded-xl p-4 space-y-4"
            style={{
              background: "var(--mod-longevidade-bg-subtle)",
              border: "1px solid var(--mod-longevidade-border)",
            }}
            data-testid="secao-correlacoes"
          >
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#8B9286", textTransform: "uppercase", letterSpacing: 1 }}>
              Correlações
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-lg p-3 space-y-2"
                style={{ background: "var(--sys-bg-primary)", border: "1px solid var(--mod-longevidade-border)" }}
                data-testid="correlacao-calorias-meta"
              >
                <p className="text-xs font-semibold" style={{ color: "var(--sys-text-secondary)" }}>
                  Aderência calórica — evolução diária
                </p>
                <CorrelacaoCaloriasVsMeta registros={registros} />
                <div className="flex gap-3 flex-wrap">
                  {[
                    { color: "#4CA785", label: "≥ 90%" },
                    { color: "#D9A441", label: "70–89%" },
                    { color: "#D97952", label: "< 70%" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
                      <span className="inline-block w-2 h-2 rounded-sm" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="rounded-lg p-3 space-y-2"
                style={{
                  background: "var(--sys-bg-primary)",
                  border: composicao_corporal?.disponivel
                    ? "1px solid var(--mod-longevidade-border)"
                    : "1px dashed var(--mod-longevidade-border)",
                  opacity: composicao_corporal?.disponivel ? 1 : 0.65,
                }}
                data-testid="correlacao-proteina-massa-magra"
              >
                <p className="text-xs font-semibold" style={{ color: "var(--sys-text-secondary)" }}>
                  Proteína relativa ↔ massa magra
                </p>
                {composicao_corporal ? (
                  <ComposicaoCorporalChart cc={composicao_corporal} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <TrendingUp className="h-5 w-5" style={{ color: "var(--sys-text-muted)" }} />
                    <p className="text-[10px] text-center" style={{ color: "var(--sys-text-muted)" }}>
                      Disponível quando dados de composição corporal estiverem sincronizados.
                    </p>
                  </div>
                )}
              </div>

              <div
                className="rounded-lg p-3 space-y-2"
                style={{
                  background: "var(--sys-bg-primary)",
                  border: glicemia?.disponivel
                    ? "1px solid var(--mod-longevidade-border)"
                    : "1px dashed var(--mod-longevidade-border)",
                  opacity: glicemia?.disponivel ? 1 : 0.65,
                }}
                data-testid="correlacao-carboidrato-glicemia"
              >
                <p className="text-xs font-semibold" style={{ color: "var(--sys-text-secondary)" }}>
                  Carboidrato ↔ glicemia
                </p>
                {glicemia ? (
                  <GlicemiaCorrelacaoChart glicemia={glicemia} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <GitBranch className="h-5 w-5" style={{ color: "var(--sys-text-muted)" }} />
                    <p className="text-[10px] text-center" style={{ color: "var(--sys-text-muted)" }}>
                      Disponível com integração de glicemia contínua.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {registros.length > 0 && (
            <div className="space-y-3" data-testid="secao-linha-do-tempo">
              <div className="flex items-center gap-2">
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: "#2F5641" }}>
                  Linha do tempo de registros
                </p>
                <span style={{ background: "#4A5899", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "2px 10px", display: "inline-block" }}>
                  {registros.length} dias
                </span>
              </div>
              <TabelaRegistros registros={registros} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
