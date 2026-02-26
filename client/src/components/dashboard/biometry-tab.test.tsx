import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BiometryTab } from "./biometry-tab";

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
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

describe("BiometryTab", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it("renders empty state when no data", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });

    render(<BiometryTab patientId="p1" />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });

    render(<BiometryTab patientId="p1" />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders empty state when history is empty", () => {
    useQueryMock.mockReturnValue({
      data: {
        current: { weight: 80, bodyFat: 20, muscleMass: 35, water: 55 },
        trends: { weight: "down", bodyFat: "down", muscleMass: "up" },
        history: [],
      },
      isLoading: false,
    });

    render(<BiometryTab patientId="p1" />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders biometry content", () => {
    useQueryMock.mockReturnValue({
      data: {
        current: { weight: 80, bodyFat: 20, muscleMass: 35, water: 55 },
        trends: { weight: "down", bodyFat: "down", muscleMass: "up" },
        history: [
          { date: "01/01", weight: 80, bodyFat: 20, muscleMass: 35, water: 55 },
        ],
      },
      isLoading: false,
    });

    render(<BiometryTab patientId="p1" />);

    expect(screen.getByTestId("tab-biometry")).toBeInTheDocument();
    expect(screen.getByTestId("entry-biometry-0")).toBeInTheDocument();
  });
});
