import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  ChevronRight,
  UtensilsCrossed,
  X,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import type { Patient } from "@shared/schema";

type StatusFilter = "ativos" | "todos" | "inativos";
type SortOption = "nome-asc" | "nome-desc" | "aderencia-desc" | "aderencia-asc";

function AdherenceBadge({ value }: { value: number }) {
  const variant = value >= 80 ? "default" : value >= 50 ? "secondary" : "destructive";
  return (
    <Badge
      variant={variant}
      className="text-xs cursor-default"
      title="Aderência ao plano alimentar nos últimos 7 dias"
      data-testid="badge-adherence-diet"
    >
      {value}%
    </Badge>
  );
}

function RowSkeleton() {
  return (
    <TableRow>
      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    </TableRow>
  );
}

function StatCard({ label, value, testId }: { label: string; value: string | number; testId: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border bg-card px-4 py-3 min-w-[120px]"
      data-testid={testId}
    >
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function PrescricaoAlimentarListaPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativos");
  const [sortBy, setSortBy] = useState<SortOption>("nome-asc");
  const [, navigate] = useLocation();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/profissional/clientes"],
  });

  const activeCount = patients?.filter((p) => p.status === "active").length || 0;
  const inactiveCount = patients?.filter((p) => p.status === "inactive").length || 0;
  const totalCount = patients?.length || 0;

  const avgDietAdherence = patients?.length
    ? Math.round(patients.reduce((acc, p) => acc + p.adherenceDiet, 0) / patients.length)
    : 0;

  const hasActiveFilters = search.length > 0;

  const filtered = useMemo(() => {
    if (!patients) return [];

    let result = [...patients];

    if (statusFilter === "ativos") {
      result = result.filter((p) => p.status === "active");
    } else if (statusFilter === "inativos") {
      result = result.filter((p) => p.status === "inactive");
    }

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case "nome-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nome-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "aderencia-desc":
        result.sort((a, b) => b.adherenceDiet - a.adherenceDiet);
        break;
      case "aderencia-asc":
        result.sort((a, b) => a.adherenceDiet - b.adherenceDiet);
        break;
    }

    return result;
  }, [patients, statusFilter, search, sortBy]);

  function clearFilters() {
    setSearch("");
  }

  const tableHeaders = (
    <TableRow>
      <TableHead>Cliente</TableHead>
      <TableHead>Gênero / Idade</TableHead>
      <TableHead>Aderência dieta</TableHead>
      <TableHead>Última atividade</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="w-10" />
    </TableRow>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-prescricao-lista">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              data-testid="titulo-prescricao-lista"
            >
              Prescrição alimentar
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Selecione um cliente para gerenciar o plano alimentar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatCard label="Total" value={totalCount} testId="stat-prescricao-total" />
          <StatCard label="Ativos" value={activeCount} testId="stat-prescricao-ativos" />
          <StatCard
            label="Aderência dieta"
            value={`${avgDietAdherence}%`}
            testId="stat-prescricao-aderencia"
          />
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        data-testid="tabs-status-prescricao"
      >
        <TabsList>
          <TabsTrigger value="ativos" data-testid="tab-prescricao-ativos">
            Ativos ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="todos" data-testid="tab-prescricao-todos">
            Todos ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="inativos" data-testid="tab-prescricao-inativos">
            Inativos ({inactiveCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-prescricao"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]" data-testid="select-ordenar-prescricao">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome-asc" data-testid="option-prescricao-nome-asc">Nome A-Z</SelectItem>
              <SelectItem value="nome-desc" data-testid="option-prescricao-nome-desc">Nome Z-A</SelectItem>
              <SelectItem value="aderencia-desc" data-testid="option-prescricao-aderencia-desc">Aderência ↑</SelectItem>
              <SelectItem value="aderencia-asc" data-testid="option-prescricao-aderencia-asc">Aderência ↓</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="button-limpar-filtros-prescricao"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>{tableHeaders}</TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-12 w-12" />}
          title={
            hasActiveFilters
              ? "Nenhum cliente encontrado"
              : statusFilter === "inativos"
                ? "Nenhum cliente inativo"
                : "Você ainda não tem clientes vinculados"
          }
          description={
            hasActiveFilters
              ? "Tente buscar por outro nome, e-mail ou ajuste os filtros."
              : "Adicione seu primeiro cliente para começar a acompanhar sua evolução."
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>{tableHeaders}</TableHeader>
            <TableBody>
              {filtered.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => navigate(`/prescricao-alimentar/${patient.id}`)}
                  data-testid={`row-prescricao-${patient.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt={patient.name} />}
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                          {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className="font-medium text-sm"
                          data-testid={`text-prescricao-name-${patient.id}`}
                        >
                          {patient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {patient.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {patient.gender === "F" ? "Feminino" : patient.gender === "M" ? "Masculino" : "Não informado"},{" "}
                      {patient.age} anos
                    </span>
                  </TableCell>
                  <TableCell>
                    <AdherenceBadge value={patient.adherenceDiet} />
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid={`text-prescricao-activity-${patient.id}`}
                    >
                      {patient.lastActivity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={patient.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                      data-testid={`badge-prescricao-status-${patient.id}`}
                    >
                      {patient.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center" data-testid="text-prescricao-count">
        {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
