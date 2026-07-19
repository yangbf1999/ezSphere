import { describe, expect, it } from "vitest";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COMPACT,
  SIDEBAR_COMPACT_BREAKPOINT,
  SIDEBAR_NAV_GROUPS,
  getSidebarIdForView,
  isAppSubView,
} from "@/config/navigation";

describe("navigation sidebar width constants", () => {
  it("SIDEBAR_WIDTH is 256", () => {
    expect(SIDEBAR_WIDTH).toBe(256);
  });

  it("SIDEBAR_WIDTH_COMPACT is 180", () => {
    expect(SIDEBAR_WIDTH_COMPACT).toBe(180);
  });

  it("SIDEBAR_COMPACT_BREAKPOINT is 1280", () => {
    expect(SIDEBAR_COMPACT_BREAKPOINT).toBe(1280);
  });

  it("compact width is less than full width", () => {
    expect(SIDEBAR_WIDTH_COMPACT).toBeLessThan(SIDEBAR_WIDTH);
  });
});

describe("SIDEBAR_NAV_GROUPS", () => {
  it("has 3 groups", () => {
    expect(SIDEBAR_NAV_GROUPS).toHaveLength(3);
  });

  it("every item has id, labelKey, and icon", () => {
    for (const group of SIDEBAR_NAV_GROUPS) {
      for (const item of group.items) {
        expect(item.id).toBeDefined();
        expect(item.labelKey).toBeDefined();
        expect(typeof item.labelKey).toBe("string");
        expect(item.icon).toBeDefined();
      }
    }
  });

  it("has unique item ids across all groups", () => {
    const ids = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes overview, apps, models, prompts, skills, mcp, sessions, install, settings", () => {
    const ids = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));
    expect(ids).toContain("overview");
    expect(ids).toContain("apps");
    expect(ids).toContain("models");
    expect(ids).toContain("prompts");
    expect(ids).toContain("skills");
    expect(ids).toContain("mcp");
    expect(ids).toContain("sessions");
    expect(ids).toContain("install");
    expect(ids).toContain("settings");
  });

  it("apps, models, prompts, skills, and mcp items have showBadge", () => {
    const items = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items);
    for (const id of ["apps", "models", "prompts", "skills", "mcp"]) {
      const item = items.find((i) => i.id === id);
      expect(item?.showBadge).toBe(true);
    }
  });

  it("sessions and install items do not have showBadge", () => {
    const items = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items);
    const sessions = items.find((i) => i.id === "sessions");
    const install = items.find((i) => i.id === "install");
    expect(sessions?.showBadge).toBeUndefined();
    expect(install?.showBadge).toBeUndefined();
  });

  it("first group has no labelKey (ungrouped)", () => {
    expect(SIDEBAR_NAV_GROUPS[0].labelKey).toBeUndefined();
  });

  it("second and third groups have labelKey", () => {
    expect(SIDEBAR_NAV_GROUPS[1].labelKey).toBeDefined();
    expect(SIDEBAR_NAV_GROUPS[2].labelKey).toBeDefined();
  });
});

describe("getSidebarIdForView", () => {
  it("maps direct views to their own sidebar id", () => {
    expect(getSidebarIdForView("overview")).toBe("overview");
    expect(getSidebarIdForView("models")).toBe("models");
    expect(getSidebarIdForView("prompts")).toBe("prompts");
    expect(getSidebarIdForView("skills")).toBe("skills");
    expect(getSidebarIdForView("mcp")).toBe("mcp");
    expect(getSidebarIdForView("sessions")).toBe("sessions");
    expect(getSidebarIdForView("install")).toBe("install");
    expect(getSidebarIdForView("settings")).toBe("settings");
  });

  it("maps providers and app sub-views to apps", () => {
    expect(getSidebarIdForView("providers")).toBe("apps");
    expect(getSidebarIdForView("workspace")).toBe("apps");
    expect(getSidebarIdForView("agents")).toBe("apps");
    expect(getSidebarIdForView("universal")).toBe("apps");
  });

  it("maps openclaw sub-views to apps", () => {
    expect(getSidebarIdForView("openclawEnv")).toBe("apps");
    expect(getSidebarIdForView("openclawTools")).toBe("apps");
    expect(getSidebarIdForView("openclawAgents")).toBe("apps");
  });

  it("maps hermesMemory to apps", () => {
    expect(getSidebarIdForView("hermesMemory")).toBe("apps");
  });
});

describe("isAppSubView", () => {
  it("returns true for app sub-views", () => {
    expect(isAppSubView("workspace")).toBe(true);
    expect(isAppSubView("openclawEnv")).toBe(true);
    expect(isAppSubView("openclawTools")).toBe(true);
    expect(isAppSubView("openclawAgents")).toBe(true);
    expect(isAppSubView("hermesMemory")).toBe(true);
    expect(isAppSubView("agents")).toBe(true);
    expect(isAppSubView("universal")).toBe(true);
  });

  it("returns false for top-level views", () => {
    expect(isAppSubView("overview")).toBe(false);
    expect(isAppSubView("models")).toBe(false);
    expect(isAppSubView("settings")).toBe(false);
    expect(isAppSubView("providers")).toBe(false);
    expect(isAppSubView("prompts")).toBe(false);
    expect(isAppSubView("skills")).toBe(false);
    expect(isAppSubView("mcp")).toBe(false);
    expect(isAppSubView("sessions")).toBe(false);
    expect(isAppSubView("install")).toBe(false);
  });
});
