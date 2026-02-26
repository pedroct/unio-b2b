import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { OverviewTab } from "./overview-tab";

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
}));

describe("OverviewTab", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it("renders loading state", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });

    render(<OverviewTab patientId="p1" />);

    expect(screen.queryByTestId("tab-overview")).toBeNull();
  });

  it("renders overview insights", () => {
    useQueryMock.mockReturnValue({
      data: {
        weeklySnapshot: {
          caloriesAvg: 1800,
          caloriesTarget: 2000,
          trainingSessions: 3,
          trainingTarget: 5,
          hydrationAvg: 2000,
          hydrationTarget: 2500,
          weightChange: -0.5,
        },
        insights: [
          {
            id: "ins-1",
            type: "warning",
            title: "Teste",
            description: "Detalhe",
            module: "nutrition",
          },
        ],
      },
      isLoading: false,
    });

    render(<OverviewTab patientId="p1" />);

    expect(screen.getByTestId("tab-overview")).toBeInTheDocument();
    expect(screen.getByTestId("insight-ins-1")).toBeInTheDocument();
  });
});
