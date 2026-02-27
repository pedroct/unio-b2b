import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { loginSchema, BRAZILIAN_STATES, type LoginCredentials } from "@shared/schema";
import unioLogo from "@assets/Unio_Logo_1771972757927.png";

function formatRegistration(value: string): string {
  const raw = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const letters = raw.replace(/[^A-Z]/g, "");
  const numbers = raw.replace(/[^0-9]/g, "");
  if (letters && numbers) {
    return `${letters}-${numbers}`;
  }
  return raw;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      registrationNumber: "",
      uf: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsSubmitting(true);
    try {
      const rawPassword = data.password.replace(/\D/g, "");
      await login(data.registrationNumber, data.uf, rawPassword);
      navigate("/pacientes");
    } catch (error: any) {
      toast({
        title: "Erro de autenticação",
        description: "Registro ou CPF incorretos. Verifique seus dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="page-login">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: '#2D4A3A' }}>
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <img src={unioLogo} alt="UNIO" className="h-8 object-contain brightness-0 invert" />
          </div>

          <div className="max-w-md">
            <h2 className="font-serif text-4xl font-bold leading-tight mb-6">
              O centro de controle da saúde dos seus clientes
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Nutrição, treino, biometria e hidratação em um único ecossistema. 
              Dados que se cruzam para decisões que transformam.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-4">
              {[
                { label: "Nutrição", color: "#5B8C6F" },
                { label: "Treino", color: "#D97952" },
                { label: "Biometria", color: "#3D7A8C" },
                { label: "Hidratação", color: "#6BA3BE" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-md px-4 py-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-white/90">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-sm">
            UNIO - Dados que cuidam de você
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <img src={unioLogo} alt="UNIO" className="h-7 object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-2" data-testid="text-login-title">
              Bem-vindo de volta!
            </h1>
            <p className="text-muted-foreground">
              Acesse com seu registro profissional
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Registro profissional</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: CRM-12345"
                          {...field}
                          onChange={(e) => field.onChange(formatRegistration(e.target.value))}
                          data-testid="input-registration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>UF</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-uf">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRAZILIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite seu CPF"
                          {...field}
                          onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          maxLength={14}
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-login"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : "Entrar"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-muted-foreground mt-8" data-testid="text-helper-login">
            Use seu registro profissional e CPF para acessar a plataforma.
          </p>
          <p className="text-center text-xs text-muted-foreground mt-3" data-testid="text-recuperar-acesso">
            Não consegue acessar?{" "}
            <a
              href="mailto:suporte@unio.tec.br"
              className="underline hover:text-foreground transition-colors"
              data-testid="link-suporte"
            >
              Entre em contato com o suporte.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
