import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timer, Footprints, Scale, Dumbbell, Smartphone, X, Info } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { CardScore } from "./card-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import type { RespostaPerformanceFuncional, BiomarcadorDetalhe, ClassificacaoScore, TendenciaBiomarcador, HeartRateZones, HistoricoExercicios, SessaoExercicio } from "@shared/schema";
import { TENDENCIA_FROM_API, CLASSIFICACAO_FROM_LABEL } from "@shared/schema";
import { TOOLTIPS_COMPONENTES, TOOLTIPS_SCORES } from "./tooltips-longevidade";

interface AbaPerformanceFuncionalProps {
  pacienteId: string;
}

type BioKey = "exercise_minutes" | "walking_speed" | "stability" | "strength";
type Intervalo = "7d" | "30d" | "90d";

const BIOMARCADORES_CONFIG: {
  key: BioKey;
  nome: string;
  invertedSemantics: boolean;
  icon: typeof Timer;
  tooltip?: string;
}[] = [
  { key: "exercise_minutes", nome: "Volume de Treino", invertedSemantics: false, icon: Timer, tooltip: TOOLTIPS_COMPONENTES.volume_treino },
  { key: "walking_speed", nome: "Velocidade Caminhada", invertedSemantics: false, icon: Footprints, tooltip: TOOLTIPS_COMPONENTES.velocidade_caminhada },
  { key: "stability", nome: "Estabilidade ao Caminhar", invertedSemantics: false, icon: Scale, tooltip: TOOLTIPS_COMPONENTES.estabilidade },
  { key: "strength", nome: "Força", invertedSemantics: false, icon: Dumbbell, tooltip: TOOLTIPS_COMPONENTES.forca },
];

const ZONE_CONFIG = [
  { key: "zone1_minutes" as const, label: "Zona 1 — Leve", range: "50–60%", color: "var(--score-good-bg, #dbeafe)" },
  { key: "zone2_minutes" as const, label: "Zona 2 — Moderada", range: "60–70%", color: "var(--score-excellent-bg, #dcfce7)" },
  { key: "zone3_minutes" as const, label: "Zona 3 — Intensa", range: "70–80%", color: "var(--score-attention-bg, #fef9c3)" },
  { key: "zone4_minutes" as const, label: "Zona 4 — Máxima", range: "80–90%", color: "var(--score-risk-bg, #fee2e2)" },
];

const ICONES_POR_TIPO: Record<string, string> = {
  "Treino de Força": "💪",
  "Treino Funcional": "🏋️",
  "Bicicleta": "🚴",
  "Caminhada": "🚶",
  "Corrida": "🏃",
  "Trilha": "🥾",
  "Natação": "🏊",
  "Yoga": "🧘",
  "Pilates": "🤸",
  "HIIT": "⚡",
  "Cross Training": "🔥",
  "Elíptico": "🔄",
  "Remo": "🚣",
  "Escada": "🪜",
  "Core": "🎯",
  "Flexibilidade": "🤸‍♂️",
  "Dança": "💃",
  "Cardio Misto": "❤️‍🔥",
  "Pular Corda": "⏭️",
  "Kickboxing": "🥊",
  "Boxe": "🥊",
  "Patinação": "⛸️",
  "Outro": "🏅",
};

const CORES_POR_TIPO: Record<string, string> = {
  "Bicicleta": "#4A5899",
  "Treino de Força": "#AD8C48",
  "Treino Funcional": "#AD8C48",
  "Caminhada": "#4CA785",
  "Corrida": "#D97952",
  "HIIT": "#D97952",
  "Cross Training": "#D97952",
  "Kickboxing": "#D97952",
  "Boxe": "#D97952",
  "Natação": "#4A5899",
  "Remo": "#4A5899",
  "Elíptico": "#4A5899",
  "Cardio Misto": "#4A5899",
  "Yoga": "#4CA785",
  "Pilates": "#4CA785",
  "Flexibilidade": "#4CA785",
  "Dança": "#4CA785",
  "Trilha": "#4CA785",
  "Core": "#AD8C48",
  "Escada": "#D97952",
  "Pular Corda": "#D97952",
  "Patinação": "#4A5899",
  "Outro": "#8B9286",
};

