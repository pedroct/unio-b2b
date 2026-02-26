import { beforeEach, describe, expect, it, vi } from "vitest";

const renderMock = vi.fn();

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({ render: renderMock })),
}));

vi.mock("./App", () => ({
  default: () => null,
}));

describe("main entry", () => {
  beforeEach(() => {
    vi.resetModules();
    renderMock.mockReset();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("renders the app into the root element", async () => {
    const { createRoot } = await import("react-dom/client");

    await import("./main");

    expect(createRoot).toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalled();
  });
});
