import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PatientDashboardPage from "./patient-dashboard";

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock("wouter", () => ({
  useRoute: () => [true, { id: "42" }],
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/dashboard/overview-tab", () => ({
  OverviewTab: ({ patientId }: { patientId: string }) => (
    <div data-testid="tab-overview">{patientId}</div>
  ),
}));

vi.mock("@/components/dashboard/nutrition-tab", () => ({
  NutritionTab: ({ patientId }: { patientId: string }) => (
    <div data-testid="tab-nutrition">{patientId}</div>
  ),
}));

vi.mock("@/components/dashboard/biometry-tab", () => ({
  BiometryTab: ({ patientId }: { patientId: string }) => (
    <div data-testid="tab-biometry">{patientId}</div>
  ),
}));

vi.mock("@/components/dashboard/training-tab", () => ({
  TrainingTab: ({ patientId }: { patientId: string }) => (
    <div data-testid="tab-training">{patientId}</div>
  ),
}));

describe("PatientDashboardPage", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it("renders patient header when loaded", () => {
    useQueryMock.mockReturnValue({
      data: {
        id: "42",
        name: "Ana Silva",
        age: 29,
        gender: "F",
        email: "ana@exemplo.com",
        status: "active",
      },
      isLoading: false,
    });

    render(<PatientDashboardPage />);

    expect(screen.getByTestId("page-patient-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("text-patient-name")).toHaveTextContent("Ana Silva");
    expect(screen.getByTestId("text-patient-info")).toHaveTextContent(
      "29 anos · Feminino · ana@exemplo.com",
    );
    expect(screen.getByTestId("button-patient-settings")).toBeInTheDocument();
  });

  it("renders dashboard tabs", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });

    render(<PatientDashboardPage />);

    expect(screen.getByTestId("tabs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-overview")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-nutrition")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-biometry")).toBeInTheDocument();
    expect(screen.getByTestId("tab-trigger-training")).toBeInTheDocument();
  });
});