const INTERVALO_LABEL: Record<Intervalo, string> = {
  "7d": "nos últimos 7 dias",
  "30d": "nos últimos 30 dias",
  "90d": "nos últimos 90 dias",
};

const DIAS_SEMANA_ABR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function corDoTipo(tipo: string): string {
  return CORES_POR_TIPO[tipo] ?? "#8B9286";
}

function normTrend(t: string | null | undefined): TendenciaBiomarcador {
  if (!t) return null;
  return TENDENCIA_FROM_API[t] ?? TENDENCIA_FROM_API[t.toLowerCase()] ?? null;
}

function normClassificacao(c: string | null | undefined): ClassificacaoScore | null {
  if (!c) return null;
  return CLASSIFICACAO_FROM_LABEL[c] ?? CLASSIFICACAO_FROM_LABEL[c.toLowerCase()] ?? null;
}

function formatDataLeitura(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDuracao(min: number | null): string {
  if (min == null) return "—";
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}h ${m}min`;
  }
  return `${min.toFixed(1)} min`;
}

function formatDistancia(metros: number | null): string {
  if (metros == null) return "—";
  if (metros >= 1000) return `${(metros / 1000).toFixed(1)} km`;
  return `${Math.round(metros)} m`;
}

function formatCaloriasBR(kcal: number): string {
  const rounded = Math.round(kcal);
  return rounded.toLocaleString("pt-BR");
}

function formatDataRelativa(inicio: string): string {
  const partes = inicio.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!partes) return inicio;

  const [, diaStr, mesStr, hora, minuto] = partes;
  const agora = new Date();
  const ano = agora.getFullYear();
  const dia = parseInt(diaStr, 10);
  const mes = parseInt(mesStr, 10) - 1;
  const dataEvento = new Date(ano, mes, dia);

  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - 6);

  const timeStr = `${hora}:${minuto}`;

  if (dataEvento.getTime() === hoje.getTime()) {
    return `Hoje, ${timeStr}`;
  }
  if (dataEvento.getTime() === ontem.getTime()) {
    return `Ontem, ${timeStr}`;
  }
  if (dataEvento >= inicioSemana) {
    return `${DIAS_SEMANA_ABR[dataEvento.getDay()]}, ${timeStr}`;
  }
  return `${diaStr}/${mesStr}, ${timeStr}`;
}

function IconeCircular({ tipo, tamanho = 20 }: { tipo: string; tamanho?: number }) {
  const cor = corDoTipo(tipo);
  const emoji = ICONES_POR_TIPO[tipo] ?? "🏅";
  const containerSize = tamanho + 16;
  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0 rounded-full"
      style={{
        width: containerSize,
        height: containerSize,
        background: `${cor}1F`,
      }}
    >
      <span style={{ fontSize: tamanho - 4, lineHeight: 1 }}>{emoji}</span>
    </span>
  );
}

function ZonasFC({ zones }: { zones: HeartRateZones }) {
  const total = zones.zone1_minutes + zones.zone2_minutes + zones.zone3_minutes + zones.zone4_minutes;
  if (total === 0) return null;

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)", boxShadow: "var(--sys-shadow-sm)" }}
      data-testid="card-zonas-fc"
    >
      <p className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>
        Zonas de Frequência Cardíaca
      </p>
      <p className="text-[10px] text-muted-foreground mb-2">Distribuição semanal (últimos 7 dias)</p>

      <div className="flex w-full h-6 rounded-md overflow-hidden" data-testid="bar-zonas-fc">
        {ZONE_CONFIG.map(z => {
          const val = zones[z.key];
          const pct = (val / total) * 100;
          if (pct < 1) return null;
          return (
            <div
              key={z.key}
              style={{ width: `${pct}%`, background: z.color }}
              className="flex items-center justify-center text-[9px] font-semibold"
              title={`${z.label}: ${Math.round(val)} min (${Math.round(pct)}%)`}
            >
              {pct > 8 ? `${Math.round(val)}m` : ""}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {ZONE_CONFIG.map(z => {
          const val = zones[z.key];
          return (
            <div key={z.key} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: z.color }} />
              <span style={{ color: "var(--mod-longevidade-text)" }}>
                {z.label}
              </span>
              <span className="ml-auto text-muted-foreground">{Math.round(val)} min</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COL_HEADERS = [
  { key: "sessao", label: "Sessão", align: "left" as const, tooltip: null },
  { key: "data", label: "Data", align: "right" as const, tooltip: null },
  { key: "duracao", label: "Duração", align: "right" as const, tooltip: null },
  { key: "calorias", label: "Calorias", align: "right" as const, tooltip: null },
  { key: "distancia", label: "Distância", align: "right" as const, tooltip: null, hideClass: "hidden sm:table-cell" },
  { key: "elevacao", label: "Elevação", align: "right" as const, tooltip: null, hideClass: "hidden sm:table-cell" },
  { key: "mets", label: "METs", align: "right" as const, tooltip: "Equivalente metabólico — intensidade do exercício", hideClass: "hidden md:table-cell" },
  { key: "dispositivo", label: "Dispositivo", align: "left" as const, tooltip: null, hideClass: "hidden md:table-cell" },
];

function ValorNulo() {
  return <span style={{ color: "#8B9286", opacity: 0.4 }}>—</span>;
}

function TabelaSessoes({ sessoes, tipoFiltro }: { sessoes: SessaoExercicio[]; tipoFiltro: string | null }) {
  const filtradas = tipoFiltro ? sessoes.filter(s => s.tipo === tipoFiltro) : sessoes;

  if (filtradas.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: "#F5F3EE", border: "1px solid #E8EBE5" }}
        data-testid="tabela-sessoes-vazia"
      >
        <p className="text-sm" style={{ color: "#8B9286" }}>
          {tipoFiltro
            ? `Nenhuma sessão de "${tipoFiltro}" encontrada no período.`
            : "Nenhuma sessão registrada."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8EBE5" }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }} data-testid="tabela-sessoes">
          <thead>
            <tr style={{ background: "#F5F3EE", borderBottom: "2px solid #E8EBE5" }}>
              {COL_HEADERS.map(h => (
                <th
                  key={h.key}
                  className={`px-4 py-3 ${h.hideClass ?? ""}`}
                  style={{
                    color: "#8B9286",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: h.align,
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {h.label}
                    {h.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help" style={{ color: "#8B9286", opacity: 0.6 }} />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="!bg-white dark:!bg-gray-900 !border !border-gray-200 ![padding:8px_12px] text-xs max-w-[200px]"
                        >
                          {h.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((s) => {
              return (
                <tr
                  key={s.id}
                  className="transition-colors duration-150"
                  style={{
                    borderBottom: "1px solid #E8EBE5",
                    background: "#FFFFFF",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFBF8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                  data-testid={`row-sessao-${s.id}`}
                >
                  <td className="px-4 py-3.5 text-left" style={{ color: "#2F5641" }}>
                    <div className="flex items-center gap-2">
                      <IconeCircular tipo={s.tipo} tamanho={20} />
                      <span style={{ fontWeight: 500 }}>{s.tipo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums" style={{ color: "#5F6B5A" }}>
                    {formatDataRelativa(s.inicio)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums" style={{ color: "#2F5641" }}>
                    {s.duracao_min != null ? formatDuracao(s.duracao_min) : <ValorNulo />}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums" style={{ color: "#2F5641", fontWeight: 600 }}>
                    {s.calorias_kcal != null ? `${formatCaloriasBR(s.calorias_kcal)} kcal` : <ValorNulo />}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums hidden sm:table-cell" style={{ color: "#2F5641" }}>
                    {s.distancia_metros != null ? formatDistancia(s.distancia_metros) : <ValorNulo />}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums hidden sm:table-cell" style={{ color: "#2F5641" }}>
                    {s.elevacao_metros != null ? `${s.elevacao_metros.toFixed(1)} m` : <ValorNulo />}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums hidden md:table-cell" style={{ color: "#2F5641" }}>
                    {s.mets_medio != null ? s.mets_medio.toFixed(1) : <ValorNulo />}
                  </td>
                  <td className="px-4 py-3.5 text-left hidden md:table-cell" style={{ color: "#8B9286" }}>
                    {s.fonte}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoricoExerciciosSection({ historico, intervalo, setIntervalo }: {
  historico: HistoricoExercicios;
  intervalo: Intervalo;
  setIntervalo: (v: Intervalo) => void;
}) {
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);
  const tipos = Object.entries(historico.resumo_por_tipo);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="inline-flex rounded-lg overflow-hidden"
          style={{ border: "1px solid #D4D9D0" }}
          data-testid="filtro-intervalo-exercicios"
        >
          {(["7d", "30d", "90d"] as Intervalo[]).map(v => (
            <button
              key={v}
              onClick={() => { setIntervalo(v); setTipoFiltro(null); }}
              className="px-3.5 py-1.5 transition-colors"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                background: intervalo === v ? "#4A5899" : "transparent",
                color: intervalo === v ? "#FFFFFF" : "#8B9286",
                border: intervalo === v ? "none" : undefined,
              }}
              data-testid={`btn-intervalo-${v}`}
            >
              {v}
            </button>
          ))}
        </div>
        <span
          className="tabular-nums"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8B9286", marginLeft: 4 }}
          data-testid="text-total-sessoes"
        >
          {historico.total_sessoes} {historico.total_sessoes !== 1 ? "sessões" : "sessão"} {INTERVALO_LABEL[intervalo]}
        </span>
      </div>

      {historico.total_sessoes === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "#F5F3EE", border: "1px solid #E8EBE5" }}
          data-testid="estado-vazio-exercicios"
        >
          <Dumbbell className="h-8 w-8 mx-auto mb-3" style={{ color: "#8B9286", opacity: 0.5 }} />
          <p className="text-sm" style={{ color: "#5F6B5A", fontFamily: "'Inter', sans-serif" }}>
            Nenhuma sessão de treino registrada {INTERVALO_LABEL[intervalo]}.
          </p>
          <p className="text-xs mt-1" style={{ color: "#8B9286", fontFamily: "'Inter', sans-serif" }}>
            Treinos do Apple Watch serão exibidos aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          {tipos.length > 0 && (
            <div className="flex gap-3 flex-wrap" data-testid="resumo-por-tipo">
              {tipos.map(([tipo, r]) => {
                const isActive = tipoFiltro === tipo;
                const cor = corDoTipo(tipo);
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoFiltro(isActive ? null : tipo)}
                    className="rounded-xl p-4 text-left transition-all min-w-[140px]"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      background: isActive ? "#4A5899" : "#FFFFFF",
                      border: isActive
                        ? "1.5px solid #4A5899"
                        : "1px solid #E8EBE5",
                      boxShadow: isActive
                        ? "0 0 0 1px #4A5899"
                        : "0 1px 3px rgba(47, 86, 65, 0.06)",
                    }}
                    data-testid={`card-tipo-${tipo.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isActive ? (
                        <span
                          className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                          style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)" }}
                        >
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{ICONES_POR_TIPO[tipo] ?? "🏅"}</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                          style={{ width: 36, height: 36, background: `${cor}1F` }}
                        >
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{ICONES_POR_TIPO[tipo] ?? "🏅"}</span>
                        </span>
                      )}
                      <span
                        className="truncate"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isActive ? "#FFFFFF" : "#2F5641",
                        }}
                      >
                        {tipo}
                      </span>
                    </div>
                    <div className="space-y-0.5 pl-0.5">
                      <p style={{ fontSize: 12, color: isActive ? "rgba(255,255,255,0.8)" : "#5F6B5A" }}>
                        {r.sessoes} {r.sessoes !== 1 ? "sessões" : "sessão"}
                      </p>
                      <p className="tabular-nums" style={{ fontSize: 12, color: isActive ? "rgba(255,255,255,0.8)" : "#8B9286" }}>
                        {formatDuracao(r.total_min)} · {formatCaloriasBR(r.total_kcal)} kcal
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tipoFiltro && (
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8B9286" }}>
                Filtrando: <span style={{ fontWeight: 600, color: "#2F5641" }}>{tipoFiltro}</span>
              </span>
              <button
                onClick={() => setTipoFiltro(null)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  background: "#F5F3EE",
                  border: "1px solid #E8EBE5",
                  color: "#8B9286",
                }}
                data-testid="btn-limpar-filtro-tipo"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            </div>
          )}

          <TabelaSessoes sessoes={historico.sessoes} tipoFiltro={tipoFiltro} />
        </>
      )}
    </div>
  );
}

