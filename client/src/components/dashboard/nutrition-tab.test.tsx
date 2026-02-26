import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NutritionTab } from "./nutrition-tab";

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
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
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
}));

describe("NutritionTab", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it("renders empty state when no data", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });

    render(<NutritionTab patientId="p1" />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });

    render(<NutritionTab patientId="p1" />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders empty state when history is empty", () => {
    useQueryMock.mockReturnValue({
      data: {
        dailyCalories: 0,
        targetCalories: 0,
        protein: { current: 0, target: 0 },
        carbs: { current: 0, target: 0 },
        fat: { current: 0, target: 0 },
        adherencePercent: 0,
        history: [],
      },
      isLoading: false,
    });

    render(<NutritionTab patientId="p1" />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders nutrition content", () => {
    useQueryMock.mockReturnValue({
      data: {
        dailyCalories: 1800,
        targetCalories: 2000,
        protein: { current: 100, target: 150 },
        carbs: { current: 200, target: 250 },
        fat: { current: 60, target: 70 },
        adherencePercent: 80,
        history: [
          { date: "01/01", calories: 1800, protein: 100, carbs: 200, fat: 60 },
        ],
      },
      isLoading: false,
    });

    render(<NutritionTab patientId="p1" />);

    expect(screen.getByTestId("tab-nutrition")).toBeInTheDocument();
  });
});
