import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PatientSettingsPage from "./patient-settings";

const {
  useQueryMock,
  useMutationMock,
  invalidateQueriesMock,
  toastMock,
  mutateMock,
  hydrationOverrideChangeMock,
  resetMock,
} = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  toastMock: vi.fn(),
  mutateMock: vi.fn(),
  hydrationOverrideChangeMock: vi.fn(),
  resetMock: vi.fn(),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

let hydrationOverrideValue = false;

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useMutation: (...args: unknown[]) => useMutationMock(...args),
}));

vi.mock("wouter", () => ({
  useRoute: () => [true, { id: "99" }],
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  queryClient: { invalidateQueries: invalidateQueriesMock },
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, "data-testid": testId }: {
    checked?: boolean;
    onCheckedChange?: (value: boolean) => void;
    "data-testid"?: string;
  }) => (
    <button
      data-testid={testId}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      type="button"
    />
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, "data-testid": testId, ...props }: {
    children: React.ReactNode;
    "data-testid"?: string;
  }) => (
    <button data-testid={testId} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ "data-testid": testId, ...props }: {
    "data-testid"?: string;
  }) => <input data-testid={testId} {...props} />,
}));

vi.mock("@/components/ui/form", () => {
  const Form = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const FormField = ({ render, name }: { render: (args: { field: any }) => React.ReactNode; name: string }) => {
    const base = {
      dailyCalories: 2000,
      protein: 150,
      carbs: 250,
      fat: 70,
      hydration: 2500,
      hydrationOverride: false,
    };
    const field = {
      name,
      value: base[name as keyof typeof base],
      onChange: name === "hydrationOverride" ? hydrationOverrideChangeMock : vi.fn(),
    };
    return <>{render({ field })}</>;
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return {
    Form,
    FormField,
    FormItem: wrapper,
    FormLabel: wrapper,
    FormControl: wrapper,
    FormMessage: wrapper,
    FormDescription: wrapper,
  };
});

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <div />,
}));

vi.mock("react-hook-form", () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: (data: any) => void) => (event: React.FormEvent) => {
      event.preventDefault();
      return fn({
        dailyCalories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70,
        hydration: 2500,
        hydrationOverride: false,
      });
    },
    reset: resetMock,
    watch: (field: string) =>
      field === "hydrationOverride" ? hydrationOverrideValue : true,
  }),
}));

describe("PatientSettingsPage", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useMutationMock.mockReset();
    invalidateQueriesMock.mockReset();
    toastMock.mockReset();
    mutateMock.mockReset();
    fetchMock.mockReset();
    hydrationOverrideValue = false;
  });

  it("renders loading state", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: true });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    render(<PatientSettingsPage />);

    expect(screen.getByTestId("page-patient-settings")).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders inputs and toggles hydration", async () => {
    useQueryMock.mockReturnValue({
      data: {
        dailyCalories: 2200,
        protein: 140,
        carbs: 260,
        fat: 60,
        hydration: 2400,
        hydrationOverride: true,
      },
      isLoading: false,
    });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    render(<PatientSettingsPage />);

    expect(screen.getByTestId("text-settings-title")).toBeInTheDocument();
    expect(screen.getByTestId("input-daily-calories")).toBeInTheDocument();
    expect(screen.getByTestId("input-protein")).toBeInTheDocument();
    expect(screen.getByTestId("input-carbs")).toBeInTheDocument();
    expect(screen.getByTestId("input-fat")).toBeInTheDocument();
    expect(screen.getByTestId("input-hydration")).toBeInTheDocument();

    const toggle = screen.getByTestId("switch-hydration-override");
    await userEvent.click(toggle);

    expect(hydrationOverrideChangeMock).toHaveBeenCalledWith(true);
  });

  it("resets form values when goals load", () => {
    const goals = {
      dailyCalories: 1800,
      protein: 120,
      carbs: 200,
      fat: 50,
      hydration: 2100,
      hydrationOverride: true,
    };
    useQueryMock.mockReturnValue({ data: goals, isLoading: false });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    render(<PatientSettingsPage />);

    expect(resetMock).toHaveBeenCalledWith(goals);
  });

  it("disables hydration input when override is off", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    render(<PatientSettingsPage />);

    expect(screen.getByTestId("input-hydration")).toBeDisabled();
  });

  it("shows manual hydration description when override is on", () => {
    hydrationOverrideValue = true;
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    render(<PatientSettingsPage />);

    expect(
      screen.getByText("Valor definido manualmente pelo profissional."),
    ).toBeInTheDocument();
  });

  it("disables save button while mutation is pending", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: true });

    render(<PatientSettingsPage />);

    const button = screen.getByTestId("button-save-goals");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Salvando...");
  });

  it("posts goals when mutationFn succeeds", async () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });

    let mutationFn: ((data: any) => Promise<any>) | undefined;
    useMutationMock.mockImplementation((options: { mutationFn?: (data: any) => Promise<any> }) => {
      mutationFn = options.mutationFn;
      return { mutate: mutateMock, isPending: false };
    });

    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<PatientSettingsPage />);

    await mutationFn?.({
      dailyCalories: 2100,
      protein: 160,
      carbs: 240,
      fat: 65,
      hydration: 2600,
      hydrationOverride: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profissional/pacientes/99/metas",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("throws when mutationFn fails", async () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });

    let mutationFn: ((data: any) => Promise<any>) | undefined;
    useMutationMock.mockImplementation((options: { mutationFn?: (data: any) => Promise<any> }) => {
      mutationFn = options.mutationFn;
      return { mutate: mutateMock, isPending: false };
    });

    fetchMock.mockResolvedValue({ ok: false });

    render(<PatientSettingsPage />);

    await expect(
      mutationFn?.({
        dailyCalories: 2100,
        protein: 160,
        carbs: 240,
        fat: 65,
        hydration: 2600,
        hydrationOverride: true,
      }),
    ).rejects.toThrow("Failed to update goals");
  });

  it("submits the form", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    render(<PatientSettingsPage />);

    fireEvent.submit(screen.getByTestId("button-save-goals").closest("form")!);

    expect(mutateMock).toHaveBeenCalled();
  });

  it("shows error toast when save fails", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    let onError: (() => void) | undefined;

    useMutationMock.mockImplementation((options: { onError?: () => void }) => {
      onError = options.onError;
      return { mutate: mutateMock, isPending: false };
    });

    render(<PatientSettingsPage />);

    onError?.();

    expect(toastMock).toHaveBeenCalledWith({
      title: "Erro ao salvar",
      description: "Não foi possível atualizar as metas. Tente novamente.",
      variant: "destructive",
    });
  });

  it("shows success toast and invalidates queries", () => {
    useQueryMock.mockReturnValue({ data: null, isLoading: false });
    let onSuccess: (() => void) | undefined;

    useMutationMock.mockImplementation((options: { onSuccess?: () => void }) => {
      onSuccess = options.onSuccess;
      return { mutate: mutateMock, isPending: false };
    });

    render(<PatientSettingsPage />);

    onSuccess?.();

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["/api/profissional/pacientes", "99", "metas"],
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["/api/profissional/dashboard/pacientes", "99"],
    });
    expect(toastMock).toHaveBeenCalledWith({
      title: "Metas atualizadas",
      description: "As metas foram salvas com sucesso.",
    });
  });
});
