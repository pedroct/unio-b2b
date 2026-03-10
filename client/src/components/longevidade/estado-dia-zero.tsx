import { HeartPulse, Check, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ItemChecklist {
  nome: string;
  recebido: boolean;
}

interface EstadoDiaZeroProps {
  checklist?: ItemChecklist[];
}

const checklistPadrao: ItemChecklist[] = [
  { nome: "HRV", recebido: false },
  { nome: "Freq. Cardíaca de Repouso", recebido: false },
  { nome: "VO₂ Máximo", recebido: false },
  { nome: "Recuperação da FC", recebido: false },
];

export function EstadoDiaZero({ checklist = checklistPadrao }: EstadoDiaZeroProps) {
  const recebidos = checklist.filter((i) => i.recebido).length;
  const progresso = (recebidos / checklist.length) * 100;
  const diasEstimados = Math.max(1, 7 - recebidos * 2);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" data-testid="estado-dia-zero">
      <div
        className="h-20 w-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
      >
        <HeartPulse className="h-9 w-9" style={{ color: "var(--mod-longevidade-icon)" }} />
      </div>

      <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--mod-longevidade-text)" }}>
        Coletando seus dados
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        Estamos recebendo os dados de saúde para calcular o Score Cardiovascular. Isso pode levar alguns dias.
      </p>

      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Progresso</span>
          <span>{recebidos} de {checklist.length} biomarcadores</span>
        </div>
        <Progress value={progresso} className="h-2" />
      </div>

      <div className="w-full max-w-xs space-y-3 mb-8">
        {checklist.map((item) => (
          <div
            key={item.nome}
            className="flex items-center gap-3 text-left"
            data-testid={`checklist-${item.nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {item.recebido ? (
              <Check className="h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={`text-sm ${item.recebido ? "font-medium" : "text-muted-foreground"}`}>
              {item.nome}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Seu Score Cardiovascular estará disponível em aproximadamente {diasEstimados} {diasEstimados === 1 ? "dia" : "dias"}
      </p>
    </div>
  );
}
