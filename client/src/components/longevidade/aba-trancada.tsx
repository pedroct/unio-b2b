import { Lock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AbaTrancadaProps {
  titulo: string;
  mensagem: string;
}

export function AbaTrancada({ titulo, mensagem }: AbaTrancadaProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center" data-testid={`aba-trancada-${titulo.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--mod-longevidade-bg)", border: "1px solid var(--mod-longevidade-border)" }}
      >
        <Lock className="h-7 w-7" style={{ color: "var(--mod-longevidade-icon)" }} />
      </div>

      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--mod-longevidade-text)" }}>
        {titulo}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {mensagem}
      </p>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        style={{ borderColor: "var(--mod-longevidade-border)", color: "var(--mod-longevidade-text)" }}
        onClick={() => {}}
        data-testid="button-avisar-disponivel"
      >
        <Bell className="h-4 w-4" />
        Me avise quando disponível
      </Button>
    </div>
  );
}
