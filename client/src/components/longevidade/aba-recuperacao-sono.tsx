import { useQuery } from "@tanstack/react-query";
import { Bed, Moon as MoonIcon, Brain, HeartPulse, Heart, Smartphone } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { CardScore } from "./card-score";
import { Skeleton } from "@/components/ui/skeleton";
import type { RespostaRecuperacaoSono, BiomarcadorDetalhe, ClassificacaoScore, TendenciaBiomarcador } from "@shared/schema";
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
  { key: "sono_total", nome: "Sono Total", invertedSemantics: false, icon: Bed, tooltip: TOOLTIPS_COMPONENTES.sono_total },
  { key: "sono_rem", nome: "Sono REM", invertedSemantics: false, icon: MoonIcon, tooltip: TOOLTIPS_COMPONENTES.sono_rem_profundo },
  { key: "sono_profundo", nome: "Sono Profundo", invertedSemantics: false, icon: Brain, tooltip: TOOLTIPS_COMPONENTES.sono_rem_profundo },
  { key: "hrv_noturna", nome: "HRV Noturna", invertedSemantics: false, icon: HeartPulse, tooltip: TOOLTIPS_COMPONENTES.hrv_noturna },
  { key: "fc_noturna", nome: "FC Noturna", invertedSemantics: true, icon: Heart, tooltip: TOOLTIPS_COMPONENTES.fc_noturna },
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

export function AbaRecuperacaoSono({ pacienteId }: AbaRecuperacaoSonoProps) {
  const { data, isLoading, isError } = useQuery<RespostaRecuperacaoSono>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "recuperacao-sono"],
  });

  const score = data?.score;
  const biomarcadores = data?.biomarcadores;
  const hasBiomarcadores = biomarcadores && Object.values(biomarcadores).some(v => v != null);

  return (
    <div className="space-y-8" data-testid="aba-recuperacao-sono">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grade-biomarcadores-recuperacao">
            {BIOMARCADORES_CONFIG.map(cfg => {
              const bio = biomarcadores[cfg.key] as BiomarcadorDetalhe | null | undefined;
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
                  labelSecundario={leitura ? `Última leitura: ${leitura}` : "Média 7d"}
                  tooltip={cfg.tooltip}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
            data-testid="estado-vazio-recuperacao"
          >
            <Smartphone className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--mod-longevidade-disabled)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--mod-longevidade-text)" }} data-testid="text-vazio-recuperacao-titulo">
              Aguardando dados do Apple Health
            </p>
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-vazio-recuperacao-desc">
              Os biomarcadores de recuperação e sono aparecerão aqui assim que os dados estiverem disponíveis.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
