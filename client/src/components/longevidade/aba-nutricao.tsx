import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, X, Utensils, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceArea, Tooltip as RechartsTooltip,
} from "recharts";
import { InfoTooltip } from "./info-tooltip";
import { TOOLTIPS_COMPONENTES } from "./tooltips-longevidade";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { RespostaNutricao, NutricaoAlerta } from "@shared/schema";

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

function MacroBar({ proteina, carbo, gordura }: { proteina: number | null; carbo: number | null; gordura: number | null }) {
  if (proteina === null && carbo === null && gordura === null) {
    return <p className="text-xs" style={{ color: "var(--sys-text-muted)" }}>Sem dados no período</p>;
  }
  const p = proteina ?? 0;
  const c = carbo ?? 0;
  const g = gordura ?? 0;
  const total = p + c + g;
  if (total === 0) return <p className="text-xs" style={{ color: "var(--sys-text-muted)" }}>Sem dados no período</p>;

  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-2.5" style={{ gap: "1px" }}>
        <div style={{ width: `${(p / total) * 100}%`, background: "#3b82f6" }} />
        <div style={{ width: `${(c / total) * 100}%`, background: "#f59e0b" }} />
        <div style={{ width: `${(g / total) * 100}%`, background: "#ef4444" }} />
      </div>
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Proteína", pct: p, color: "#3b82f6" },
          { label: "Carbo",    pct: c, color: "#f59e0b" },
          { label: "Gordura",  pct: g, color: "#ef4444" },
        ].map(m => (
          <span key={m.label} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--sys-text-secondary)" }}>
            <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
            {m.label} {Math.round(m.pct)}%
          </span>
        ))}
      </div>
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
              <p className="text-[10px] mb-1" style={{ color: "var(--sys-text-muted)" }}>{p.data.slice(5)}</p>
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

  const dados = serie.map(p => ({ data: p.data.slice(5), valor: p.valor }));
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
            formatter={(v: number) => [`${v?.toFixed(2)} g/kg`, "Proteína relativa"]}
            labelStyle={{ color: "var(--sys-text-primary)", fontSize: 11 }}
            contentStyle={{
              background: "var(--sys-bg-surface)",
              border: "1px solid var(--mod-longevidade-border)",
              borderRadius: 6,
              fontSize: 11,
            }}
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

  const { data, isLoading, isError } = useQuery<RespostaNutricao>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "nutricao", periodo],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/painel-longevidade/clientes/${pacienteId}/nutricao?periodo=${periodo}`);
      return res.json();
    },
    enabled: !!pacienteId,
  });

  if (isLoading) return <SkelNutricao />;
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
            data-testid={`btn-periodo-${p}`}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={
              periodo === p
                ? { background: "var(--mod-longevidade-accent)", color: "#fff" }
                : { background: "var(--mod-longevidade-bg-subtle)", color: "var(--sys-text-secondary)", border: "1px solid var(--mod-longevidade-border)" }
            }
          >
            {p}d
          </button>
        ))}
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

            <CardResumo title="Refeições / dia">
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

            <CardResumo title="Distribuição de Macros">
              <MacroBar
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
        </>
      )}
    </div>
  );
}
