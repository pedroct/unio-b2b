import { useState } from "react";
import { Lock, Bell, Check } from "lucide-react";

interface AbaTrancadaProps {
  titulo: string;
  mensagem: string;
}

export function AbaTrancada({ titulo, mensagem }: AbaTrancadaProps) {
  const [notificado, setNotificado] = useState(false);

  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      data-testid={`aba-trancada-${titulo.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
    >
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--sys-bg-secondary)", border: "1px solid var(--sys-border-light)" }}
      >
        <Lock className="h-7 w-7" style={{ color: "var(--mod-longevidade-disabled)" }} />
      </div>

      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--mod-longevidade-text)" }}
        data-testid="text-titulo-trancada"
      >
        {titulo}
      </h3>

      <p
        className="text-sm max-w-md mb-6"
        style={{ color: "var(--sys-text-secondary)" }}
        data-testid="text-descricao-trancada"
      >
        {mensagem}
      </p>

      <button
        className={`notify-btn ${notificado ? "notify-btn--active" : ""}`}
        onClick={() => setNotificado(true)}
        disabled={notificado}
        data-testid="button-avisar-disponivel"
      >
        {notificado ? (
          <>
            <Check className="h-4 w-4" />
            Notificação ativada
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Me avise quando disponível
          </>
        )}
      </button>
    </div>
  );
}
