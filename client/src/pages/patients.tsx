import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Search, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    </TableRow>
  );
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/profissional/pacientes"],
  });

  const filtered = patients?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const activeCount = patients?.filter((p) => p.status === "active").length || 0;
  const avgAdherence = patients?.length
    ? Math.round(patients.reduce((acc, p) => acc + (p.adherenceTraining + p.adherenceDiet) / 2, 0) / patients.length)
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-patients">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe seus pacientes e acesse os dashboards individuais.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span data-testid="text-active-count">{activeCount} ativos</span>
          <span className="text-border">|</span>
          <span data-testid="text-avg-adherence">Aderência média: {avgAdherence}%</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-patients"
        />
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Dieta</TableHead>
                <TableHead>Treino</TableHead>
                <TableHead>Última atividade</TableHead>
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
          title={search ? "Nenhum paciente encontrado" : "Sem pacientes cadastrados"}
          description={
            search
              ? "Tente buscar com outro termo."
              : "Quando seus pacientes forem vinculados, eles aparecerão aqui."
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Dieta</TableHead>
                <TableHead>Treino</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => navigate(`/pacientes/${patient.id}/dashboard`)}
                  data-testid={`row-patient-${patient.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                          {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-patient-name-${patient.id}`}>{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.age} anos</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AdherenceBadge value={patient.adherenceDiet} label="diet" />
                  </TableCell>
                  <TableCell>
                    <AdherenceBadge value={patient.adherenceTraining} label="training" />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground" data-testid={`text-last-activity-${patient.id}`}>
                      {patient.lastActivity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={patient.status === "active" ? "default" : "secondary"}
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
    </div>
  );
}
