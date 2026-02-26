import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlimentoPlano, AlimentoBusca, FonteAlimento, ResumoMacros } from "@shared/schema";

type FiltroOrigem = "TODAS" | FonteAlimento;

interface ModalAdicionarAlimentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refeicaoNome: string;
  onAdicionarAlimento: (alimento: AlimentoPlano) => void;
}

interface ResultadoBusca {
  id: string;
  nome: string;
  grupo?: string;
  fonte: FonteAlimento;
  caloriasPor100g: number | null;
  proteinaPor100g: number | null;
  carboidratoPor100g: number | null;
  gorduraPor100g: number | null;
  fibraPor100g: number | null;
}

function normalizarResultadosTBCA(dados: any[]): ResultadoBusca[] {
  return dados.map((item) => ({
    id: item.id,
    nome: item.descricao,
    grupo: item.grupo_alimentar?.nome,
    fonte: (item.fonte_dados || "TBCA") as FonteAlimento,
    caloriasPor100g: null,
    proteinaPor100g: null,
    carboidratoPor100g: null,
    gorduraPor100g: null,
    fibraPor100g: null,
  }));
}

function normalizarResultadosLegado(dados: any[]): ResultadoBusca[] {
  return dados.map((item) => ({
    id: String(item.id),
    nome: item.nome,
    grupo: undefined,
    fonte: "LEGADO" as FonteAlimento,
    caloriasPor100g: item.calorias ?? null,
    proteinaPor100g: item.proteinas ?? null,
    carboidratoPor100g: item.carboidratos ?? null,
    gorduraPor100g: item.gorduras ?? null,
    fibraPor100g: item.fibras ?? null,
  }));
}

function calcularMacrosLocal(alimento: ResultadoBusca, quantidade: number): ResumoMacros {
  const fator = quantidade / 100;
  return {
    calorias: Math.round((alimento.caloriasPor100g || 0) * fator * 10) / 10,
    proteinas: Math.round((alimento.proteinaPor100g || 0) * fator * 10) / 10,
    carboidratos: Math.round((alimento.carboidratoPor100g || 0) * fator * 10) / 10,
    gorduras: Math.round((alimento.gorduraPor100g || 0) * fator * 10) / 10,
    fibras: Math.round((alimento.fibraPor100g || 0) * fator * 10) / 10,
  };
}

function MacroCard({ label, valor, unidade }: { label: string; valor: number; unidade: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-3 py-2 min-w-0">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{valor}</span>
      <span className="text-[10px] text-muted-foreground">{unidade}</span>
    </div>
  );
}

