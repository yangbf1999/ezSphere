import { describe, expect, it } from "vitest";
import type { AppId } from "@/lib/api/types";
import {
  APP_IDS,
  PROVIDER_TAB_APP_IDS,
  CLI_STATUS_APP_IDS,
  CLI_TOOL_DISPLAY_NAMES,
  APP_SWITCHER_ICON,
  APP_SWITCHER_LABEL,
  isCliStatusApp,
  SKILLS_APP_IDS,
  MCP_APP_IDS,
  APP_ICON_MAP,
} from "@/config/appConfig";

const ALL_APP_IDS: AppId[] = [
  "claude",
  "claude-desktop",
  "codex",
  "gemini",
  "opencode",
  "openclaw",
  "hermes",
];

describe("appConfig APP_IDS", () => {
  it("contains the active app IDs", () => {
    expect(APP_IDS).toContain("claude");
    expect(APP_IDS).toContain("codex");
    expect(APP_IDS).toContain("hermes");
  });

  it("does not contain commented-out apps", () => {
    expect(APP_IDS).not.toContain("gemini");
    expect(APP_IDS).not.toContain("opencode");
    expect(APP_IDS).not.toContain("openclaw");
    expect(APP_IDS).not.toContain("claude-desktop");
  });

  it("has unique entries", () => {
    expect(new Set(APP_IDS).size).toBe(APP_IDS.length);
  });
});

describe("appConfig PROVIDER_TAB_APP_IDS", () => {
  it("is a subset of APP_IDS", () => {
    for (const id of PROVIDER_TAB_APP_IDS) {
      expect(APP_IDS).toContain(id);
    }
  });

  it("includes claude, codex, hermes", () => {
    expect(PROVIDER_TAB_APP_IDS).toEqual(["claude", "codex", "hermes"]);
  });
});

describe("appConfig CLI_STATUS_APP_IDS", () => {
  it("is a subset of APP_IDS", () => {
    for (const id of CLI_STATUS_APP_IDS) {
      expect(APP_IDS).toContain(id);
    }
  });

  it("has unique entries", () => {
    expect(new Set(CLI_STATUS_APP_IDS).size).toBe(CLI_STATUS_APP_IDS.length);
  });
});

describe("appConfig CLI_TOOL_DISPLAY_NAMES", () => {
  it("has a display name for every CLI status app", () => {
    for (const id of CLI_STATUS_APP_IDS) {
      expect(CLI_TOOL_DISPLAY_NAMES[id]).toBeDefined();
      expect(typeof CLI_TOOL_DISPLAY_NAMES[id]).toBe("string");
      expect(CLI_TOOL_DISPLAY_NAMES[id].length).toBeGreaterThan(0);
    }
  });

  it("uses correct display names", () => {
    expect(CLI_TOOL_DISPLAY_NAMES.claude).toBe("Claude Code");
    expect(CLI_TOOL_DISPLAY_NAMES.codex).toBe("Codex CLI");
    expect(CLI_TOOL_DISPLAY_NAMES.hermes).toBe("Hermes");
  });
});

describe("appConfig APP_SWITCHER_ICON", () => {
  it("has an icon string for every active APP_ID", () => {
    for (const id of APP_IDS) {
      expect(APP_SWITCHER_ICON[id]).toBeDefined();
      expect(typeof APP_SWITCHER_ICON[id]).toBe("string");
    }
  });

  it("uses correct icon identifiers", () => {
    expect(APP_SWITCHER_ICON.claude).toBe("claude");
    expect(APP_SWITCHER_ICON.codex).toBe("openai");
    expect(APP_SWITCHER_ICON.hermes).toBe("hermes");
  });
});

describe("appConfig APP_SWITCHER_LABEL", () => {
  it("has a label string for every active APP_ID", () => {
    for (const id of APP_IDS) {
      expect(APP_SWITCHER_LABEL[id]).toBeDefined();
      expect(typeof APP_SWITCHER_LABEL[id]).toBe("string");
    }
  });

  it("uses correct labels", () => {
    expect(APP_SWITCHER_LABEL.claude).toBe("Claude Code");
    expect(APP_SWITCHER_LABEL.codex).toBe("Codex");
    expect(APP_SWITCHER_LABEL.hermes).toBe("Hermes");
  });
});

describe("appConfig isCliStatusApp", () => {
  it("returns true for CLI status apps", () => {
    expect(isCliStatusApp("claude")).toBe(true);
    expect(isCliStatusApp("codex")).toBe(true);
    expect(isCliStatusApp("hermes")).toBe(true);
  });

  it("returns false for non-CLI status apps", () => {
    expect(isCliStatusApp("gemini")).toBe(false);
    expect(isCliStatusApp("opencode")).toBe(false);
    expect(isCliStatusApp("openclaw")).toBe(false);
    expect(isCliStatusApp("claude-desktop")).toBe(false);
  });
});

describe("appConfig SKILLS_APP_IDS and MCP_APP_IDS", () => {
  it("SKILLS_APP_IDS is a subset of APP_IDS", () => {
    for (const id of SKILLS_APP_IDS) {
      expect(APP_IDS).toContain(id);
    }
  });

  it("MCP_APP_IDS equals SKILLS_APP_IDS", () => {
    expect(MCP_APP_IDS).toEqual(SKILLS_APP_IDS);
  });

  it("excludes openclaw from skills and MCP", () => {
    expect(SKILLS_APP_IDS).not.toContain("openclaw");
    expect(MCP_APP_IDS).not.toContain("openclaw");
  });
});

describe("appConfig APP_ICON_MAP", () => {
  it("has an entry for every AppId", () => {
    for (const id of ALL_APP_IDS) {
      expect(APP_ICON_MAP[id]).toBeDefined();
    }
  });

  it("each entry has label, activeClass, and badgeClass as strings", () => {
    for (const id of ALL_APP_IDS) {
      const config = APP_ICON_MAP[id];
      expect(typeof config.label).toBe("string");
      expect(config.label.length).toBeGreaterThan(0);
      expect(typeof config.activeClass).toBe("string");
      expect(config.activeClass.length).toBeGreaterThan(0);
      expect(typeof config.badgeClass).toBe("string");
      expect(config.badgeClass.length).toBeGreaterThan(0);
    }
  });

  it("each entry has a React element icon", () => {
    for (const id of ALL_APP_IDS) {
      const config = APP_ICON_MAP[id];
      expect(config.icon).toBeDefined();
      // React element is a plain object with $$typeof symbol
      expect(typeof config.icon).toBe("object");
    }
  });
});
