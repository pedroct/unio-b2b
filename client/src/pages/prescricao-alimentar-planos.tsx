import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ModalNovoPlano } from "@/components/dashboard/modal-novo-plano";
import { normalizarResumoPlano } from "@/lib/api-normalizers";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, ResumoPlanoAlimentar } from "@shared/schema";

const DIAS_ABREV: Record<string, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
  domingo: "Dom",
};
const DIAS_ORDEM = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

function PlanoSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  );
}

interface ModalEditarPlanoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: ResumoPlanoAlimentar;
  pacienteId: string;
  onSave: (novaDescricao: string) => void;
}

function ModalEditarPlano({ open, onOpenChange, plano, onSave }: ModalEditarPlanoProps) {
  const [descricao, setDescricao] = useState(plano.descricao);

  useEffect(() => {
    if (open) setDescricao(plano.descricao);
  }, [open, plano.descricao]);

  function handleSave() {
    const trimmed = descricao.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" data-testid="modal-editar-plano">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Editar plano</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Altere o nome deste plano alimentar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="editar-plano-descricao" className="text-sm font-medium">
              Nome do plano
            </Label>
            <Input
              id="editar-plano-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="Ex: Dieta Low Carb"
              data-testid="input-editar-plano-descricao"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancelar-editar-plano"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!descricao.trim()}
            data-testid="button-salvar-editar-plano"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PrescricaoAlimentarPlanosPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/prescricao-alimentar/:pacienteId");
  const pacienteId = params?.pacienteId || "";
  const [, navigate] = useLocation();

  const [modalNovoPlanoAberto, setModalNovoPlanoAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<ResumoPlanoAlimentar | null>(null);
  const [planoExcluindo, setPlanoExcluindo] = useState<ResumoPlanoAlimentar | null>(null);

  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: ["/api/profissional/pacientes", pacienteId],
    enabled: !!pacienteId,
  });

  const planosQueryKey = [
    "/api/profissional/dashboard/pacientes",
    pacienteId,
    "planos-alimentares",
  ];

  const { data: planos, isLoading: isLoadingPlanos } = useQuery<ResumoPlanoAlimentar[]>({
    queryKey: planosQueryKey,
    enabled: !!pacienteId,
    select: (raw: any) => (Array.isArray(raw) ? raw : []).map(normalizarResumoPlano),
  });

  const initials = patient?.name
    ? patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  function handleEditarPlano(novaDescricao: string) {
    if (!planoEditando) return;
    queryClient.setQueryData(planosQueryKey, (old: ResumoPlanoAlimentar[] | undefined) => {
      if (!old) return old;
      return old.map((p) =>
        p.id === planoEditando.id ? { ...p, descricao: novaDescricao } : p
      );
    });
    toast({ title: "Plano atualizado com sucesso" });
    setPlanoEditando(null);
  }

  function handleExcluirPlano() {
    if (!planoExcluindo) return;
    queryClient.setQueryData(planosQueryKey, (old: ResumoPlanoAlimentar[] | undefined) => {
      if (!old) return old;
      return old.filter((p) => p.id !== planoExcluindo.id);
    });
    toast({ title: "Plano excluído com sucesso" });
    setPlanoExcluindo(null);
  }

  const isLoading = isLoadingPatient || isLoadingPlanos;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="page-prescricao-planos">
      <div className="flex items-center gap-3">
        <Link href="/prescricao-alimentar">
          <Button variant="ghost" size="icon" data-testid="button-back-planos">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {isLoadingPatient ? (
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        ) : patient ? (
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl font-semibold tracking-tight"
                  data-testid="text-planos-titulo"
                >
                  Prescrição alimentar
                </h1>
                <Badge variant="outline" className="text-xs">
                  {patient.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Planos alimentares cadastrados
              </p>
            </div>
          </div>
        ) : null}

        <Button
          onClick={() => setModalNovoPlanoAberto(true)}
          data-testid="button-novo-plano"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo plano
        </Button>
      </div>

      {isLoadingPlanos ? (
        <div className="space-y-3">
          <PlanoSkeleton />
          <PlanoSkeleton />
        </div>
      ) : !planos || planos.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-12 w-12" />}
          title="Nenhum plano alimentar"
          description="Crie o primeiro plano alimentar para este cliente."
          module="nutrition"
          action={
            <Button onClick={() => setModalNovoPlanoAberto(true)} data-testid="button-criar-primeiro-plano">
              <Plus className="h-4 w-4 mr-2" />
              Criar plano alimentar
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {planos.map((plano) => {
            const diasOrdenados = DIAS_ORDEM.filter((d) => plano.diasAtivos.includes(d as any));
            return (
              <Card
                key={plano.id}
                className="group hover:shadow-sm transition-shadow"
                data-testid={`card-plano-${plano.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-semibold text-sm truncate"
                          data-testid={`text-plano-descricao-${plano.id}`}
                        >
                          {plano.descricao}
                        </span>
                        <Badge
                          variant={plano.status === "ativo" ? "default" : "secondary"}
                          className="text-xs capitalize shrink-0"
                          data-testid={`badge-plano-status-${plano.id}`}
                        >
                          {plano.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                          data-testid={`text-plano-refeicoes-${plano.id}`}
                        >
                          <Clock className="h-3 w-3" />
                          {plano.totalRefeicoes} {plano.totalRefeicoes !== 1 ? "refeições" : "refeição"}
                        </span>

                        {diasOrdenados.length > 0 && (
                          <span
                            className="flex items-center gap-1 text-xs text-muted-foreground"
                            data-testid={`text-plano-dias-${plano.id}`}
                          >
                            <Calendar className="h-3 w-3" />
                            {diasOrdenados.map((d) => DIAS_ABREV[d]).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar nome do plano"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanoEditando(plano);
                        }}
                        data-testid={`button-editar-plano-${plano.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Excluir plano"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanoExcluindo(plano);
                        }}
                        data-testid={`button-excluir-plano-${plano.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/prescricao-alimentar/${pacienteId}/plano/${plano.id}`)
                      }
                      data-testid={`button-gerenciar-plano-${plano.id}`}
                    >
                      Gerenciar refeições
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ModalNovoPlano
        open={modalNovoPlanoAberto}
        onOpenChange={setModalNovoPlanoAberto}
        pacienteId={pacienteId}
        diasOcupados={(planos ?? []).map((p) => p.diasAtivos)}
        onSuccess={(novo) => {
          navigate(`/prescricao-alimentar/${pacienteId}/plano/${novo.id}`);
        }}
      />

      {planoEditando && (
        <ModalEditarPlano
          open={!!planoEditando}
          onOpenChange={(open) => { if (!open) setPlanoEditando(null); }}
          plano={planoEditando}
          pacienteId={pacienteId}
          onSave={handleEditarPlano}
        />
      )}

      <AlertDialog
        open={!!planoExcluindo}
        onOpenChange={(open) => { if (!open) setPlanoExcluindo(null); }}
      >
        <AlertDialogContent data-testid="dialog-confirmar-exclusao-plano">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano alimentar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano{" "}
              <strong>{planoExcluindo?.descricao}</strong>? Todas as refeições
              cadastradas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-exclusao-plano">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-exclusao-plano"
              onClick={handleExcluirPlano}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