export function ModalAdicionarAlimento({
  open,
  onOpenChange,
  refeicaoNome,
  onAdicionarAlimento,
}: ModalAdicionarAlimentoProps) {
  const [filtro, setFiltro] = useState<FiltroOrigem>("TODAS");
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selecionado, setSelecionado] = useState<ResultadoBusca | null>(null);
  const [quantidade, setQuantidade] = useState<string>("100");
  const [macros, setMacros] = useState<ResumoMacros | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const calcDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setFiltro("TODAS");
      setTermoBusca("");
      setResultados([]);
      setSelecionado(null);
      setQuantidade("100");
      setMacros(null);
      setBuscaRealizada(false);
    }
  }, [open]);

  const executarBusca = useCallback(async (termo: string, origem: FiltroOrigem) => {
    if (termo.length < 2) {
      setResultados([]);
      setBuscaRealizada(false);
      return;
    }
    setBuscando(true);
    setBuscaRealizada(true);
    try {
      const resultadosCombinados: ResultadoBusca[] = [];

      if (origem === "TODAS" || origem === "LEGADO") {
        const resLegado = await fetch(`/api/nutricao/alimentos/buscar?q=${encodeURIComponent(termo)}&limite=10`);
        if (resLegado.ok) {
          const dados = await resLegado.json();
          resultadosCombinados.push(...normalizarResultadosLegado(dados));
        }
      }

      if (origem === "TODAS" || origem === "TBCA" || origem === "USDA") {
        const params = new URLSearchParams({ busca: termo, limite: "20" });
        if (origem !== "TODAS") {
          params.set("fonte", origem);
        }
        const resTbca = await fetch(`/api/nutricao/tbca/alimentos?${params}`);
        if (resTbca.ok) {
          const dados = await resTbca.json();
          resultadosCombinados.push(...normalizarResultadosTBCA(dados));
        }
      }

      const unicos = resultadosCombinados.filter(
        (item, index, self) => self.findIndex((i) => i.id === item.id) === index
      );

      setResultados(unicos);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executarBusca(termoBusca, filtro);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termoBusca, filtro, executarBusca]);

  const calcularMacrosRemoto = useCallback(async (alimentoId: string, qtd: number) => {
    setCalculando(true);
    try {
      const res = await fetch("/api/nutricao/tbca/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alimento_id: alimentoId, quantidade_consumida: qtd }),
      });
      if (res.ok) {
        const dados = await res.json();
        setMacros(dados.resumo_macros);
      }
    } catch {
      setMacros(null);
    } finally {
      setCalculando(false);
    }
  }, []);

  useEffect(() => {
    if (!selecionado) return;
    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      setMacros(null);
      return;
    }

    if (selecionado.fonte === "LEGADO") {
      setMacros(calcularMacrosLocal(selecionado, qtd));
      return;
    }

    if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
    calcDebounceRef.current = setTimeout(() => {
      calcularMacrosRemoto(selecionado.id, qtd);
    }, 300);
    return () => {
      if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
    };
  }, [selecionado, quantidade, calcularMacrosRemoto]);

  function handleSelecionarAlimento(item: ResultadoBusca) {
    setSelecionado(item);
    setQuantidade("100");
  }

  function handleAdicionar(fecharModal: boolean) {
    if (!selecionado) return;
    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) return;

    const alimento: AlimentoPlano = {
      id: `${selecionado.id}-${Date.now()}`,
      nome: selecionado.nome,
      quantidade: qtd,
      unidade: "g",
      grupo: selecionado.grupo,
    };

    onAdicionarAlimento(alimento);

    if (fecharModal) {
      onOpenChange(false);
    } else {
      setSelecionado(null);
      setMacros(null);
      setQuantidade("100");
    }
  }

  const filtros: { valor: FiltroOrigem; rotulo: string }[] = [
    { valor: "TODAS", rotulo: "Todas" },
    { valor: "TBCA", rotulo: "TBCA" },
    { valor: "USDA", rotulo: "USDA" },
  ];

  const qtdValida = !isNaN(parseFloat(quantidade)) && parseFloat(quantidade) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0"
        data-testid="modal-adicionar-alimento"
      >
        <div className="px-6 pt-6 pb-2">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl" data-testid="text-titulo-alimento">
              Adicionar alimento
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {refeicaoNome}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 space-y-4">
          <div className="flex items-center gap-2" data-testid="filtros-origem">
            {filtros.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFiltro(f.valor)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border",
                  filtro === f.valor
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`filtro-${f.valor.toLowerCase()}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar alimento por nome..."
              className="pl-9"
              data-testid="input-busca-alimento"
            />
          </div>

          <div
            className="rounded-lg border overflow-hidden"
            data-testid="lista-resultados"
          >
            {buscando ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            ) : resultados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <span className="text-sm">
                  {buscaRealizada
                    ? "Nenhum alimento encontrado"
                    : "Digite pelo menos 2 caracteres para buscar"}
                </span>
              </div>
            ) : (
              <ul className="max-h-[240px] overflow-y-auto divide-y">
                {resultados.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                        selecionado?.id === item.id && "bg-accent"
                      )}
                      onClick={() => handleSelecionarAlimento(item)}
                      data-testid={`resultado-alimento-${item.id}`}
                    >
                      {selecionado?.id === item.id && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.nome}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.grupo && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {item.grupo}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            item.fonte === "TBCA" && "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400",
                            item.fonte === "USDA" && "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
                            item.fonte === "LEGADO" && "border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400"
                          )}
                          data-testid={`badge-fonte-${item.id}`}
                        >
                          {item.fonte}
                        </Badge>
                        {item.caloriasPor100g != null && (
                          <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />
                            {item.caloriasPor100g}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selecionado && (
            <div
              className="rounded-lg border bg-muted/20 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
              data-testid="painel-detalhes"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium" data-testid="text-alimento-selecionado">
                    {selecionado.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selecionado.grupo && (
                      <span className="text-xs text-muted-foreground">{selecionado.grupo}</span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        selecionado.fonte === "TBCA" && "border-emerald-300 text-emerald-700",
                        selecionado.fonte === "USDA" && "border-blue-300 text-blue-700",
                        selecionado.fonte === "LEGADO" && "border-orange-300 text-orange-700"
                      )}
                    >
                      {selecionado.fonte}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-24 tabular-nums"
                    data-testid="input-quantidade"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Unidade</label>
                  <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm text-muted-foreground">
                    g
                  </div>
                </div>
              </div>

              {calculando ? (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Calculando...</span>
                </div>
              ) : macros ? (
                <div
                  className="grid grid-cols-5 gap-2"
                  data-testid="resumo-macros"
                >
                  <MacroCard label="Calorias" valor={macros.calorias} unidade="kcal" />
                  <MacroCard label="Proteína" valor={macros.proteinas} unidade="g" />
                  <MacroCard label="Carboidrato" valor={macros.carboidratos} unidade="g" />
                  <MacroCard label="Gordura" valor={macros.gorduras} unidade="g" />
                  <MacroCard label="Fibra" valor={macros.fibras} unidade="g" />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancelar-alimento"
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!selecionado || !qtdValida}
              onClick={() => handleAdicionar(false)}
              data-testid="button-adicionar-e-buscar"
            >
              Adicionar e buscar outro
            </Button>
            <Button
              type="button"
              disabled={!selecionado || !qtdValida}
              onClick={() => handleAdicionar(true)}
              data-testid="button-adicionar-alimento-confirmar"
            >
              Adicionar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
