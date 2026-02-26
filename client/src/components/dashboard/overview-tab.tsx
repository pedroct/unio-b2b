import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Droplets, Flame, Dumbbell, Scale, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import type { PatientOverview } from "@shared/schema";

const insightIcons = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const insightColors = {
  warning: "border-l-[#D9A441] bg-[#D9A441]/5",
  success: "border-l-[#4CA785] bg-[#4CA785]/5",
  info: "border-l-[#3D7A8C] bg-[#3D7A8C]/5",
};

const insightIconColors = {
  warning: "text-[#D9A441]",
  success: "text-[#4CA785]",
  info: "text-[#3D7A8C]",
};

const moduleIconMap = {
  nutrition: Flame,
  training: Dumbbell,
  biometry: Scale,
  hydration: Droplets,
};

interface OverviewTabProps {
  patientId: string;
}

function StatCard({ title, current, target, icon: Icon, color, unit }: {
  title: string; current: number; target: number; icon: any; color: string; unit: string;
}) {
  const percent = Math.min(Math.round((current / target) * 100), 100);
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-semibold mt-1">
              {current.toLocaleString("pt-BR")}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ {target.toLocaleString("pt-BR")} {unit}</span>
            </p>
          </div>
          <div className="rounded-md p-2" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        </div>
        <Progress value={percent} className="h-1.5" />
        <p className="text-xs text-muted-foreground mt-2">{percent}% da meta</p>
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-5 pb-4 px-5 space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-32" /><Skeleton className="h-1.5 w-full" /><Skeleton className="h-3 w-16" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="pt-5 pb-4 px-5"><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 px-5"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}

export function OverviewTab({ patientId }: OverviewTabProps) {
  const { data: overview, isLoading } = useQuery<PatientOverview>({
    queryKey: ["/api/profissional/dashboard/pacientes", patientId, "overview"],
  });

  if (isLoading || !overview) return <OverviewSkeleton />;

  const { weeklySnapshot, insights } = overview;

  const correlationData = [
    { name: "Seg", calorias: 1850, treino: 45, peso: 78.2 },
    { name: "Ter", calorias: 2100, treino: 0, peso: 78.3 },
    { name: "Qua", calorias: 1950, treino: 60, peso: 78.1 },
    { name: "Qui", calorias: 2200, treino: 50, peso: 78.0 },
    { name: "Sex", calorias: 1800, treino: 55, peso: 77.9 },
    { name: "Sáb", calorias: 2400, treino: 0, peso: 78.1 },
    { name: "Dom", calorias: 1700, treino: 0, peso: 78.0 },
  ];

  return (
    <div className="space-y-6" data-testid="tab-overview">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Calorias (média/dia)"
          current={weeklySnapshot.caloriesAvg}
          target={weeklySnapshot.caloriesTarget}
          icon={Flame}
          color="#5B8C6F"
          unit="kcal"
        />
        <StatCard
          title="Treinos (semana)"
          current={weeklySnapshot.trainingSessions}
          target={weeklySnapshot.trainingTarget}
          icon={Dumbbell}
          color="#D97952"
          unit="sessões"
        />
        <StatCard
          title="Hidratação (média/dia)"
          current={weeklySnapshot.hydrationAvg}
          target={weeklySnapshot.hydrationTarget}
          icon={Droplets}
          color="#6BA3BE"
          unit="ml"
        />
      </div>

      {weeklySnapshot.weightChange !== 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-muted/50">
          {weeklySnapshot.weightChange < 0 ? (
            <TrendingDown className="h-4 w-4 text-[#4CA785]" />
          ) : weeklySnapshot.weightChange > 0 ? (
            <TrendingUp className="h-4 w-4 text-[#D97952]" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            Variação de peso na semana:{" "}
            <span className="font-semibold">
              {weeklySnapshot.weightChange > 0 ? "+" : ""}
              {weeklySnapshot.weightChange.toFixed(1)} kg
            </span>
          </span>
        </div>
      )}

      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight) => {
              const InsightIcon = insightIcons[insight.type];
              const ModuleIcon = moduleIconMap[insight.module];
              return (
                <div
                  key={insight.id}
                  className={`flex items-start gap-3 rounded-md border-l-[3px] p-4 ${insightColors[insight.type]}`}
                  data-testid={`insight-${insight.id}`}
                >
                  <InsightIcon className={`h-4 w-4 mt-0.5 shrink-0 ${insightIconColors[insight.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{insight.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calorias vs. Treino (Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={correlationData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar yAxisId="left" dataKey="calorias" name="Calorias (kcal)" fill="#5B8C6F" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="treino" name="Treino (min)" fill="#D97952" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução do Peso (Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="peso"
                  name="Peso (kg)"
                  stroke="#3D7A8C"
                  fill="#3D7A8C"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
