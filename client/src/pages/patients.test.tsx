import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PatientsPage from "./patients";

const mockNavigate = vi.fn();
const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/pacientes", mockNavigate],
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const patients = [
  {
    id: "1",
    name: "Ana Silva",
    age: 28,
    status: "active",
    adherenceDiet: 90,
    adherenceTraining: 70,
    lastActivity: "Hoje",
  },
  {
    id: "2",
    name: "Bruno Costa",
    age: 42,
    status: "inactive",
    adherenceDiet: 40,
    adherenceTraining: 30,
    lastActivity: "Ontem",
  },
];

describe("PatientsPage", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    mockNavigate.mockReset();
  });

  it("renders summary metrics and list", () => {
    useQueryMock.mockReturnValue({ data: patients, isLoading: false });

    render(<PatientsPage />);

    expect(screen.getByTestId("page-patients")).toBeInTheDocument();
    expect(screen.getByTestId("text-page-title")).toHaveTextContent("Pacientes");
    expect(screen.getByTestId("text-active-count")).toHaveTextContent("1 ativos");
    expect(screen.getByTestId("text-avg-adherence")).toHaveTextContent(
      "Aderência média: 58%",
    );
    expect(screen.getByTestId("text-patient-name-1")).toHaveTextContent("Ana Silva");
    expect(screen.getByTestId("text-patient-name-2")).toHaveTextContent("Bruno Costa");
  });

  it("filters patients by search", async () => {
    useQueryMock.mockReturnValue({ data: patients, isLoading: false });

    render(<PatientsPage />);

    const input = screen.getByTestId("input-search-patients");
    await userEvent.type(input, "ana");

    expect(screen.getByTestId("text-patient-name-1")).toBeInTheDocument();
    expect(screen.queryByTestId("text-patient-name-2")).toBeNull();
  });

  it("navigates to dashboard on row click", () => {
    useQueryMock.mockReturnValue({ data: patients, isLoading: false });

    render(<PatientsPage />);

    fireEvent.click(screen.getByTestId("row-patient-1"));

    expect(mockNavigate).toHaveBeenCalledWith("/pacientes/1/dashboard");
  });

  it("renders loading skeletons", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });

    render(<PatientsPage />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders empty state when no patients", () => {
    useQueryMock.mockReturnValue({ data: [], isLoading: false });

    render(<PatientsPage />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders empty state when search has no matches", async () => {
    useQueryMock.mockReturnValue({ data: patients, isLoading: false });

    render(<PatientsPage />);

    await userEvent.type(screen.getByTestId("input-search-patients"), "zzz");

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });
});
