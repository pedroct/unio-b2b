import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { clienteLoginSchema, type ClienteLoginCredentials } from "@shared/schema";
import unioLogo from "@assets/Unio_Logo_1771972757927.png";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClienteLoginCredentials>({
    resolver: zodResolver(clienteLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: ClienteLoginCredentials) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate("/inicio");
    } catch (error: any) {
      toast({
        title: "Erro de autenticação",
        description: error.message || "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
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
              Sua saúde em suas mãos
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Acompanhe sua nutrição, treinos, biometria e hidratação em um único lugar.
              Dados que se cruzam para resultados que transformam.
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
              Acesse com seu e-mail e senha
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          placeholder="Digite sua senha"
                          autoComplete="current-password"
                          {...field}
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
            Use seu e-mail e senha para acessar a plataforma.
          </p>
          <p className="text-center text-xs text-muted-foreground mt-3" data-testid="text-recuperar-acesso">
            Esqueceu sua senha?{" "}
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
