import { describe, it, expect, vi, beforeEach } from "vitest";
import { providersApi, universalProvidersApi } from "@/lib/api";
import { loadEzSphereAgentModels } from "@/pages/MotherAgent/ezsphereModels";
import type { Provider, UniversalProvider } from "@/types";

function makeProvider(
  id: string,
  settingsConfig: Record<string, any>,
  overrides: Partial<Provider> = {},
): Provider {
  return {
    id,
    name: id,
    settingsConfig,
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("loadEzSphereAgentModels", () => {
  it("collects claude models from env-based config with default model fallback", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "claude") {
        return {
          "my-claude": makeProvider("my-claude", {
            env: {
              ANTHROPIC_BASE_URL: "https://api.anthropic.com",
              ANTHROPIC_API_KEY: "sk-test",
            },
            apiKey: "sk-test",
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(1);
    expect(models[0].modelId).toBe("claude-sonnet-4-20250514");
    expect(models[0].baseUrl).toBe("https://api.anthropic.com");
    expect(models[0].apiKey).toBe("sk-test");
    expect(models[0].modelType).toBe("CLOUD");
    expect(models[0].anthropicUrl).toBe("https://api.anthropic.com");
    expect(models[0].name).toContain("my-claude");
  });

  it("collects claude models from custom env model ids", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "claude") {
        return {
          "my-claude": makeProvider("my-claude", {
            env: {
              ANTHROPIC_BASE_URL: "https://custom.api.com",
              ANTHROPIC_API_KEY: "sk-custom",
              ANTHROPIC_MODEL: "claude-opus-4-20250514",
              ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-custom",
            },
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(2);
    const modelIds = models.map((m) => m.modelId).sort();
    expect(modelIds).toEqual([
      "claude-opus-4-20250514",
      "claude-sonnet-custom",
    ]);
  });

  it("falls back to default base URL when env contains template variables", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "claude") {
        return {
          "templated": makeProvider("templated", {
            env: {
              ANTHROPIC_BASE_URL: "${BASE_URL}",
              ANTHROPIC_API_KEY: "${API_KEY}",
            },
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    // Template variables are not usable, but baseUrl falls back to the
    // Anthropic default. The model is collected with the default URL.
    expect(models).toHaveLength(1);
    expect(models[0].baseUrl).toBe("https://api.anthropic.com");
    // apiKey is a template variable -> empty string
    expect(models[0].apiKey).toBe("");
  });

  it("collects opencode models from settings.models object", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "opencode") {
        return {
          "oc-1": makeProvider("oc-1", {
            baseURL: "https://api.opencode.com",
            apiKey: "oc-key",
            models: {
              "gpt-4o": { name: "GPT-4o" },
              "claude-3": { name: "Claude 3" },
            },
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(2);
    const names = models.map((m) => m.name).sort();
    expect(names).toEqual(["oc-1 / Claude 3", "oc-1 / GPT-4o"]);
  });

  it("collects openclaw models from array config and detects anthropic mode", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "openclaw") {
        return {
          "oc-provider": makeProvider("oc-provider", {
            baseUrl: "https://api.openclaw.com",
            apiKey: "oc-key",
            api: "anthropic",
            models: [
              { id: "claude-sonnet-4", name: "Sonnet 4" },
              { id: "claude-haiku", name: "Haiku" },
            ],
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(2);
    // anthropic mode should set anthropicUrl
    models.forEach((m) => {
      expect(m.anthropicUrl).toBe("https://api.openclaw.com");
      expect(m.modelType).toBe("CLOUD");
    });
  });

  it("collects both official and custom Gemini providers", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "gemini") {
        return {
          "gemini-official": makeProvider(
            "gemini-official",
            { env: {} },
            { category: "official", name: "Google Official" },
          ),
          "my-gemini": makeProvider("my-gemini", {
            env: {
              GEMINI_API_KEY: "gem-key",
              GEMINI_MODEL: "gemini-2.5-pro",
            },
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(2);
    expect(models.some((model) => model.name.includes("Google Official"))).toBe(true);
    expect(models.some((model) => model.name.includes("my-gemini"))).toBe(true);
  });

  it("collects models from universal providers with claude and codex apps", async () => {
    vi.spyOn(providersApi, "getAll").mockResolvedValue({});
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({
      "uni-1": {
        id: "uni-1",
        name: "Universal Provider",
        baseUrl: "https://api.universal.com",
        apiKey: "uni-key",
        apps: { claude: true, codex: true },
        models: {
          claude: { model: "claude-sonnet-4-20250514" },
          codex: { model: "gpt-4o" },
        },
      } as UniversalProvider,
    });

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(2);
    const modes = models.map((m) => m.internalId);
    expect(modes.some((id) => id.includes("universal-claude"))).toBe(true);
    expect(modes.some((id) => id.includes("universal-codex"))).toBe(true);
    // Claude model should have anthropicUrl set
    const claudeModel = models.find((m) =>
      m.internalId.includes("universal-claude"),
    );
    expect(claudeModel?.anthropicUrl).toBe("https://api.universal.com");
  });

  it("continues collecting from other apps when one app fails", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "claude") {
        throw new Error("config read failed");
      }
      if (appId === "codex") {
        return {
          "codex-1": makeProvider("codex-1", {
            config: 'model = "gpt-4o"\n',
            auth: { OPENAI_API_KEY: "codex-key" },
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    // Claude failed but codex should still produce a model
    expect(models.length).toBeGreaterThanOrEqual(1);
    expect(models.some((m) => m.name.includes("codex-1"))).toBe(true);
  });

  it("deduplicates models with the same app/provider/baseUrl/modelId", async () => {
    // Same provider appearing under both openclaw and hermes with identical config
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "openclaw" || appId === "hermes") {
        return {
          "shared": makeProvider("shared", {
            baseUrl: "https://api.shared.com",
            apiKey: "shared-key",
            api: "openai",
            models: [{ id: "model-a" }],
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    // Both apps should produce a model since the dedup key includes appId
    expect(models).toHaveLength(2);
    const appKeys = models.map((m) => m.internalId);
    expect(appKeys.some((k) => k.includes("openclaw"))).toBe(true);
    expect(appKeys.some((k) => k.includes("hermes"))).toBe(true);
  });

  it("keeps models whose provider is named Google Official", async () => {
    vi.spyOn(providersApi, "getAll").mockImplementation(async (appId): Promise<Record<string, Provider>> => {
      if (appId === "openclaw") {
        return {
          "go-1": makeProvider(
            "go-1",
            {
              baseUrl: "https://api.google.com",
              apiKey: "g-key",
              api: "openai",
              models: [{ id: "gemini-pro" }],
            },
            { name: "Google Official" },
          ),
          "real": makeProvider("real", {
            baseUrl: "https://api.real.com",
            apiKey: "r-key",
            api: "openai",
            models: [{ id: "real-model" }],
          }),
        };
      }
      return {};
    });
    vi.spyOn(universalProvidersApi, "getAll").mockResolvedValue({});

    const models = await loadEzSphereAgentModels();

    expect(models).toHaveLength(2);
    expect(models.some((model) => model.name.includes("Google Official"))).toBe(true);
    expect(models.some((model) => model.name.includes("real"))).toBe(true);
  });
});
