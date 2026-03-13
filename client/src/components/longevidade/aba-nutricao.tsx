import { useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, X, Utensils, TrendingUp, ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceArea,
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { InfoTooltip } from "./info-tooltip";
import { TOOLTIPS_COMPONENTES } from "./tooltips-longevidade";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { RespostaNutricao, NutricaoAlerta, NutricaoRegistroDia } from "@shared/schema";

interface AbaNutricaoProps {
  pacienteId: string;
}

type Periodo = "7" | "30" | "90";

const BADGE_PROTEINA: { min: number; max: number; label: string; bg: string; text: string }[] = [
  { min: 0,   max: 1.2, label: "Insuficiente", bg: "bg-red-100 dark:bg-red-950",    text: "text-red-700 dark:text-red-300" },
  { min: 1.2, max: 1.6, label: "Subótimo",     bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300" },
  { min: 1.6, max: 2.2, label: "Adequado",     bg: "bg-green-100 dark:bg-green-950",  text: "text-green-700 dark:text-green-300" },
  { min: 2.2, max: 3.0, label: "Elevado",      bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300" },
  { min: 3.0, max: 999, label: "Excessivo",    bg: "bg-red-100 dark:bg-red-950",    text: "text-red-700 dark:text-red-300" },
];

function classifyProteina(valor: number | null) {
  if (valor === null) return null;
  return BADGE_PROTEINA.find(b => valor >= b.min && valor < b.max) ?? BADGE_PROTEINA[BADGE_PROTEINA.length - 1];
}

function statusAderencia(pct: number | null): { label: string; bg: string; text: string } | null {
  if (pct === null) return null;
  if (pct >= 90) return { label: "Alta",    bg: "bg-green-100 dark:bg-green-950",  text: "text-green-700 dark:text-green-300" };
  if (pct >= 70) return { label: "Moderada", bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300" };
  return              { label: "Baixa",   bg: "bg-red-100 dark:bg-red-950",    text: "text-red-700 dark:text-red-300" };
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
      className="rounded-lg p-4"
      style={{
        background: "var(--mod-longevidade-bg-subtle)",
        border: "1px solid var(--mod-longevidade-border)",
        boxShadow: "var(--sys-shadow-sm)",
      }}
    >
      <div className="flex items-center gap-1 mb-2">
        <p className="text-sm font-semibold flex-1" style={{ color: "var(--mod-longevidade-text)" }}>
          {title}
        </p>
        {tooltip && <InfoTooltip text={tooltip} side="top" />}
      </div>
      {children}
    </div>
  );
}

const MACRO_COLORS = { proteina: "#3b82f6", carbo: "#f59e0b", gordura: "#ef4444" };

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
          <span key={s.name} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--sys-text-secondary)" }}>
            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
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
            <tr style={{ background: "var(--mod-longevidade-bg-subtle)", borderBottom: "1px solid var(--mod-longevidade-border)" }}>
              {["Data", "Calorias", "Proteína g", "g/kg", "Aderência", "Status"].map(h => (
                <th
                  key={h}
                  className={`px-3 py-2 font-semibold ${h === "Data" ? "text-left" : "text-right last:text-center"}`}
                  style={{ color: "var(--sys-text-secondary)", whiteSpace: "nowrap" }}
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
                      {semRegistros ? "—" : `${Math.round(r.calorias_consumidas)} kcal`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                      {semRegistros ? "—" : `${Math.round(r.macros.proteina_g)} g`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                      {r.proteina_relativa_g_kg !== null ? `${r.proteina_relativa_g_kg.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                      {r.aderencia_calorica_pct !== null ? `${Math.round(r.aderencia_calorica_pct)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {badge ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
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
    cor: (r.aderencia_calorica_pct ?? 0) >= 90 ? "#22c55e" : (r.aderencia_calorica_pct ?? 0) >= 70 ? "#f59e0b" : "#ef4444",
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

const CHART_BANDS = [
  { y1: 0,   y2: 1.2, fill: "rgba(239,68,68,0.08)",   label: "< 1.2" },
  { y1: 1.2, y2: 1.6, fill: "rgba(245,158,11,0.08)",  label: "1.2–1.6" },
  { y1: 1.6, y2: 2.2, fill: "rgba(34,197,94,0.10)",   label: "1.6–2.2" },
  { y1: 2.2, y2: 3.0, fill: "rgba(245,158,11,0.08)",  label: "> 2.2" },
  { y1: 3.0, y2: 5,   fill: "rgba(239,68,68,0.08)",   label: "> 3.0" },
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
                <span className={`mt-1 inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full ${cls.bg} ${cls.text}`}>
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
          <ReferenceLine y={1.6} stroke="rgba(34,197,94,0.4)" strokeDasharray="3 3" />
          <ReferenceLine y={2.2} stroke="rgba(34,197,94,0.4)" strokeDasharray="3 3" />
          <XAxis dataKey="data" tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }} interval="preserveStartEnd" />
          <YAxis domain={[0, maxY]} tick={{ fontSize: 9, fill: "var(--sys-text-muted)" }} />
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
            stroke="var(--score-excellent-icon)"
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

  const { resumo, alertas, serie_proteina_relativa_30d, historico, sem_dados, mensagem_sem_dados } = data;
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
        <span className="text-sm font-medium" style={{ color: "var(--sys-text-secondary)" }}>Período:</span>
        {(["7", "30", "90"] as Periodo[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            disabled={isFetching}
            data-testid={`btn-periodo-${p}`}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:cursor-wait"
            style={
              periodo === p
                ? { background: "var(--mod-longevidade-base)", color: "#fff", opacity: isFetching ? 0.75 : 1 }
                : { background: "var(--mod-longevidade-bg-subtle)", color: "var(--sys-text-secondary)", border: "1px solid var(--mod-longevidade-border)" }
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
            <CardResumo title="Proteína Relativa" tooltip={TOOLTIPS_COMPONENTES.proteina_relativa}>
              {proteinaValor !== null ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
                      {proteinaValor?.toFixed(2)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>g/kg</span>
                  </div>
                  {proteinaClass && (
                    <span className={`mt-1.5 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${proteinaClass.bg} ${proteinaClass.text}`}>
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

            <CardResumo title="Aderência Calórica" tooltip={TOOLTIPS_COMPONENTES.aderencia_calorica}>
              {aderenciaValor !== null ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: "var(--mod-longevidade-text)" }}>
                      {aderenciaValor?.toFixed(0)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--mod-longevidade-border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(aderenciaValor ?? 0, 100)}%`,
                        background: (aderenciaValor ?? 0) >= 70 ? "var(--score-excellent-icon)" : "var(--score-attention-icon)",
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

            <CardResumo title="Refeições / dia" tooltip={TOOLTIPS_COMPONENTES.refeicoes_por_dia}>
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

            <CardResumo title="Distribuição de Macros" tooltip={TOOLTIPS_COMPONENTES.macros_distribuicao}>
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
              <TrendingUp className="h-4 w-4" style={{ color: "var(--sys-text-muted)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
                Proteína Relativa — Evolução 30d
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
                    { color: "bg-red-200",    label: "< 1.2 g/kg — Insuficiente" },
                    { color: "bg-yellow-200", label: "1.2–1.6 g/kg — Subótimo" },
                    { color: "bg-green-200",  label: "1.6–2.2 g/kg — Adequado" },
                    { color: "bg-yellow-200", label: "> 2.2 g/kg — Elevado" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
                      <span className={`inline-block w-2.5 h-2 rounded-sm ${l.color} opacity-70`} />
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
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" style={{ color: "var(--sys-text-muted)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
                Correlações
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-lg p-3 space-y-2"
                style={{ background: "var(--sys-bg-primary)", border: "1px solid var(--mod-longevidade-border)" }}
                data-testid="correlacao-calorias-meta"
              >
                <p className="text-xs font-semibold" style={{ color: "var(--sys-text-secondary)" }}>
                  Aderência Calórica — evolução diária
                </p>
                <CorrelacaoCaloriasVsMeta registros={registros} />
                <div className="flex gap-3 flex-wrap">
                  {[
                    { color: "#22c55e", label: "≥ 90%" },
                    { color: "#f59e0b", label: "70–89%" },
                    { color: "#ef4444", label: "< 70%" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--sys-text-muted)" }}>
                      <span className="inline-block w-2 h-2 rounded-sm" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="rounded-lg p-3 flex flex-col items-center justify-center gap-2 min-h-[140px]"
                style={{
                  background: "var(--sys-bg-primary)",
                  border: "1px dashed var(--mod-longevidade-border)",
                  opacity: 0.65,
                }}
                data-testid="correlacao-proteina-massa-magra"
              >
                <TrendingUp className="h-5 w-5" style={{ color: "var(--sys-text-muted)" }} />
                <p className="text-xs font-semibold text-center" style={{ color: "var(--sys-text-secondary)" }}>
                  Proteína Relativa ↔ Massa Magra
                </p>
                <p className="text-[10px] text-center" style={{ color: "var(--sys-text-muted)" }}>
                  Disponível quando dados de composição corporal estiverem sincronizados.
                </p>
              </div>

              <div
                className="rounded-lg p-3 flex flex-col items-center justify-center gap-2 min-h-[140px]"
                style={{
                  background: "var(--sys-bg-primary)",
                  border: "1px dashed var(--mod-longevidade-border)",
                  opacity: 0.5,
                }}
                data-testid="correlacao-carboidrato-glicemia"
              >
                <GitBranch className="h-5 w-5" style={{ color: "var(--sys-text-muted)" }} />
                <p className="text-xs font-semibold text-center" style={{ color: "var(--sys-text-secondary)" }}>
                  Carboidrato ↔ Glicemia
                </p>
                <p className="text-[10px] text-center" style={{ color: "var(--sys-text-muted)" }}>
                  Disponível com integração de glicemia contínua.
                </p>
              </div>
            </div>
          </div>

          {registros.length > 0 && (
            <div className="space-y-3" data-testid="secao-linha-do-tempo">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
                  Linha do Tempo de Registros
                </p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--mod-longevidade-bg-subtle)", color: "var(--sys-text-muted)", border: "1px solid var(--mod-longevidade-border)" }}
                >
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
