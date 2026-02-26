import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { EmptyState } from "@/components/empty-state";
import type { BiometrySummary } from "@shared/schema";

interface BiometryTabProps {
  patientId: string;
}

function TrendIndicator({ trend, label, inverse }: { trend: "up" | "down" | "stable"; label: string; inverse?: boolean }) {
  const isGood = inverse ? trend === "up" : trend === "down";
  const isBad = inverse ? trend === "down" : trend === "up";

  return (
    <div className="flex items-center gap-1.5">
      {trend === "up" && <TrendingUp className={`h-3.5 w-3.5 ${isGood ? "text-[#4CA785]" : "text-[#D9635C]"}`} />}
      {trend === "down" && <TrendingDown className={`h-3.5 w-3.5 ${isGood ? "text-[#4CA785]" : "text-[#D9635C]"}`} />}
      {trend === "stable" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function MetricCard({ title, value, unit, trend, trendLabel, inverse, color }: {
  title: string; value: number; unit: string; trend: "up" | "down" | "stable"; trendLabel: string; inverse?: boolean; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <p className="text-2xl font-semibold mt-1">
          {value.toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </p>
        <div className="mt-2">
          <TrendIndicator trend={trend} label={trendLabel} inverse={inverse} />
        </div>
      </CardContent>
    </Card>
  );
}

function BiometrySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-5 pb-4 px-5 space-y-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-7 w-24" /><Skeleton className="h-3 w-20" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="pt-5"><Skeleton className="h-72 w-full" /></CardContent></Card>
    </div>
  );
}

export function BiometryTab({ patientId }: BiometryTabProps) {
  const { data: biometry, isLoading } = useQuery<BiometrySummary>({
    queryKey: ["/api/profissional/dashboard/pacientes", patientId, "biometria"],
  });

  if (isLoading) return <BiometrySkeleton />;

  if (!biometry || biometry.history.length === 0) {
    return (
      <EmptyState
        icon={<Scale className="h-12 w-12" />}
        title="Sem dados de biometria"
        description="Quando as medições corporais forem registradas, os dados de evolução aparecerão aqui."
        module="biometry"
      />
    );
  }

  const { current, trends, history } = biometry;

  return (
    <div className="space-y-6" data-testid="tab-biometry">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Gordura Corporal"
          value={current.bodyFat}
          unit="%"
          trend={trends.bodyFat}
          trendLabel={trends.bodyFat === "down" ? "Reduzindo" : trends.bodyFat === "up" ? "Aumentando" : "Estável"}
          color="#D97952"
        />
        <MetricCard
          title="Massa Muscular"
          value={current.muscleMass}
          unit="kg"
          trend={trends.muscleMass}
          trendLabel={trends.muscleMass === "up" ? "Aumentando" : trends.muscleMass === "down" ? "Reduzindo" : "Estável"}
          inverse
          color="#3D7A8C"
        />
        <MetricCard
          title="Água Corporal"
          value={current.water}
          unit="%"
          trend="stable"
          trendLabel="Estável"
          inverse
          color="#6BA3BE"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Evolução Corporal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="weight" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="percent" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line yAxisId="weight" type="monotone" dataKey="weight" name="Peso (kg)" stroke="#3B5F4A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="percent" type="monotone" dataKey="bodyFat" name="Gordura (%)" stroke="#D97952" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="weight" type="monotone" dataKey="muscleMass" name="Massa Muscular (kg)" stroke="#3D7A8C" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Histórico de Capturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.slice().reverse().map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`entry-biometry-${idx}`}>
                <span className="text-sm font-medium">{entry.date}</span>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>{entry.weight.toFixed(1)} kg</span>
                  <span>{entry.bodyFat.toFixed(1)}% GC</span>
                  <span>{entry.muscleMass.toFixed(1)} kg MM</span>
                  <span>{entry.water.toFixed(1)}% H2O</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
