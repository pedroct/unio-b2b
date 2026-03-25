import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bed, Moon as MoonIcon, Brain, HeartPulse, Heart, Smartphone, Clock } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { CardScore } from "./card-score";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/queryClient";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  RespostaRecuperacaoSono, BiomarcadorDetalhe, ClassificacaoScore,
  TendenciaBiomarcador, RespostaHistoricoSono, HistoricoSonoItem,
} from "@shared/schema";
import { TENDENCIA_FROM_API, CLASSIFICACAO_FROM_LABEL } from "@shared/schema";
import { TOOLTIPS_COMPONENTES, TOOLTIPS_SCORES } from "./tooltips-longevidade";

interface AbaRecuperacaoSonoProps {
  pacienteId: string;
}

const BIOMARCADORES_CONFIG: {
  key: keyof RespostaRecuperacaoSono["biomarcadores"];
  nome: string;
  invertedSemantics: boolean;
  icon: typeof Bed;
  tooltip?: string;
}[] = [
  { key: "sono_total",   nome: "Sono total",    invertedSemantics: false, icon: Bed,        tooltip: TOOLTIPS_COMPONENTES.sono_total },
  { key: "sono_rem",     nome: "Sono REM",      invertedSemantics: false, icon: MoonIcon,   tooltip: TOOLTIPS_COMPONENTES.sono_rem },
  { key: "sono_profundo",nome: "Sono profundo", invertedSemantics: false, icon: Brain,      tooltip: TOOLTIPS_COMPONENTES.sono_profundo },
  { key: "hrv_noturna",  nome: "HRV noturna",  invertedSemantics: false, icon: HeartPulse, tooltip: TOOLTIPS_COMPONENTES.hrv_noturna },
  { key: "fc_noturna",   nome: "FC noturna",   invertedSemantics: true,  icon: Heart,      tooltip: TOOLTIPS_COMPONENTES.fc_noturna },
];

type Intervalo = "hoje" | "7d" | "30d" | "180d";

const FILTROS: { label: string; value: Intervalo }[] = [
  { label: "Hoje", value: "hoje" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "6 meses", value: "180d" },
];

const COR_PROFUNDO  = "#3B4A85";
const COR_ESSENCIAL = "#6B91C9";
const COR_REM       = "#93C5FD";
const COR_ACORDADO  = "#F87171";

