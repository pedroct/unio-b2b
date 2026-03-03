import { useQuery } from "@tanstack/react-query";
import { Lock, Bell } from "lucide-react";
import { CardBiomarcador } from "./card-biomarcador";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScoreCardiovascular } from "@shared/schema";

interface AbaCardiometabolicoProps {
  pacienteId: string;
}

const biomarcadoresMetabolicos = [
  { nome: "% Gordura corporal" },
  { nome: "Circunferência abdominal" },
  { nome: "Tendência de peso" },
  { nome: "Glicemia (CGM)" },
];

export function AbaCardiometabolico({ pacienteId }: AbaCardiometabolicoProps) {
  const { data, isLoading } = useQuery<ScoreCardiovascular>({
    queryKey: ["/api/profissional/dashboard/pacientes", pacienteId, "cardiovascular-score"],
  });

  return (
    <div className="space-y-8" data-testid="aba-cardiometabolico">
      <section>
        <h3 className="section-label-longevidade mb-4" data-testid="label-cardiovascular">
          Cardiovascular
        </h3>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-lg" />
              ))}
            </div>
          </div>
        ) : data?.components ? (
          <div className="space-y-6">
            <div>
              <p className="axis-sublabel mb-3" data-testid="label-eixo-autonomico">Controle autonômico</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CardBiomarcador
                  nome="HRV (RMSSD)"
                  valor={data.components.hrv.value}
                  unidade={data.components.hrv.unit}
                  tendencia={data.components.hrv.trend}
                  baseline={data.components.hrv.baseline}
                  sparklineData={data.components.hrv.sparkline}
                />
                <CardBiomarcador
                  nome="FC de Repouso"
                  valor={data.components.rhr.value}
                  unidade={data.components.rhr.unit}
                  tendencia={data.components.rhr.trend}
                  baseline={data.components.rhr.baseline}
                  invertedSemantics
                  sparklineData={data.components.rhr.sparkline}
                />
              </div>
            </div>

            <div>
              <p className="axis-sublabel mb-3" data-testid="label-eixo-aerobio">Capacidade aeróbia</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CardBiomarcador
                  nome="VO₂ Máximo"
                  valor={data.components.vo2.value}
                  unidade={data.components.vo2.unit}
                  tendencia={data.components.vo2.trend}
                  baseline={data.components.vo2.baseline}
                  labelSecundario="P75 · idade/sexo"
                  sparklineData={data.components.vo2.sparkline}
                />
                <CardBiomarcador
                  nome="Recuperação da FC"
                  valor={data.components.recovery.value}
                  unidade={data.components.recovery.unit}
                  tendencia={data.components.recovery.trend}
                  baseline={data.components.recovery.baseline}
                  labelSecundario="Média das últimas 5 sessões"
                  sparklineData={data.components.recovery.sparkline}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Dados cardiovasculares não disponíveis.</p>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="section-label-longevidade" data-testid="label-metabolico">
            Metabólico
          </h3>
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--mod-longevidade-disabled)" }} />
          <span className="text-[10px] font-medium" style={{ color: "var(--sys-text-muted)" }}>Em breve</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {biomarcadoresMetabolicos.map((bm) => (
            <div
              key={bm.nome}
              className="rounded-lg p-4 opacity-60"
              style={{ background: "var(--sys-bg-secondary)", border: "1px dashed var(--sys-border-light)" }}
              data-testid={`card-metabolico-${bm.nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3 w-3" style={{ color: "var(--sys-text-muted)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--sys-text-muted)" }}>{bm.nome}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--sys-text-muted)" }}>—</p>
              <p className="text-[10px]" style={{ color: "var(--sys-text-muted)" }}>Disponível em breve</p>
            </div>
          ))}
        </div>

        <button
          className="flex items-center gap-1.5 mt-4 text-xs font-medium hover:underline cursor-pointer"
          style={{ color: "var(--mod-longevidade-base)" }}
          data-testid="button-avise-metabolico"
        >
          <Bell className="h-3.5 w-3.5" />
          Me avise quando disponível
        </button>
      </section>
    </div>
  );
}
