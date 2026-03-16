import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, Moon, Dumbbell, Lock, Bell, Check } from "lucide-react";
import { CardScore } from "./card-score";
import { GradeGenerica } from "./card-biomarcador";
import type { BiomarcadorItem } from "./card-biomarcador";
import { GraficoTendenciaScore } from "./grafico-tendencia-score";
import { EstadoDiaZero } from "./estado-dia-zero";
import type { RespostaCockpit, RespostaCardiometabolico, ScorePilar, ComponentesCockpit } from "@shared/schema";
import { CLASSIFICACAO_FROM_LABEL, TENDENCIA_FROM_API, classificacaoVO2FromScore } from "@shared/schema";
import { TOOLTIPS_SCORES, TOOLTIPS_COMPONENTES } from "./tooltips-longevidade";
import type { TendenciaBiomarcador } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AbaCockpitProps {
  pacienteId: string;
}

const ICONES_PILAR: Record<string, typeof Activity> = {
  metabolic: Activity,
  recovery: Moon,
  functional: Dumbbell,
};

const LABELS_PILAR: Record<string, string> = {
  cardiovascular: "Score cardiovascular",
  metabolic: "Score metabólico",
  recovery: "Score recuperação",
  functional: "Score funcional",
};

const LABELS_COMPONENTES: Record<string, string> = {
  cardiovascular: "Componentes do score cardiovascular",
  metabolic: "Componentes do score metabólico",
  recovery: "Componentes do score recuperação",
  functional: "Componentes do score funcional",
};

const TIPO_TO_COMPONENTE: Record<string, string> = {
  metabolic: "score_metabolico",
  recovery: "score_recuperacao",
  functional: "score_funcional",
};

const ORDEM_PILARES = ["cardiovascular", "metabolic", "recovery", "functional"];

interface ComponenteConfig {
  key: string;
  nome: string;
  defaultUnit: string;
  invertedSemantics?: boolean;
  defaultReferencia?: string;
  tooltip?: string;
}

const COMPONENTES_POR_PILAR: Record<string, ComponenteConfig[]> = {
  cardiovascular: [
    { key: "hrv",        nome: "HRV",               defaultUnit: "ms",        tooltip: TOOLTIPS_COMPONENTES.hrv },
    { key: "fcr",        nome: "FC de repouso",      defaultUnit: "bpm",       invertedSemantics: true, tooltip: TOOLTIPS_COMPONENTES.fcr },
    { key: "vo2",        nome: "VO₂ máximo",         defaultUnit: "mL/kg/min", tooltip: TOOLTIPS_COMPONENTES.vo2 },
    { key: "recuperacao",nome: "Recuperação da FC",  defaultUnit: "bpm",       defaultReferencia: "Média das últimas 5 sessões", tooltip: TOOLTIPS_COMPONENTES.recuperacao },
  ],
  metabolic: [
    { key: "gordura",       nome: "Gordura corporal",  defaultUnit: "%",  invertedSemantics: true,  tooltip: TOOLTIPS_COMPONENTES.gordura },
    { key: "cintura",       nome: "Cintura",            defaultUnit: "cm", invertedSemantics: true,  tooltip: TOOLTIPS_COMPONENTES.cintura },
    { key: "massa_magra",   nome: "Massa magra",        defaultUnit: "kg", invertedSemantics: false, tooltip: TOOLTIPS_COMPONENTES.massa_magra },
    { key: "tendencia_peso",nome: "Tendência de peso",  defaultUnit: "kg", invertedSemantics: false, tooltip: TOOLTIPS_COMPONENTES.tendencia_peso },
  ],
  recovery: [
    { key: "sono_total",      nome: "Sono total",   defaultUnit: "min", tooltip: TOOLTIPS_COMPONENTES.sono_total },
    { key: "sono_rem_profundo",nome: "REM + profundo",defaultUnit: "min", tooltip: TOOLTIPS_COMPONENTES.sono_rem_profundo },
    { key: "hrv_noturna",     nome: "HRV noturna",  defaultUnit: "ms",  tooltip: TOOLTIPS_COMPONENTES.hrv_noturna },
    { key: "fc_noturna",      nome: "FC noturna",   defaultUnit: "bpm", invertedSemantics: true, tooltip: TOOLTIPS_COMPONENTES.fc_noturna },
  ],
  functional: [
    { key: "velocidade_caminhada", nome: "Velocidade de caminhada", defaultUnit: "m/s",        defaultReferencia: "Média 30d", tooltip: TOOLTIPS_COMPONENTES.velocidade_caminhada },
    { key: "forca",               nome: "Força",                   defaultUnit: "nível",       defaultReferencia: "Avaliação funcional", tooltip: TOOLTIPS_COMPONENTES.forca },
    { key: "volume_treino",       nome: "Volume de treino",        defaultUnit: "min/semana",  defaultReferencia: "Total 7 dias", tooltip: TOOLTIPS_COMPONENTES.volume_treino },
    { key: "estabilidade",        nome: "Estabilidade",            defaultUnit: "%",           defaultReferencia: "Estabilidade ao caminhar", tooltip: TOOLTIPS_COMPONENTES.estabilidade },
  ],
};

