import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  ChevronRight,
  Users,
  UserPlus,
  X,
  ArrowUpDown,
  CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
type SortOption = "nome-asc" | "nome-desc" | "aderencia-asc" | "aderencia-desc" | "atividade";
type PeriodField = "dataCadastro" | "ultimaConsulta";

function brDateToIso(dateStr: string): string | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function AdherenceBadge({ value, label }: { value: number; label: string }) {
  const variant = value >= 80 ? "default" : value >= 50 ? "secondary" : "destructive";
  return (
    <Badge variant={variant} className="text-xs" data-testid={`badge-adherence-${label.toLowerCase()}`}>
      {value}%
    </Badge>
  );
}

function PatientRowSkeleton() {
  return (
    <TableRow>
      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    </TableRow>
  );
}

function StatCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | number;
  testId: string;
}) {
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

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativos");
  const [sortBy, setSortBy] = useState<SortOption>("nome-asc");
  const [tagFilter, setTagFilter] = useState("");
  const [periodField, setPeriodField] = useState<PeriodField>("dataCadastro");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [, navigate] = useLocation();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/profissional/pacientes"],
  });

  const allTags = useMemo(() => {
    if (!patients) return [];
    const tagSet = new Set<string>();
    patients.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [patients]);

  const activeCount = patients?.filter((p) => p.status === "active").length || 0;
  const inactiveCount = patients?.filter((p) => p.status === "inactive").length || 0;
  const totalCount = patients?.length || 0;

  const avgAdherence = patients?.length
    ? Math.round(
        patients.reduce(
          (acc, p) => acc + (p.adherenceTraining + p.adherenceDiet) / 2,
          0
        ) / patients.length
      )
    : 0;

  const hasPeriodFilter = periodFrom.length > 0 || periodTo.length > 0;
  const hasActiveFilters = search.length > 0 || tagFilter.length > 0 || hasPeriodFilter;

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

    if (tagFilter) {
      result = result.filter((p) => p.tags?.includes(tagFilter));
    }

    if (periodFrom || periodTo) {
      result = result.filter((p) => {
        const fieldValue = p[periodField];
        if (!fieldValue) return true;
        const iso = brDateToIso(fieldValue);
        if (!iso) return true;
        if (periodFrom && iso < periodFrom) return false;
        if (periodTo && iso > periodTo) return false;
        return true;
      });
    }

    switch (sortBy) {
      case "nome-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nome-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "aderencia-desc":
        result.sort(
          (a, b) =>
            (b.adherenceDiet + b.adherenceTraining) / 2 -
            (a.adherenceDiet + a.adherenceTraining) / 2
        );
        break;
      case "aderencia-asc":
        result.sort(
          (a, b) =>
            (a.adherenceDiet + a.adherenceTraining) / 2 -
            (b.adherenceDiet + b.adherenceTraining) / 2
        );
        break;
      case "atividade": {
        const activityOrder: Record<string, number> = {};
        result.forEach((p) => {
          const text = p.lastActivity.toLowerCase();
          if (text.includes("hoje") || text.includes("minuto") || text.includes("hora")) {
            activityOrder[p.id] = 0;
          } else if (text.includes("ontem")) {
            activityOrder[p.id] = 1;
          } else {
            const match = text.match(/(\d+)/);
            const num = match ? parseInt(match[1]) : 999;
            if (text.includes("dia")) activityOrder[p.id] = 2 + num;
            else if (text.includes("semana")) activityOrder[p.id] = 100 + num;
            else if (text.includes("mês") || text.includes("mes")) activityOrder[p.id] = 200 + num;
            else activityOrder[p.id] = 500 + num;
          }
        });
        result.sort((a, b) => (activityOrder[a.id] ?? 999) - (activityOrder[b.id] ?? 999));
        break;
      }
    }

    return result;
  }, [patients, statusFilter, search, tagFilter, sortBy, periodFrom, periodTo, periodField]);

  function clearFilters() {
    setSearch("");
    setTagFilter("");
    setPeriodFrom("");
    setPeriodTo("");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-patients">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            data-testid="text-page-title"
          >
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e acompanhe seus clientes em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <StatCard label="Total" value={totalCount} testId="stat-total" />
            <StatCard label="Ativos" value={activeCount} testId="stat-ativos" />
            <StatCard
              label="Aderência"
              value={`${avgAdherence}%`}
              testId="stat-aderencia"
            />
          </div>
          <Button data-testid="button-adicionar-paciente" disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar cliente
          </Button>
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        data-testid="tabs-status-pacientes"
      >
        <TabsList>
          <TabsTrigger value="ativos" data-testid="tab-ativos">
            Ativos ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="todos" data-testid="tab-todos">
            Todos ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="inativos" data-testid="tab-inativos">
            Inativos ({inactiveCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-patients"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]" data-testid="select-ordenar">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome-asc" data-testid="option-nome-asc">Nome A-Z</SelectItem>
              <SelectItem value="nome-desc" data-testid="option-nome-desc">Nome Z-A</SelectItem>
              <SelectItem value="aderencia-desc" data-testid="option-aderencia-desc">Aderência ↑</SelectItem>
              <SelectItem value="aderencia-asc" data-testid="option-aderencia-asc">Aderência ↓</SelectItem>
              <SelectItem value="atividade" data-testid="option-atividade">Última atividade</SelectItem>
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-tag">
                <SelectValue placeholder="Filtrar por tag" />
              </SelectTrigger>
              <SelectContent>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag} data-testid={`option-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-testid="button-limpar-filtros"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-end rounded-lg border bg-card p-4"
        data-testid="filter-periodo"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground mt-1 hidden sm:block" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Período por</label>
          <Select value={periodField} onValueChange={(v) => setPeriodField(v as PeriodField)}>
            <SelectTrigger className="w-[180px] h-9" data-testid="select-periodo-campo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dataCadastro" data-testid="option-periodo-cadastro">Data de cadastro</SelectItem>
              <SelectItem value="ultimaConsulta" data-testid="option-periodo-consulta">Última consulta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">De</label>
          <Input
            type="date"
            value={periodFrom}
            onChange={(e) => setPeriodFrom(e.target.value)}
            className="w-[160px] h-9"
            data-testid="input-periodo-de"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Até</label>
          <Input
            type="date"
            value={periodTo}
            onChange={(e) => setPeriodTo(e.target.value)}
            className="w-[160px] h-9"
            data-testid="input-periodo-ate"
          />
        </div>
        {hasPeriodFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => { setPeriodFrom(""); setPeriodTo(""); }}
            data-testid="button-limpar-periodo"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Gênero / Idade</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                <TableHead>Dieta</TableHead>
                <TableHead>Treino</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="hidden lg:table-cell">Desde</TableHead>
                <TableHead className="hidden lg:table-cell">Últ. consulta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <PatientRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={
            hasActiveFilters
              ? "Nenhum cliente encontrado"
              : statusFilter === "inativos"
                ? "Nenhum cliente inativo"
                : "Sem clientes cadastrados"
          }
          description={
            hasActiveFilters
              ? "Tente ajustar os filtros ou buscar com outro termo."
              : "Quando seus clientes forem vinculados, eles aparecerão aqui."
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Gênero / Idade</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                <TableHead>Dieta</TableHead>
                <TableHead>Treino</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="hidden lg:table-cell">Desde</TableHead>
                <TableHead className="hidden lg:table-cell">Últ. consulta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() =>
                    navigate(`/pacientes/${patient.id}/dashboard`)
                  }
                  data-testid={`row-patient-${patient.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className="font-medium text-sm"
                          data-testid={`text-patient-name-${patient.id}`}
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
                      {patient.gender === "F" ? "Feminino" : "Masculino"},{" "}
                      {patient.age} anos
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 flex-wrap">
                      {patient.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          data-testid={`badge-tag-${patient.id}-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AdherenceBadge
                      value={patient.adherenceDiet}
                      label="diet"
                    />
                  </TableCell>
                  <TableCell>
                    <AdherenceBadge
                      value={patient.adherenceTraining}
                      label="training"
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid={`text-last-activity-${patient.id}`}
                    >
                      {patient.lastActivity}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid={`text-desde-${patient.id}`}
                    >
                      {patient.dataCadastro}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid={`text-ultima-consulta-${patient.id}`}
                    >
                      {patient.ultimaConsulta}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        patient.status === "active" ? "default" : "secondary"
                      }
                      className="text-xs"
                      data-testid={`badge-status-${patient.id}`}
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

      <div className="text-xs text-muted-foreground text-center" data-testid="text-resultados-count">
        {filtered.length} cliente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
