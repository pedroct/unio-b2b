import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useIsMobile } from "./use-mobile";

type Listener = () => void;
let listeners: Listener[] = [];

function setWidth(width: number) {
  window.innerWidth = width;
  listeners.forEach((listener) => listener());
}

function TestComponent() {
  const isMobile = useIsMobile();
  return <div data-testid="is-mobile">{String(isMobile)}</div>;
}

describe("useIsMobile", () => {
  beforeEach(() => {
    listeners = [];
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width") ? window.innerWidth < 768 : false,
      addEventListener: (_event: string, callback: Listener) => {
        listeners.push(callback);
      },
      removeEventListener: (_event: string, callback: Listener) => {
        listeners = listeners.filter((listener) => listener !== callback);
      },
    })) as unknown as typeof window.matchMedia;
  });

  it("returns true when below breakpoint", () => {
    window.innerWidth = 500;
    render(<TestComponent />);

    expect(screen.getByTestId("is-mobile")).toHaveTextContent("true");
  });

  it("updates when width changes", () => {
    window.innerWidth = 1024;
    render(<TestComponent />);

    expect(screen.getByTestId("is-mobile")).toHaveTextContent("false");

    act(() => {
      setWidth(600);
    });

    expect(screen.getByTestId("is-mobile")).toHaveTextContent("true");
  });
});
