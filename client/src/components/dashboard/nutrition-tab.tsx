import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Apple, UtensilsCrossed, ChevronRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { EmptyState } from "@/components/empty-state";
import { SheetPlanoAlimentar } from "@/components/dashboard/sheet-plano-alimentar";
import type { NutritionSummary } from "@shared/schema";

interface NutritionTabProps {
  patientId: string;
  patientName?: string;
}

function MacroCard({ label, current, target, color, unit }: {
  label: string; current: number; target: number; color: string; unit: string;
}) {
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current}g / {target}g
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2"><CardContent className="pt-5"><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-5 space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-36 w-36 rounded-full mx-auto" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" /></CardContent></Card>
      </div>
      <Card><CardContent className="pt-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
    </div>
  );
}

export function NutritionTab({ patientId, patientName }: NutritionTabProps) {
  const [sheetPlanoAberto, setSheetPlanoAberto] = useState(false);

  const { data: nutrition, isLoading } = useQuery<NutritionSummary>({
    queryKey: ["/api/profissional/dashboard/pacientes", patientId, "nutricao"],
  });

  if (isLoading) return <NutritionSkeleton />;

  if (!nutrition || nutrition.history.length === 0) {
    return (
      <EmptyState
        icon={<Apple className="h-12 w-12" />}
        title="Sem dados de nutrição"
        description="Quando as refeições forem registradas, os dados aparecerão aqui com resumos de macros e aderência."
        module="nutrition"
      />
    );
  }

  const caloriePercent = Math.min(Math.round((nutrition.dailyCalories / nutrition.targetCalories) * 100), 100);

  const pieData = [
    { name: "Proteínas", value: nutrition.protein.current, color: "#5B8C6F" },
    { name: "Carboidratos", value: nutrition.carbs.current, color: "#D9A441" },
    { name: "Gorduras", value: nutrition.fat.current, color: "#D97952" },
  ];

  return (
    <div className="space-y-6" data-testid="tab-nutrition">
      <SheetPlanoAlimentar
        open={sheetPlanoAberto}
        onOpenChange={setSheetPlanoAberto}
        pacienteId={patientId}
        pacienteNome={patientName}
      />

      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => setSheetPlanoAberto(true)}
        data-testid="cta-ver-plano-alimentar"
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Ver Plano Alimentar</p>
            <p className="text-xs text-muted-foreground">
              Visualize o plano alimentar prescrito com refeições, alimentos e grupos alimentares
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meta Calórica Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-semibold">{nutrition.dailyCalories.toLocaleString("pt-BR")}</span>
                <span className="text-sm text-muted-foreground pb-1">/ {nutrition.targetCalories.toLocaleString("pt-BR")} kcal</span>
              </div>
              <Progress value={caloriePercent} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{caloriePercent}% da meta</span>
                <span className="text-xs text-muted-foreground">Aderência semanal: {nutrition.adherencePercent}%</span>
              </div>
            </div>

            <div className="space-y-4">
              <MacroCard label="Proteínas" current={nutrition.protein.current} target={nutrition.protein.target} color="#5B8C6F" unit="g" />
              <MacroCard label="Carboidratos" current={nutrition.carbs.current} target={nutrition.carbs.target} color="#D9A441" unit="g" />
              <MacroCard label="Gorduras" current={nutrition.fat.current} target={nutrition.fat.target} color="#D97952" unit="g" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Macros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}g`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Histórico do Diário Alimentar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={nutrition.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="calories" name="Calorias" stroke="#5B8C6F" fill="#5B8C6F" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="protein" name="Proteína (g)" stroke="#3D7A8C" fill="#3D7A8C" fillOpacity={0.05} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
