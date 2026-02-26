import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TrainingTab } from "./training-tab";

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
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: ({ formatter }: { formatter?: (value: number, name: string) => unknown }) => {
    formatter?.(1200, "Volume (kg)");
    formatter?.(800, "Outro");
    return <div />;
  },
  Legend: () => <div />,
  Cell: () => <div />,
}));

describe("TrainingTab", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it("renders empty state when no data", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });

    render(<TrainingTab patientId="p1" />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });

    render(<TrainingTab patientId="p1" />);

    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders training content", () => {
    useQueryMock.mockReturnValue({
      data: {
        totalSessions: 4,
        weeklyAverage: 2,
        adherencePercent: 75,
        sessions: [
          {
            id: "s1",
            date: "01/01",
            name: "Treino A",
            duration: 45,
            volumeLoad: 2500,
            rpe: 8,
            completed: true,
            exercises: 6,
          },
        ],
      },
      isLoading: false,
    });

    render(<TrainingTab patientId="p1" />);

    expect(screen.getByTestId("tab-training")).toBeInTheDocument();
    expect(screen.getByTestId("session-s1")).toBeInTheDocument();
  });

  it("shows placeholder rpe when no sessions are completed", () => {
    useQueryMock.mockReturnValue({
      data: {
        totalSessions: 2,
        weeklyAverage: 1,
        adherencePercent: 50,
        sessions: [
          {
            id: "s2",
            date: "01/02",
            name: "Treino B",
            duration: 40,
            volumeLoad: 2100,
            rpe: 6,
            completed: false,
            exercises: 5,
          },
        ],
      },
      isLoading: false,
    });

    render(<TrainingTab patientId="p1" />);

    expect(screen.getByText("–")).toBeInTheDocument();
    expect(screen.queryByTestId("chart")).toBeNull();
  });
});