export function AbaPerformanceFuncional({ pacienteId }: AbaPerformanceFuncionalProps) {
  const [intervalo, setIntervalo] = useState<Intervalo>("7d");

  const { data, isLoading, isError } = useQuery<RespostaPerformanceFuncional>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "performance-funcional", intervalo],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/painel-longevidade/clientes/${pacienteId}/performance-funcional?intervalo=${intervalo}`);
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const score = data?.score;
  const biomarcadores = data?.biomarcadores;
  const hrZones = biomarcadores?.heart_rate_zones;
  const historico = biomarcadores?.historico_exercicios;
  const hasBiomarcadores = biomarcadores && Object.entries(biomarcadores)
    .filter(([k]) => k !== "heart_rate_zones" && k !== "historico_exercicios")
    .some(([, v]) => v != null);
  const hasAnyData = hasBiomarcadores || hrZones != null;

  return (
    <div className="space-y-8" data-testid="aba-performance-funcional">
      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-score-funcional">
          Score Funcional
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
              pilarTipo="functional"
              tooltip={TOOLTIPS_SCORES.functional}
            />
          </div>
        )}
      </section>

      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-biomarcadores-funcional">
          Biomarcadores
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" data-testid="text-erro-performance">
            Não foi possível carregar os dados de performance e funcionalidade.
          </p>
        ) : hasAnyData ? (
          <div className="space-y-6">
            {hasBiomarcadores && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grade-biomarcadores-funcional">
                {BIOMARCADORES_CONFIG.map(cfg => {
                  const bio = biomarcadores?.[cfg.key] as BiomarcadorDetalhe | null | undefined;
                  if (!bio) return null;
                  const leitura = formatDataLeitura(bio.data_ultima_leitura);
                  return (
                    <CardBiomarcador
                      key={cfg.key}
                      nome={cfg.nome}
                      valor={bio.valor}
                      unidade={bio.unidade}
                      tendencia={normTrend(bio.tendencia)}
                      invertedSemantics={cfg.invertedSemantics}
                      labelSecundario={leitura ? `Última leitura: ${leitura}` : undefined}
                      tooltip={cfg.tooltip}
                    />
                  );
                })}
              </div>
            )}

            {hrZones && <ZonasFC zones={hrZones} />}
          </div>
        ) : (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
            data-testid="estado-vazio-performance"
          >
            <Smartphone className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--mod-longevidade-disabled)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--mod-longevidade-text)" }} data-testid="text-vazio-performance-titulo">
              Aguardando dados do Apple Health
            </p>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-vazio-performance-desc">
              Os biomarcadores de performance e funcionalidade aparecerão aqui assim que os dados estiverem disponíveis.
            </p>
          </div>
        )}
      </section>

      <section>
        <h3
          className="mb-4"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#2F5641",
          }}
          data-testid="label-historico-exercicios"
        >
          Histórico de exercícios
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-32 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : historico ? (
          <HistoricoExerciciosSection
            historico={historico}
            intervalo={intervalo}
            setIntervalo={setIntervalo}
          />
        ) : (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#F5F3EE", border: "1px solid #E8EBE5" }}
            data-testid="estado-vazio-exercicios"
          >
            <Dumbbell className="h-8 w-8 mx-auto mb-3" style={{ color: "#8B9286", opacity: 0.5 }} />
            <p className="text-sm" style={{ color: "#5F6B5A", fontFamily: "'Inter', sans-serif" }}>
              Histórico de exercícios não disponível.
            </p>
            <p className="text-xs mt-1" style={{ color: "#8B9286", fontFamily: "'Inter', sans-serif" }}>
              Treinos do Apple Watch serão exibidos aqui quando sincronizados.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
