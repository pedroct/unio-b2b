import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timer, Footprints, Scale, Dumbbell, Smartphone, X } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { CardScore } from "./card-score";
import { Skeleton } from "@/components/ui/skeleton";
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

function TabelaSessoes({ sessoes, tipoFiltro }: { sessoes: SessaoExercicio[]; tipoFiltro: string | null }) {
  const filtradas = tipoFiltro ? sessoes.filter(s => s.tipo === tipoFiltro) : sessoes;

  if (filtradas.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
        data-testid="tabela-sessoes-vazia"
      >
        <p className="text-sm" style={{ color: "var(--sys-text-muted)" }}>
          {tipoFiltro
            ? `Nenhuma sessão de "${tipoFiltro}" encontrada no período.`
            : "Nenhuma sessão registrada."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--mod-longevidade-border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]" data-testid="tabela-sessoes">
          <thead>
            <tr style={{ background: "var(--mod-longevidade-bg-subtle)", borderBottom: "1px solid var(--mod-longevidade-border)" }}>
              {["Sessão", "Início", "Duração", "Calorias", "Distância", "Elevação", "METs", "Fonte"].map(h => (
                <th
                  key={h}
                  className={`px-3 py-2 font-semibold ${h === "Sessão" || h === "Fonte" ? "text-left" : "text-right"}`}
                  style={{ color: "var(--sys-text-secondary)", whiteSpace: "nowrap" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((s, idx) => {
              const isLong = (s.duracao_min ?? 0) > 30;
              return (
                <tr
                  key={s.id}
                  className="border-t"
                  style={{
                    borderColor: "var(--mod-longevidade-border)",
                    background: idx % 2 === 1 ? "var(--mod-longevidade-bg-subtle)" : undefined,
                    fontWeight: isLong ? 600 : 400,
                  }}
                  data-testid={`row-sessao-${s.id}`}
                >
                  <td className="px-3 py-2 text-left" style={{ color: "var(--sys-text-primary)" }}>
                    <span className="mr-1">{ICONES_POR_TIPO[s.tipo] ?? "🏅"}</span>
                    {s.tipo}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                    {s.inicio}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                    {formatDuracao(s.duracao_min)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: "var(--sys-text-secondary)" }}>
                    {s.calorias_kcal != null ? `${s.calorias_kcal.toFixed(1)} kcal` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: "var(--sys-text-secondary)" }}>
                    {formatDistancia(s.distancia_metros)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: "var(--sys-text-secondary)" }}>
                    {s.elevacao_metros != null ? `${s.elevacao_metros.toFixed(1)} m` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums hidden md:table-cell" style={{ color: "var(--sys-text-secondary)" }}>
                    {s.mets_medio != null ? s.mets_medio.toFixed(1) : "—"}
                  </td>
                  <td className="px-3 py-2 text-left hidden md:table-cell" style={{ color: "var(--sys-text-muted)" }}>
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
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="inline-flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--mod-longevidade-border)" }}
          data-testid="filtro-intervalo-exercicios"
        >
          {(["7d", "30d", "90d"] as Intervalo[]).map(v => (
            <button
              key={v}
              onClick={() => { setIntervalo(v); setTipoFiltro(null); }}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: intervalo === v ? "var(--mod-longevidade-active)" : "transparent",
                color: intervalo === v ? "#fff" : "var(--mod-longevidade-text)",
              }}
              data-testid={`btn-intervalo-${v}`}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="text-xs tabular-nums" style={{ color: "var(--sys-text-muted)" }} data-testid="text-total-sessoes">
          {historico.total_sessoes} sessão{historico.total_sessoes !== 1 ? "es" : ""}
        </span>
      </div>

      {historico.total_sessoes === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
          data-testid="estado-vazio-exercicios"
        >
          <Dumbbell className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--sys-text-muted)", opacity: 0.5 }} />
          <p className="text-sm" style={{ color: "var(--sys-text-secondary)" }}>
            Nenhuma sessão de treino registrada nos últimos {intervalo.replace("d", " dias")}.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--sys-text-muted)" }}>
            Treinos do Apple Watch serão exibidos aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          {tipos.length > 0 && (
            <div className="flex gap-3 flex-wrap" data-testid="resumo-por-tipo">
              {tipos.map(([tipo, r]) => {
                const isActive = tipoFiltro === tipo;
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoFiltro(isActive ? null : tipo)}
                    className="rounded-lg p-3 text-left transition-all min-w-[120px]"
                    style={{
                      background: isActive ? "var(--mod-longevidade-active)" : "var(--mod-longevidade-bg-subtle)",
                      border: isActive
                        ? "1.5px solid var(--mod-longevidade-base)"
                        : "1px solid var(--mod-longevidade-border)",
                      boxShadow: isActive ? "0 0 0 1px var(--mod-longevidade-base)" : "var(--sys-shadow-sm)",
                    }}
                    data-testid={`card-tipo-${tipo.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{ICONES_POR_TIPO[tipo] ?? "🏅"}</span>
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: isActive ? "#fff" : "var(--mod-longevidade-text)" }}
                      >
                        {tipo}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px]" style={{ color: isActive ? "rgba(255,255,255,0.8)" : "var(--sys-text-muted)" }}>
                        {r.sessoes} sessão{r.sessoes !== 1 ? "es" : ""}
                      </p>
                      <p className="text-[10px] tabular-nums" style={{ color: isActive ? "rgba(255,255,255,0.8)" : "var(--sys-text-muted)" }}>
                        {formatDuracao(r.total_min)} · {Math.round(r.total_kcal)} kcal
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tipoFiltro && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--sys-text-muted)" }}>
                Filtrando: <span className="font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>{tipoFiltro}</span>
              </span>
              <button
                onClick={() => setTipoFiltro(null)}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors"
                style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)", color: "var(--sys-text-muted)" }}
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
        <h3 className="section-label-longevidade mb-4" data-testid="label-historico-exercicios">
          Histórico de Exercícios
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
            style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
            data-testid="estado-vazio-exercicios"
          >
            <Dumbbell className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--sys-text-muted)", opacity: 0.5 }} />
            <p className="text-sm" style={{ color: "var(--sys-text-secondary)" }}>
              Histórico de exercícios não disponível.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--sys-text-muted)" }}>
              Treinos do Apple Watch serão exibidos aqui quando sincronizados.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
