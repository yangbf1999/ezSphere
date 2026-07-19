import { describe, expect, it } from "vitest";
import {
  claudeDesktopProviderPresets,
  CLAUDE_DESKTOP_ROLE_ROUTE_IDS,
} from "@/config/claudeDesktopProviderPresets";

describe("CLAUDE_DESKTOP_ROLE_ROUTE_IDS", () => {
  it("has 4 roles", () => {
    expect(Object.keys(CLAUDE_DESKTOP_ROLE_ROUTE_IDS)).toHaveLength(4);
  });

  it("contains sonnet, opus, fable, haiku with correct route IDs", () => {
    expect(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.sonnet).toBe("claude-sonnet-4-6");
    expect(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.opus).toBe("claude-opus-4-8");
    expect(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.fable).toBe("claude-fable-5");
    expect(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.haiku).toBe("claude-haiku-4-5");
  });

  it("has unique route IDs", () => {
    const ids = Object.values(CLAUDE_DESKTOP_ROLE_ROUTE_IDS);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("claudeDesktopProviderPresets structure", () => {
  it("has unique names", () => {
    const names = claudeDesktopProviderPresets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("each preset has name, websiteUrl, baseUrl, and mode", () => {
    for (const preset of claudeDesktopProviderPresets) {
      expect(preset.name).toBeDefined();
      expect(preset.websiteUrl).toBeDefined();
      expect(preset.baseUrl).toBeDefined();
      expect(preset.mode).toMatch(/^(direct|proxy)$/);
    }
  });

  it("apiFormat values are valid when present", () => {
    const validFormats = [
      "anthropic",
      "openai_chat",
      "openai_responses",
      "gemini_native",
    ];
    for (const preset of claudeDesktopProviderPresets) {
      if (preset.apiFormat) {
        expect(validFormats).toContain(preset.apiFormat);
      }
    }
  });

  it("each preset with modelRoutes has at least one route with routeId and upstreamModel", () => {
    for (const preset of claudeDesktopProviderPresets) {
      if (preset.modelRoutes) {
        expect(preset.modelRoutes.length).toBeGreaterThan(0);
        for (const route of preset.modelRoutes) {
          expect(route.routeId).toBeDefined();
          expect(route.upstreamModel).toBeDefined();
        }
      }
    }
  });

  it("all modelRoutes routeIds are from the role route ID set", () => {
    const validRouteIds = new Set(Object.values(CLAUDE_DESKTOP_ROLE_ROUTE_IDS));
    for (const preset of claudeDesktopProviderPresets) {
      if (preset.modelRoutes) {
        for (const route of preset.modelRoutes) {
          expect(validRouteIds.has(route.routeId)).toBe(true);
        }
      }
    }
  });
});

describe("claudeDesktopProviderPresets categories", () => {
  it("official preset has category official", () => {
    const official = claudeDesktopProviderPresets.find(
      (p) => p.name === "Claude Desktop Official",
    );
    expect(official?.category).toBe("official");
  });

  it("has presets across multiple categories", () => {
    const categories = new Set(
      claudeDesktopProviderPresets.map((p) => p.category),
    );
    expect(categories.size).toBeGreaterThan(1);
    expect(categories.has("official")).toBe(true);
    expect(categories.has("aggregator")).toBe(true);
    expect(categories.has("cn_official")).toBe(true);
  });
});

describe("claudeDesktopProviderPresets OAuth", () => {
  it("GitHub Copilot has requiresOAuth and providerType github_copilot", () => {
    const gh = claudeDesktopProviderPresets.find(
      (p) => p.name === "GitHub Copilot",
    );
    expect(gh?.requiresOAuth).toBe(true);
    expect(gh?.providerType).toBe("github_copilot");
  });

  it("Codex has requiresOAuth and providerType codex_oauth", () => {
    const codex = claudeDesktopProviderPresets.find((p) => p.name === "Codex");
    expect(codex?.requiresOAuth).toBe(true);
    expect(codex?.providerType).toBe("codex_oauth");
  });

  it("non-OAuth presets do not have requiresOAuth", () => {
    const nonOAuth = claudeDesktopProviderPresets.filter(
      (p) => !p.requiresOAuth,
    );
    expect(nonOAuth.length).toBeGreaterThan(0);
    for (const p of nonOAuth) {
      expect(p.requiresOAuth).toBeUndefined();
    }
  });
});

describe("claudeDesktopProviderPresets partners", () => {
  it("primePartner presets have primePartner flag", () => {
    const kimi = claudeDesktopProviderPresets.find((p) => p.name === "Kimi");
    const kimiCoding = claudeDesktopProviderPresets.find(
      (p) => p.name === "Kimi For Coding",
    );
    expect(kimi?.primePartner).toBe(true);
    expect(kimiCoding?.primePartner).toBe(true);
  });

  it("isPartner presets have partnerPromotionKey", () => {
    const partners = claudeDesktopProviderPresets.filter((p) => p.isPartner);
    expect(partners.length).toBeGreaterThan(0);
    for (const p of partners) {
      expect(p.partnerPromotionKey).toBeDefined();
    }
  });
});

describe("claudeDesktopProviderPresets route factories", () => {
  it("brandedRoutes deduplicates identical upstream models", () => {
    // 火山Agentplan uses brandedRoutes with all 3 same upstream -> dedup to 1 route
    const volc = claudeDesktopProviderPresets.find(
      (p) => p.name === "火山Agentplan",
    );
    expect(volc?.modelRoutes).toHaveLength(1);
    expect(volc?.modelRoutes?.[0].upstreamModel).toBe("ark-code-latest");
    expect(volc?.modelRoutes?.[0].labelOverride).toBe("ark-code-latest");
  });

  it("brandedRoutes keeps distinct upstream models as separate routes with labelOverride", () => {
    // GitHub Copilot has distinct sonnet/haiku upstreams
    const gh = claudeDesktopProviderPresets.find(
      (p) => p.name === "GitHub Copilot",
    );
    const routes = gh?.modelRoutes!;
    // sonnet and opus both map to claude-sonnet-4.6 (dedup to 1), haiku is distinct
    expect(routes.length).toBe(2);
    for (const route of routes) {
      expect(route.labelOverride).toBe(route.upstreamModel);
    }
  });

  it("passthroughRoutes produces 3 routes with matching routeId and upstreamModel", () => {
    const ccsub = claudeDesktopProviderPresets.find((p) => p.name === "CCSub");
    expect(ccsub?.modelRoutes).toHaveLength(3);
    for (const route of ccsub!.modelRoutes!) {
      expect(route.routeId).toBe(route.upstreamModel);
      expect(route.labelOverride).toBeUndefined();
    }
  });

  it("passthroughRoutes with supports1m=true sets supports1m on all routes", () => {
    const ccsub = claudeDesktopProviderPresets.find((p) => p.name === "CCSub");
    for (const route of ccsub!.modelRoutes!) {
      expect(route.supports1m).toBe(true);
    }
  });

  it("mappedRoutes produces 3 routes with correct routeIds and custom upstreamModels", () => {
    const ssy = claudeDesktopProviderPresets.find(
      (p) => p.name === "Shengsuanyun",
    );
    const routes = ssy?.modelRoutes!;
    expect(routes).toHaveLength(3);
    expect(routes[0].routeId).toBe(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.sonnet);
    expect(routes[0].upstreamModel).toBe("anthropic/claude-sonnet-4.6");
    expect(routes[1].routeId).toBe(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.opus);
    expect(routes[1].upstreamModel).toBe("anthropic/claude-opus-4.8");
    expect(routes[2].routeId).toBe(CLAUDE_DESKTOP_ROLE_ROUTE_IDS.haiku);
    expect(routes[2].upstreamModel).toBe("anthropic/claude-haiku-4.5");
  });
});

describe("claudeDesktopProviderPresets specific formats", () => {
  it("Codex preset uses openai_responses format", () => {
    const codex = claudeDesktopProviderPresets.find((p) => p.name === "Codex");
    expect(codex?.apiFormat).toBe("openai_responses");
  });

  it("Gemini Native preset uses gemini_native format", () => {
    const gemini = claudeDesktopProviderPresets.find(
      (p) => p.name === "Gemini Native",
    );
    expect(gemini?.apiFormat).toBe("gemini_native");
  });

  it("GitHub Copilot preset uses openai_chat format", () => {
    const gh = claudeDesktopProviderPresets.find(
      (p) => p.name === "GitHub Copilot",
    );
    expect(gh?.apiFormat).toBe("openai_chat");
  });
});
