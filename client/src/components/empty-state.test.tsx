import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title, description, icon, and action", () => {
    render(
      <EmptyState
        icon={<span data-testid="icon" />}
        title="Sem dados"
        description="Nenhum item encontrado"
        action={<button data-testid="action">Tentar novamente</button>}
        module="nutrition"
      />,
    );

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("text-empty-title")).toHaveTextContent("Sem dados");
    expect(screen.getByTestId("text-empty-description")).toHaveTextContent(
      "Nenhum item encontrado",
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByTestId("action")).toBeInTheDocument();
  });
});
