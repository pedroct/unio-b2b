import { useQuery } from "@tanstack/react-query";
import { Timer, Footprints, Scale, Dumbbell, Smartphone } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { CardScore } from "./card-score";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaPerformanceFuncional, BiomarcadorDetalhe, ClassificacaoScore, TendenciaBiomarcador, HeartRateZones } from "@shared/schema";
import { TENDENCIA_FROM_API, CLASSIFICACAO_FROM_LABEL } from "@shared/schema";

interface AbaPerformanceFuncionalProps {
  pacienteId: string;
}

type BioKey = "exercise_minutes" | "walking_speed" | "stability" | "strength";

const BIOMARCADORES_CONFIG: {
  key: BioKey;
  nome: string;
  invertedSemantics: boolean;
  icon: typeof Timer;
}[] = [
  { key: "exercise_minutes", nome: "Volume de Treino", invertedSemantics: false, icon: Timer },
  { key: "walking_speed", nome: "Velocidade Caminhada", invertedSemantics: false, icon: Footprints },
  { key: "stability", nome: "Estabilidade", invertedSemantics: false, icon: Scale },
  { key: "strength", nome: "Força", invertedSemantics: false, icon: Dumbbell },
];

const ZONE_CONFIG = [
  { key: "zone1_minutes" as const, label: "Zona 1 — Leve", range: "50–60%", color: "var(--score-good-bg, #dbeafe)" },
  { key: "zone2_minutes" as const, label: "Zona 2 — Moderada", range: "60–70%", color: "var(--score-excellent-bg, #dcfce7)" },
  { key: "zone3_minutes" as const, label: "Zona 3 — Intensa", range: "70–80%", color: "var(--score-attention-bg, #fef9c3)" },
  { key: "zone4_minutes" as const, label: "Zona 4 — Máxima", range: "80–90%", color: "var(--score-risk-bg, #fee2e2)" },
];

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

export function AbaPerformanceFuncional({ pacienteId }: AbaPerformanceFuncionalProps) {
  const { data, isLoading, isError } = useQuery<RespostaPerformanceFuncional>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "performance-funcional"],
  });

  const score = data?.score;
  const biomarcadores = data?.biomarcadores;
  const hrZones = biomarcadores?.heart_rate_zones;
  const hasBiomarcadores = biomarcadores && Object.entries(biomarcadores)
    .filter(([k]) => k !== "heart_rate_zones")
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
    </div>
  );
}
