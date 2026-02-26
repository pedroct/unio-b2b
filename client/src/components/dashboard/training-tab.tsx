import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Clock, Target, CheckCircle2, XCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { EmptyState } from "@/components/empty-state";
import type { TrainingSummary } from "@shared/schema";

interface TrainingTabProps {
  patientId: string;
}

function RpeBadge({ rpe }: { rpe: number }) {
  const color = rpe >= 9 ? "destructive" : rpe >= 7 ? "secondary" : "default";
  return (
    <Badge variant={color} className="text-xs font-mono">
      PSE {rpe}
    </Badge>
  );
}

function TrainingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-5 pb-4 px-5 space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-16" /><Skeleton className="h-3 w-24" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="pt-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
    </div>
  );
}

export function TrainingTab({ patientId }: TrainingTabProps) {
  const { data: training, isLoading } = useQuery<TrainingSummary>({
    queryKey: ["/api/profissional/dashboard/pacientes", patientId, "treinamento"],
  });

  if (isLoading) return <TrainingSkeleton />;

  if (!training || training.sessions.length === 0) {
    return (
      <EmptyState
        icon={<Dumbbell className="h-12 w-12" />}
        title="Sem dados de treinamento"
        description="Este módulo está sendo finalizado. Quando o paciente registrar suas sessões de treino, os dados de volume, carga e PSE aparecerão aqui."
        module="training"
      />
    );
  }

  const volumeData = training.sessions
    .filter(s => s.completed)
    .slice(-10)
    .map(s => ({
      name: s.date,
      volume: s.volumeLoad,
      rpe: s.rpe,
    }));

  return (
    <div className="space-y-6" data-testid="tab-training">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total de Sessões</p>
              <div className="rounded-md p-2" style={{ backgroundColor: "#D9795215" }}>
                <Target className="h-4 w-4" style={{ color: "#D97952" }} />
              </div>
            </div>
            <p className="text-2xl font-semibold mt-1">{training.totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">Média de {training.weeklyAverage.toFixed(1)} por semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aderência</p>
              <div className="rounded-md p-2" style={{ backgroundColor: "#4CA78515" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "#4CA785" }} />
              </div>
            </div>
            <p className="text-2xl font-semibold mt-1">{training.adherencePercent}%</p>
            <Progress value={training.adherencePercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">PSE Médio</p>
              <div className="rounded-md p-2" style={{ backgroundColor: "#3D7A8C15" }}>
                <Dumbbell className="h-4 w-4" style={{ color: "#3D7A8C" }} />
              </div>
            </div>
            {(() => {
              const completedSessions = training.sessions.filter(s => s.completed);
              const avgRpe = completedSessions.length > 0
                ? (completedSessions.reduce((acc, s) => acc + s.rpe, 0) / completedSessions.length).toFixed(1)
                : "–";
              return <p className="text-2xl font-semibold mt-1">{avgRpe}</p>;
            })()}
            <p className="text-xs text-muted-foreground mt-1">Percepção Subjetiva de Esforço</p>
          </CardContent>
        </Card>
      </div>

      {volumeData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume de Carga por Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Volume (kg)") return [`${value.toLocaleString("pt-BR")} kg`, name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="volume" name="Volume (kg)" fill="#D97952" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sessões Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {training.sessions.slice().reverse().map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                data-testid={`session-${session.id}`}
              >
                <div className="flex items-center gap-3">
                  {session.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#4CA785] shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{session.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{session.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.duration} min
                      </span>
                      <span>{session.exercises} exercícios</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{session.volumeLoad.toLocaleString("pt-BR")} kg</span>
                  <RpeBadge rpe={session.rpe} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