function normTrend(t: string | null | undefined): TendenciaBiomarcador {
  if (!t) return null;
  return TENDENCIA_FROM_API[t] ?? TENDENCIA_FROM_API[t.toLowerCase()] ?? null;
}

function normClassificacao(c: string | null | undefined) {
  if (!c) return null;
  return CLASSIFICACAO_FROM_LABEL[c] ?? CLASSIFICACAO_FROM_LABEL[c.toLowerCase()] ?? null;
}

function resolveVO2Referencia(comp: NonNullable<ComponentesCockpit[string]>): string | undefined {
  if (comp.percentile != null && comp.percentile_context) {
    return `P${comp.percentile} - ${comp.percentile_context}`;
  }
  if (comp.score != null) {
    return classificacaoVO2FromScore(comp.score);
  }
  return undefined;
}

function formatarBrCockpit(valor: number | null, casas = 1): string | null {
  if (valor === null) return null;
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

function formatarTendenciaPeso(valor: number | null, unidade: string): string | null {
  if (valor === null) return null;
  const abs = Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (valor > 0) return `+${abs} ${unidade}`;
  if (valor < 0) return `\u2212${abs} ${unidade}`;
  return `0,00 ${unidade}`;
}

function mapReferencia(ref: string | null | undefined): string | undefined {
  if (!ref) return undefined;
  const lower = ref.toLowerCase();
  if (lower === "clínico" || lower === "clinico") return "Último registro";
  if (lower === "soma 7d" || lower === "soma 7 dias") return "Total 7 dias";
  if (lower === "média 7d") return "Média 7 dias";
  return ref;
}

function buildBiomarcadorItems(componentes: ComponentesCockpit, pilarTipo: string): BiomarcadorItem[] {
  const configs = COMPONENTES_POR_PILAR[pilarTipo];
  if (!configs) return [];
  return configs
    .map((cfg) => {
      const comp = componentes[cfg.key];
      const isVO2 = cfg.key === "vo2";
      const isPeso = cfg.key === "tendencia_peso";
      const rawValue = comp?.valor ?? null;
      const unit = comp?.unidade ?? cfg.defaultUnit;

      const referencia = comp
        ? (isVO2 ? resolveVO2Referencia(comp) : mapReferencia(comp.referencia ?? cfg.defaultReferencia))
        : mapReferencia(cfg.defaultReferencia);

      let valorFormatado: string | null = comp?.valor_formatado ?? null;
      if (!valorFormatado && rawValue !== null) {
        if (isPeso) {
          valorFormatado = formatarTendenciaPeso(rawValue, unit);
        } else {
          const casas = unit === "mL/kg/min" ? 2 : 1;
          const formatted = formatarBrCockpit(rawValue, casas);
          if (formatted !== null) valorFormatado = `${formatted} ${unit}`;
        }
      }

      return {
        key: cfg.key,
        nome: cfg.nome,
        value: rawValue,
        valorFormatado,
        unit,
        trend: normTrend(comp?.tendencia),
        referencia,
        invertedSemantics: cfg.invertedSemantics,
        tooltip: cfg.tooltip,
      };
    });
}

function buildCardioFromLegacy(cardio: RespostaCardiometabolico): BiomarcadorItem[] {
  const configs = COMPONENTES_POR_PILAR.cardiovascular;
  const metricMap: Record<string, string> = {
    hrv: "hrv_rmssd",
    fcr: "resting_hr",
    vo2: "vo2_max",
    recuperacao: "hr_recovery_1min",
  };
  return configs
    .map((cfg) => {
      const m = cardio.metricas_cardio.find(mc => mc.metric_type === metricMap[cfg.key]);
      if (!m || m.valor_atual === null) return null;
      const unit = m.unidade ?? cfg.defaultUnit;
      const casas = unit === "mL/kg/min" ? 2 : 1;
      const formatted = formatarBrCockpit(m.valor_atual, casas);
      const valorFormatado = formatted !== null ? `${formatted} ${unit}` : null;
      return {
        key: cfg.key,
        nome: cfg.nome,
        value: m.valor_atual,
        valorFormatado,
        unit,
        trend: normTrend(m.tendencia),
        baseline: m.media_30d ?? undefined,
        referencia: cfg.defaultReferencia,
        invertedSemantics: cfg.invertedSemantics,
        tooltip: cfg.tooltip,
      };
    })
    .filter((item): item is BiomarcadorItem => item !== null);
}

export function AbaCockpit({ pacienteId }: AbaCockpitProps) {
  const { toast } = useToast();
  const [interesseRegistrado, setInteresseRegistrado] = useState<Set<string>>(new Set());

  const { data: cockpit, isLoading: loadingCockpit } = useQuery<RespostaCockpit>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cockpit"],
  });

  const scoreCV = cockpit?.scores?.find(s => s.tipo === "cardiovascular");
  const temComponentesCockpit = !!scoreCV?.componentes;

  const { data: cardio, isLoading: loadingCardio } = useQuery<RespostaCardiometabolico>({
    queryKey: ["/api/painel-longevidade/clientes", pacienteId, "cardiometabolico"],
    enabled: !!scoreCV?.ativo && !temComponentesCockpit,
  });

  const interesseMutation = useMutation({
    mutationFn: async (componente: string) => {
      await apiRequest("POST", "/api/painel-longevidade/interesse", { componente });
    },
    onSuccess: (_data, componente) => {
      setInteresseRegistrado(prev => new Set(prev).add(componente));
      toast({
        title: "Interesse registrado",
        description: "Você será notificado quando este módulo estiver disponível.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu interesse. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const isLoading = loadingCockpit;

  if (!isLoading && !cockpit) {
    return <EstadoDiaZero />;
  }

  const sortedScores = cockpit?.scores
    ? [...cockpit.scores].sort((a, b) => {
        const ia = ORDEM_PILARES.indexOf(a.tipo);
        const ib = ORDEM_PILARES.indexOf(b.tipo);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    : [];

  const ativosScores = sortedScores.filter(s => s.ativo !== false);
  const inativosScores = sortedScores.filter(s => s.ativo === false);

  return (
    <div className="space-y-6" data-testid="aba-cockpit">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {ativosScores.map((pilar: ScorePilar) => {
          const classificacao = normClassificacao(pilar.classificacao);
          const tendenciaRaw = pilar.tendencia_score ?? pilar.tendencia ?? null;
          const tendencia = normTrend(tendenciaRaw);
          return (
            <div key={pilar.tipo} className="lg:col-span-1">
              <CardScore
                score={pilar.score}
                classification={classificacao}
                tendencia={tendencia}
                is_partial={pilar.is_partial ?? false}
                updated_at={cockpit?.data_atualizacao ?? null}
                isLoading={isLoading}
                pilarTipo={pilar.tipo}
                tooltip={TOOLTIPS_SCORES[pilar.tipo]}
              />
            </div>
          );
        })}

        {inativosScores.map((sf: ScorePilar) => {
          const Icone = ICONES_PILAR[sf.tipo] ?? Activity;
          const label = LABELS_PILAR[sf.tipo] ?? sf.tipo;
          const componente = TIPO_TO_COMPONENTE[sf.tipo] ?? sf.tipo;
          const jaRegistrou = interesseRegistrado.has(componente);
          return (
            <div
              key={sf.tipo}
              className="rounded-xl p-5 h-full flex flex-col items-center justify-center text-center"
              style={{ background: "var(--sys-bg-secondary)", border: "1px solid var(--sys-border-light)" }}
              data-testid={`card-score-futuro-${sf.tipo}`}
            >
              <div className="relative mb-3">
                <Icone className="h-6 w-6" style={{ color: "var(--sys-text-muted)" }} />
                <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5" style={{ color: "var(--sys-text-muted)" }} />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--sys-text-muted)" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--sys-text-muted)" }}>—</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--sys-text-muted)" }}>
                {sf.mensagem_bloqueio ?? "Disponível em breve"}
              </p>
              <button
                className="text-[10px] mt-2 flex items-center gap-1 hover:underline disabled:opacity-50 disabled:cursor-default disabled:no-underline"
                style={{ color: jaRegistrou ? "var(--sys-success)" : "var(--mod-longevidade-base)" }}
                onClick={() => interesseMutation.mutate(componente)}
                disabled={jaRegistrou || interesseMutation.isPending}
                data-testid={`button-avisar-${sf.tipo}`}
              >
                {jaRegistrou ? (
                  <>
                    <Check className="h-3 w-3" />
                    Interesse registrado
                  </>
                ) : (
                  <>
                    <Bell className="h-3 w-3" />
                    Me avise quando disponível
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {ativosScores.map((pilar) => {
        let items: BiomarcadorItem[] | null = null;

        if (pilar.componentes && Object.keys(pilar.componentes).length > 0) {
          items = buildBiomarcadorItems(pilar.componentes, pilar.tipo);
        } else if (pilar.tipo === "cardiovascular" && cardio && !loadingCardio) {
          items = buildCardioFromLegacy(cardio);
        }

        if (!items || items.length === 0) {
          if (pilar.score != null) {
            return (
              <div key={`componentes-${pilar.tipo}`}>
                <h3 className="section-label-longevidade mb-3" data-testid={`label-componentes-${pilar.tipo}`}>
                  {LABELS_COMPONENTES[pilar.tipo] ?? pilar.tipo}
                </h3>
                <p className="text-sm text-muted-foreground">Dados dos componentes serão disponibilizados em breve.</p>
              </div>
            );
          }
          return null;
        }

        return (
          <div key={`componentes-${pilar.tipo}`}>
            <h3 className="section-label-longevidade mb-3" data-testid={`label-componentes-${pilar.tipo}`}>
              {LABELS_COMPONENTES[pilar.tipo] ?? pilar.tipo}
            </h3>
            <GradeGenerica items={items} testId={`grade-biomarcadores-${pilar.tipo}`} />
          </div>
        );
      })}

      <GraficoTendenciaScore pacienteId={pacienteId} />
    </div>
  );
}
