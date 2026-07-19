import { describe, it, expect, beforeEach, vi } from "vitest";

describe("toolsStore", () => {
  let useToolsStore: typeof import("@/stores/toolsStore")["useToolsStore"];

  beforeEach(async () => {
    vi.resetModules();
    ({ useToolsStore } = await import("@/stores/toolsStore"));
  });

  it("has correct initial state", () => {
    const state = useToolsStore();
    expect(state.detectedTools).toEqual([]);
    expect(typeof state.setDetectedTools).toBe("function");
  });

  it("useToolsStore with selector returns the selected value", () => {
    const tools = useToolsStore((s) => s.detectedTools);
    expect(tools).toEqual([]);

    const setter = useToolsStore((s) => s.setDetectedTools);
    expect(typeof setter).toBe("function");
  });

  it("useToolsStore without selector returns the full state", () => {
    const state = useToolsStore();
    expect(state).toHaveProperty("detectedTools");
    expect(state).toHaveProperty("setDetectedTools");
  });

  it("returns a consistent state reference across calls", () => {
    const state1 = useToolsStore();
    const state2 = useToolsStore();
    expect(state1).toBe(state2);
  });

  it("setDetectedTools is a no-op stub that returns undefined", () => {
    const state = useToolsStore();
    const result = state.setDetectedTools([
      {
        id: "test",
        name: "Test Tool",
        category: "test",
        installed: true,
      },
    ]);
    expect(result).toBeUndefined();
    // State is not updated because setDetectedTools is a no-op
    expect(useToolsStore().detectedTools).toEqual([]);
  });

  it("state is isolated per module reset", async () => {
    // Mutate the current module's state directly
    const state1 = useToolsStore();
    state1.detectedTools.push({
      id: "injected",
      name: "Injected",
      category: "test",
      installed: true,
    });
    expect(useToolsStore().detectedTools).toHaveLength(1);

    // Reset modules and re-import: new module should have fresh state
    vi.resetModules();
    const { useToolsStore: freshUseToolsStore } = await import(
      "@/stores/toolsStore"
    );
    expect(freshUseToolsStore().detectedTools).toEqual([]);
  });
});
