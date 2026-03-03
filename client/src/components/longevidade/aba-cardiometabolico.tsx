import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScoreCardiovascular } from "@shared/schema";

interface AbaCardiometabolicoProps {
  pacienteId: string;
}

const biomarcadoresMetabolicos = [
  { nome: "% Gordura Corporal", versao: "V2" },
  { nome: "Circunferência Abdominal", versao: "V2" },
  { nome: "Peso (tendência)", versao: "V2" },
  { nome: "Glicemia contínua", versao: "V3+" },
];

export function AbaCardiometabolico({ pacienteId }: AbaCardiometabolicoProps) {
  const { data, isLoading } = useQuery<ScoreCardiovascular>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "cardiovascular-score"],
  });

  return (
    <div className="space-y-8" data-testid="aba-cardiometabolico">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--mod-longevidade-text)" }}>
          Cardiovascular
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : data?.components ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardBiomarcador
              nome="HRV (RMSSD)"
              valor={data.components.hrv.value}
              unidade={data.components.hrv.unit}
              tendencia={data.components.hrv.trend}
              baseline={data.components.hrv.baseline}
            />
            <CardBiomarcador
              nome="Freq. Cardíaca de Repouso"
              valor={data.components.rhr.value}
              unidade={data.components.rhr.unit}
              tendencia={data.components.rhr.trend}
              baseline={data.components.rhr.baseline}
            />
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px solid var(--mod-longevidade-border)" }}
              data-testid="card-biomarcador-vo2-detalhado"
            >
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--mod-longevidade-text)" }}>
                VO₂ Máximo
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold">{data.components.vo2.value ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{data.components.vo2.unit}</span>
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--mod-longevidade-icon)" }}>
                Percentil 75 para idade e sexo
              </p>
            </div>
            <CardBiomarcador
              nome="Recuperação da FC"
              valor={data.components.recovery.value}
              unidade={data.components.recovery.unit}
              tendencia={data.components.recovery.trend}
              baseline={data.components.recovery.baseline}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Dados cardiovasculares não disponíveis.</p>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--mod-longevidade-text)" }}>
            Metabólico
          </h3>
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--mod-longevidade-disabled)" }} />
          <span className="text-[10px] font-medium text-muted-foreground">Em breve</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {biomarcadoresMetabolicos.map((bm) => (
            <div
              key={bm.nome}
              className="rounded-lg p-4 opacity-60"
              style={{ background: "var(--mod-longevidade-bg-subtle)", border: "1px dashed var(--mod-longevidade-border)" }}
              data-testid={`card-metabolico-${bm.nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3 w-3" style={{ color: "var(--mod-longevidade-disabled)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--mod-longevidade-text)" }}>{bm.nome}</p>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-[10px] text-muted-foreground mt-1">{bm.versao}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
