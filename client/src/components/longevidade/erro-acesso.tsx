import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ErroAcessoPacienteProps {
  tipo: "forbidden" | "not-found";
}

export function ErroAcessoPaciente({ tipo }: ErroAcessoPacienteProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center" data-testid="erro-acesso-paciente">
      <div
        className="rounded-full p-4 mb-6"
        style={{ background: "var(--sys-bg-secondary)" }}
      >
        <ShieldAlert className="h-10 w-10" style={{ color: "var(--sys-text-muted)" }} />
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--sys-text-primary)" }}>
        {tipo === "forbidden"
          ? "Acesso não autorizado"
          : "Cliente não encontrado"}
      </h2>
      <p className="text-sm mb-6 max-w-md" style={{ color: "var(--sys-text-secondary)" }}>
        {tipo === "forbidden"
          ? "Você não possui acesso clínico autorizado a este paciente."
          : "O cliente solicitado não foi encontrado no sistema."}
      </p>
      <Link href="/pacientes">
        <Button variant="outline" data-testid="button-voltar-listagem">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para listagem
        </Button>
      </Link>
    </div>
  );
}
