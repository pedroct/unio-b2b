import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Save, Droplets, Flame } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { patientGoalsSchema, type PatientGoals } from "@shared/schema";

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PatientSettingsPage() {
  const [, params] = useRoute("/clientes/:id/configuracoes");
  const patientId = params?.id || "";
  const { toast } = useToast();

  const { data: goals, isLoading } = useQuery<PatientGoals>({
    queryKey: ["/api/profissional/pacientes", patientId, "metas"],
    enabled: !!patientId,
  });

  const form = useForm<PatientGoals>({
    resolver: zodResolver(patientGoalsSchema),
    defaultValues: {
      dailyCalories: 2000,
      protein: 150,
      carbs: 250,
      fat: 70,
      hydration: 2500,
      hydrationOverride: false,
    },
  });

  useEffect(() => {
    if (goals) {
      form.reset(goals);
    }
  }, [goals, form]);

  const mutation = useMutation({
    mutationFn: async (data: PatientGoals) => {
      const res = await fetch(`/api/profissional/pacientes/${patientId}/metas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update goals");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profissional/pacientes", patientId, "metas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profissional/dashboard/pacientes", patientId] });
      toast({
        title: "Metas atualizadas",
        description: "As metas foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as metas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientGoals) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" data-testid="page-patient-settings">
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${patientId}/dashboard`}>
          <Button variant="ghost" size="icon" data-testid="button-back-settings">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-settings-title">
            Metas
          </h1>
          <p className="text-sm text-muted-foreground">
            Ajuste as metas individuais de nutrição e hidratação.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#5B8C6F]" />
                  <CardTitle className="text-base">Metas Nutricionais</CardTitle>
                </div>
                <CardDescription>
                  Defina a meta calórica diária e a distribuição de macronutrientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="dailyCalories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Calórica Diária (kcal)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-daily-calories"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="protein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proteínas (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-protein"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="carbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carboidratos (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-carbs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gorduras (g)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-fat"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-[#6BA3BE]" />
                  <CardTitle className="text-base">Meta de Hidratação</CardTitle>
                </div>
                <CardDescription>
                  Por padrão, a meta é calculada automaticamente pelo peso corporal. 
                  Ative o modo manual para definir um valor personalizado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="hydrationOverride"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">Modo Manual</FormLabel>
                        <FormDescription className="text-xs">
                          Sobrescreve o cálculo automático baseado no peso.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-hydration-override"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hydration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Hidratação Diária (ml)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={!form.watch("hydrationOverride")}
                          data-testid="input-hydration"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {form.watch("hydrationOverride")
                          ? "Valor definido manualmente pelo profissional."
                          : "Calculado automaticamente: peso × 35 ml/kg."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-goals">
                <Save className="h-4 w-4 mr-2" />
                {mutation.isPending ? "Salvando..." : "Salvar Metas"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
