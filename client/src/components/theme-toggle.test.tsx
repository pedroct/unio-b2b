import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("toggles dark mode and stores preference", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByTestId("button-theme-toggle");

    await user.click(button);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("unio_theme")).toBe("dark");
  });

  it("hydrates from stored preference", async () => {
    localStorage.setItem("unio_theme", "dark");

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
