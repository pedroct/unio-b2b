import { useQuery } from "@tanstack/react-query";
import { Activity, Moon, Dumbbell, Lock } from "lucide-react";
import { CardScore } from "./card-score";
import { GradeBiomarcadores } from "./card-biomarcador";
import { GraficoTendenciaScore } from "./grafico-tendencia-score";
import { EstadoDiaZero } from "./estado-dia-zero";
import type { ScoreCardiovascular } from "@shared/schema";

interface AbaCockpitProps {
  pacienteId: string;
}

const scoresFuturos = [
  { nome: "Score Metabólico", icone: Activity, versao: "V2" },
  { nome: "Score Recuperação", icone: Moon, versao: "V2" },
  { nome: "Score Funcional", icone: Dumbbell, versao: "V3" },
];

export function AbaCockpit({ pacienteId }: AbaCockpitProps) {
  const { data, isLoading } = useQuery<ScoreCardiovascular>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "cardiovascular-score"],
  });

  if (!isLoading && !data) {
    return <EstadoDiaZero />;
  }

  return (
    <div className="space-y-6" data-testid="aba-cockpit">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <CardScore
            score={data?.score ?? null}
            classification={data?.classification ?? null}
            delta_30d={data?.delta_30d ?? null}
            updated_at={data?.updated_at ?? null}
            isLoading={isLoading}
          />
        </div>

        {scoresFuturos.map((sf) => (
          <div
            key={sf.nome}
            className="rounded-xl p-5 flex flex-col items-center justify-center text-center"
            style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
            data-testid={`card-score-futuro-${sf.nome.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="relative mb-3">
              <sf.icone className="h-6 w-6" style={{ color: "var(--mod-longevidade-disabled)" }} />
              <Lock className="h-3 w-3 absolute -bottom-0.5 -right-0.5" style={{ color: "var(--mod-longevidade-disabled)" }} />
            </div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--mod-longevidade-text)" }}>{sf.nome}</p>
            <p className="font-serif text-2xl font-bold text-muted-foreground">—</p>
            <p className="text-[10px] text-muted-foreground mt-1">Em breve ({sf.versao})</p>
          </div>
        ))}
      </div>

      {data?.components && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--mod-longevidade-text)" }}>
            Componentes do Score
          </h3>
          <GradeBiomarcadores componentes={data.components} />
        </div>
      )}

      <GraficoTendenciaScore pacienteId={pacienteId} />
    </div>
  );
}