function minToHm(min: number | null): string {
  if (min === null || min === 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatarEixoX(data: string, intervalo: Intervalo): string {
  const partes = data.split("-");
  if (partes.length < 3) return data;
  const dia = parseInt(partes[2], 10);
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const mes = meses[parseInt(partes[1], 10) - 1] ?? "";
  if (intervalo === "180d") return mes;
  return `${dia}/${partes[1]}`;
}

function formatarDecimalBr(valor: number | null, unidade: string): string | null {
  if (valor === null) return null;
  return (
    valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
    " " + unidade
  );
}

function normTrend(t: string | null | undefined): TendenciaBiomarcador {
  if (!t) return null;
  return TENDENCIA_FROM_API[t] ?? TENDENCIA_FROM_API[t.toLowerCase()] ?? null;
}

function normClassificacao(c: string | null | undefined): ClassificacaoScore | null {
  if (!c) return null;
  return CLASSIFICACAO_FROM_LABEL[c] ?? CLASSIFICACAO_FROM_LABEL[c.toLowerCase()] ?? null;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const nomesLegenda: Record<string, string> = {
    profundo_min:  "Profundo",
    essencial_min: "Essencial",
    rem_min:       "REM",
    sem_dormir_min:"Acordado",
  };
  return (
    <div className="rounded-lg border bg-white shadow-md px-3 py-2.5 text-xs min-w-[140px]"
      style={{ borderColor: "#E8EBE5" }}>
      <p className="font-semibold text-[#2F5641] mb-2">{label}</p>
      {[...payload].reverse().map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: p.color }} />
            <span className="text-[#8B9286]">{nomesLegenda[p.name] ?? p.name}</span>
          </div>
          <span className="font-medium text-[#2F5641]">{minToHm(p.value)}</span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex items-center justify-between">
        <span className="text-[#8B9286]">Total</span>
        <span className="font-semibold text-[#2F5641]">{minToHm(total)}</span>
      </div>
    </div>
  );
}

function GraficoEstagiosSono({ pacienteId }: { pacienteId: string }) {
  const [intervalo, setIntervalo] = useState<Intervalo>("7d");

  const { data, isLoading, isError } = useQuery<RespostaHistoricoSono>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "sono/historico", intervalo],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/api/painel-longevidade/clientes/${pacienteId}/sono/historico?intervalo=${intervalo}`
      );
      if (!res.ok) throw new Error("Erro ao buscar histórico de sono");
      return res.json();
    },
    staleTime: 60_000,
  });

  const historico = data?.historico ?? [];
  const resumo = data?.resumo;
  const temDados = historico.some((n) => n.total_min !== null);

  const dadosGrafico = historico.map((n: HistoricoSonoItem) => ({
    data: formatarEixoX(n.data, intervalo),
    dataOriginal: n.data,
    profundo_min:  n.profundo_min  ?? 0,
    essencial_min: n.essencial_min ?? 0,
    rem_min:       n.rem_min       ?? 0,
    sem_dormir_min:n.sem_dormir_min ?? 0,
    vazio:         n.total_min === null,
    hora_inicio:   n.hora_inicio,
    hora_fim:      n.hora_fim,
  }));

  const tickInterval = intervalo === "180d" ? 14 : intervalo === "30d" ? 4 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="section-label-longevidade" data-testid="label-grafico-sono">
          Estágios de sono
        </h3>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5" data-testid="filtros-intervalo-sono">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              data-testid={`filtro-sono-${f.value}`}
              onClick={() => setIntervalo(f.value)}
              className={[
                "px-3 py-1 rounded-md text-xs font-medium transition-all",
                intervalo === f.value
                  ? "bg-white shadow-sm text-[#333F73] font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <div className="rounded-xl p-8 text-center text-sm text-muted-foreground"
          style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
          data-testid="erro-grafico-sono">
          Não foi possível carregar o histórico de sono.
        </div>
      ) : !temDados ? (
        <div className="rounded-xl p-8 text-center"
          style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
          data-testid="vazio-grafico-sono">
          <Smartphone className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--mod-longevidade-disabled)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--mod-longevidade-text)" }}>
            Sem dados de sono no período
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os estágios de sono aparecerão aqui quando o Apple Health enviar os dados.
          </p>
        </div>
      ) : (
        <>
          {/* Gráfico */}
          <div className="rounded-xl p-4 pb-2"
            style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
            data-testid="container-grafico-sono">

            {/* Legenda manual no topo */}
            <div className="flex items-center gap-4 mb-3 flex-wrap" data-testid="legenda-sono">
              {[
                { cor: COR_PROFUNDO,  label: "Profundo" },
                { cor: COR_ESSENCIAL, label: "Essencial" },
                { cor: COR_REM,       label: "REM" },
                { cor: COR_ACORDADO,  label: "Acordado" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                    style={{ background: l.cor }} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={dadosGrafico}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                barCategoryGap={dadosGrafico.length > 30 ? "8%" : "20%"}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EBE5" />
                <XAxis
                  dataKey="data"
                  tick={{ fontSize: 10, fill: "#8B9286" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 60)}h`}
                  tick={{ fontSize: 10, fill: "#8B9286" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(74,88,153,0.06)" }} />
                <Bar dataKey="profundo_min"  stackId="sono" fill={COR_PROFUNDO}  radius={[0,0,0,0]} />
                <Bar dataKey="essencial_min" stackId="sono" fill={COR_ESSENCIAL} radius={[0,0,0,0]} />
                <Bar dataKey="rem_min"       stackId="sono" fill={COR_REM}       radius={[0,0,0,0]} />
                <Bar dataKey="sem_dormir_min" stackId="sono" fill={COR_ACORDADO} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Médias do resumo */}
          {resumo && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="resumo-sono">
              {[
                { label: "Sono profundo",  valor: resumo.media_profundo_min,  cor: COR_PROFUNDO  },
                { label: "Sono essencial", valor: resumo.media_essencial_min, cor: COR_ESSENCIAL },
                { label: "Sono REM",       valor: resumo.media_rem_min,       cor: COR_REM       },
                { label: "Acordado",       valor: resumo.media_sem_dormir_min,cor: COR_ACORDADO  },
              ].map((item) => (
                <div key={item.label}
                  className="rounded-lg px-3 py-2.5 flex flex-col gap-0.5"
                  style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
                  data-testid={`resumo-sono-${item.label.toLowerCase().replace(/\s/g,"-")}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: item.cor }} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#2F5641]">
                    {minToHm(item.valor)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Média do período
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Info do período para "hoje" */}
          {intervalo === "hoje" && historico[0]?.hora_inicio && historico[0]?.hora_fim && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
              data-testid="horario-sono-hoje">
              <Clock className="h-3.5 w-3.5" />
              <span>{historico[0].hora_inicio} → {historico[0].hora_fim}</span>
              {data?.data_referencia && (
                <span className="text-[#8B9286]">
                  · {(() => {
                    const p = data.data_referencia.split("-");
                    return `${p[2]}/${p[1]}/${p[0]}`;
                  })()}
                </span>
              )}
            </div>
          )}

          {resumo && resumo.noites_sem_dados > 0 && (
            <p className="mt-2 text-[10px] text-muted-foreground" data-testid="aviso-noites-sem-dados">
              {resumo.noites_sem_dados} {resumo.noites_sem_dados === 1 ? "noite" : "noites"} sem dados no período.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function AbaRecuperacaoSono({ pacienteId }: AbaRecuperacaoSonoProps) {
  const { data, isLoading, isError } = useQuery<RespostaRecuperacaoSono>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "recuperacao-sono"],
  });

  const score = data?.score;
  const biomarcadores = data?.biomarcadores;
  const hasBiomarcadores = biomarcadores && Object.values(biomarcadores).some(v => v != null);

  return (
    <div className="space-y-8" data-testid="aba-recuperacao-sono">
      {/* Score */}
      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-score-recuperacao">
          Score de Recuperação
        </h3>
        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (
          <div className="max-w-md">
            <CardScore
              score={score?.valor ?? null}
              classification={normClassificacao(score?.classificacao)}
              tendencia={normTrend(score?.tendencia_score)}
              is_partial={score?.is_partial ?? false}
              updated_at={null}
              pilarTipo="recovery"
              tooltip={TOOLTIPS_SCORES.recovery}
            />
          </div>
        )}
      </section>

      {/* Gráfico de estágios */}
      <section>
        <GraficoEstagiosSono pacienteId={pacienteId} />
      </section>

      {/* Biomarcadores */}
      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-biomarcadores-recuperacao">
          Biomarcadores
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" data-testid="text-erro-recuperacao">
            Não foi possível carregar os dados de recuperação e sono.
          </p>
        ) : hasBiomarcadores ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-testid="grade-biomarcadores-recuperacao">
            {BIOMARCADORES_CONFIG.map(cfg => {
              const bio = biomarcadores[cfg.key] as BiomarcadorDetalhe | null | undefined;
              if (!bio) return null;
              return (
                <CardBiomarcador
                  key={cfg.key}
                  nome={cfg.nome}
                  valor={bio.valor}
                  valorFormatado={formatarDecimalBr(bio.valor, bio.unidade)}
                  unidade={bio.unidade}
                  tendencia={normTrend(bio.tendencia)}
                  invertedSemantics={cfg.invertedSemantics}
                  labelSecundario="Média 7d"
                  tooltip={cfg.tooltip}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl p-8 text-center"
            style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
            data-testid="estado-vazio-recuperacao">
            <Smartphone className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--mod-longevidade-disabled)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--mod-longevidade-text)" }}
              data-testid="text-vazio-recuperacao-titulo">
              Aguardando dados do Apple Health
            </p>
            <p className="text-xs text-muted-foreground mt-1"
              data-testid="text-vazio-recuperacao-desc">
              Os biomarcadores de recuperação e sono aparecerão aqui assim que os dados
              estiverem disponíveis.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
