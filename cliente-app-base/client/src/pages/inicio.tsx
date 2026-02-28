import { useLocation } from "wouter";
import { UtensilsCrossed, Dumbbell, Activity, Droplets } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

const modulos = [
  {
    titulo: "Nutrição",
    descricao: "Acompanhe sua alimentação diária",
    icon: UtensilsCrossed,
    cor: "#5B8C6F",
    url: "/nutricao",
  },
  {
    titulo: "Treino",
    descricao: "Veja seus treinos e evolução",
    icon: Dumbbell,
    cor: "#D97952",
    url: "/treino",
  },
  {
    titulo: "Biometria",
    descricao: "Acompanhe sua evolução corporal",
    icon: Activity,
    cor: "#3D7A8C",
    url: "/biometria",
  },
  {
    titulo: "Hidratação",
    descricao: "Mantenha-se hidratado",
    icon: Droplets,
    cor: "#6BA3BE",
    url: "/hidratacao",
  },
];

export default function InicioPage() {
  const { cliente } = useAuth();
  const [, navigate] = useLocation();

  const primeiroNome = cliente?.nome?.split(" ")[0] || "Cliente";

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="page-inicio">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-welcome">
          Olá, {primeiroNome}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe seus dados de saúde em um único lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modulos.map((modulo) => (
          <Card
            key={modulo.titulo}
            className="cursor-pointer transition-colors hover:border-primary/30"
            onClick={() => navigate(modulo.url)}
            data-testid={`card-${modulo.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${modulo.cor}15` }}
              >
                <modulo.icon className="h-5 w-5" style={{ color: modulo.cor }} />
              </div>
              <div>
                <CardTitle className="text-base">{modulo.titulo}</CardTitle>
                <CardDescription className="text-sm">{modulo.descricao}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
