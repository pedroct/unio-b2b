import React from "react";
import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast, useToast } from "./use-toast";

type DismissFn = (toastId?: string) => void;
let dismissRef: DismissFn | null = null;

function ToastConsumer() {
  const { toasts, dismiss } = useToast();
  dismissRef = dismiss;
  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <div data-testid="toast-title">{toasts[0]?.title ?? ""}</div>
    </div>
  );
}

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds and dismisses toasts", () => {
    render(<ToastConsumer />);

    act(() => {
      toast({ title: "Primeiro" });
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

    act(() => {
      dismissRef?.();
      vi.runAllTimers();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
  });

  it("keeps only the latest toast", () => {
    render(<ToastConsumer />);

    act(() => {
      toast({ title: "Primeiro" });
      toast({ title: "Segundo" });
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
  });

  it("updates and dismisses a toast by id", () => {
    render(<ToastConsumer />);

    let api: ReturnType<typeof toast> | null = null;

    act(() => {
      api = toast({ title: "Inicial" });
    });

    act(() => {
      api?.update({ title: "Atualizada" });
    });

    expect(screen.getByTestId("toast-title")).toHaveTextContent("Atualizada");

    act(() => {
      dismissRef?.(api?.id);
      vi.runAllTimers();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
  });
});
