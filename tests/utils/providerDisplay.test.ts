import { describe, expect, it, vi } from "vitest";
import {
  extractApiBaseUrlFromConfig,
  extractProviderApiKey,
  extractProviderApiUrl,
  extractProviderModelId,
  formatHost,
  getPresetInitial,
  getProviderCategoryLabel,
  getProviderModelSubtitle,
  isUniversalSyncedProviderId,
  maskSecret,
  resolveDisplayBaseUrl,
} from "@/utils/providerDisplay";
import type { Provider } from "@/types";

const provider = (over: Partial<Provider> & { id: string }): Provider =>
  ({
    name: over.id,
    settingsConfig: {},
    ...over,
  }) as Provider;

describe("formatHost", () => {
  it("空值或纯空白返回 '-'", () => {
    expect(formatHost(undefined)).toBe("-");
    expect(formatHost("")).toBe("-");
    expect(formatHost("   ")).toBe("-");
  });

  it("去除 http:// 和 https:// 前缀", () => {
    expect(formatHost("https://api.example.com")).toBe("api.example.com");
    expect(formatHost("http://api.example.com")).toBe("api.example.com");
  });

  it("去除末尾斜杠", () => {
    expect(formatHost("https://api.example.com/")).toBe("api.example.com");
    expect(formatHost("https://api.example.com/v1///")).toBe(
      "api.example.com/v1",
    );
  });

  it("无协议的 URL 原样返回（仅去末尾斜杠）", () => {
    expect(formatHost("api.example.com/v1/")).toBe("api.example.com/v1");
  });
});

describe("extractApiBaseUrlFromConfig", () => {
  it("null 或非对象返回 undefined", () => {
    expect(extractApiBaseUrlFromConfig(null)).toBeUndefined();
    expect(extractApiBaseUrlFromConfig(undefined)).toBeUndefined();
    expect(extractApiBaseUrlFromConfig("string")).toBeUndefined();
    expect(extractApiBaseUrlFromConfig(42)).toBeUndefined();
  });

  it("优先返回顶层 base_url", () => {
    expect(
      extractApiBaseUrlFromConfig({ base_url: "https://api.x.com" }),
    ).toBe("https://api.x.com");
  });

  it("base_url 为空白时跳过", () => {
    expect(
      extractApiBaseUrlFromConfig({ base_url: "   " }),
    ).toBeUndefined();
  });

  it("从 env.ANTHROPIC_BASE_URL 提取", () => {
    expect(
      extractApiBaseUrlFromConfig({
        env: { ANTHROPIC_BASE_URL: "https://anthropic.x.com" },
      }),
    ).toBe("https://anthropic.x.com");
  });

  it("从 env.GOOGLE_GEMINI_BASE_URL 提取", () => {
    expect(
      extractApiBaseUrlFromConfig({
        env: { GOOGLE_GEMINI_BASE_URL: "https://gemini.x.com" },
      }),
    ).toBe("https://gemini.x.com");
  });

  it("从 env.GEMINI_BASE_URL 提取", () => {
    expect(
      extractApiBaseUrlFromConfig({
        env: { GEMINI_BASE_URL: "https://g.x.com" },
      }),
    ).toBe("https://g.x.com");
  });

  it("ANTHROPIC_BASE_URL 优先于 GEMINI_BASE_URL", () => {
    expect(
      extractApiBaseUrlFromConfig({
        env: {
          ANTHROPIC_BASE_URL: "https://a.x.com",
          GEMINI_BASE_URL: "https://g.x.com",
        },
      }),
    ).toBe("https://a.x.com");
  });

  it("base_url 优先于 env", () => {
    expect(
      extractApiBaseUrlFromConfig({
        base_url: "https://top.x.com",
        env: { ANTHROPIC_BASE_URL: "https://env.x.com" },
      }),
    ).toBe("https://top.x.com");
  });

  it("从 Codex TOML config 字符串提取 base_url", () => {
    const toml = [
      'model = "claude-sonnet-4"',
      'model_provider = "myprovider"',
      "",
      "[model_providers.myprovider]",
      'base_url = "https://codex.x.com/v1"',
    ].join("\n");
    expect(
      extractApiBaseUrlFromConfig({ config: toml }),
    ).toBe("https://codex.x.com/v1");
  });

  it("config 字符串不含 base_url 时返回 undefined", () => {
    const toml = 'model = "claude-sonnet-4"';
    expect(
      extractApiBaseUrlFromConfig({ config: toml }),
    ).toBeUndefined();
  });

  it("config 非字符串时返回 undefined", () => {
    expect(
      extractApiBaseUrlFromConfig({ config: { base_url: "x" } }),
    ).toBeUndefined();
  });

  it("无任何可识别字段时返回 undefined", () => {
    expect(extractApiBaseUrlFromConfig({ foo: "bar" })).toBeUndefined();
  });
});

describe("resolveDisplayBaseUrl", () => {
  it("baseUrl 存在时优先返回", () => {
    expect(
      resolveDisplayBaseUrl("https://api.x.com", "https://web.x.com"),
    ).toBe("https://api.x.com");
  });

  it("baseUrl 为空时回退到 websiteUrl", () => {
    expect(resolveDisplayBaseUrl("", "https://web.x.com")).toBe(
      "https://web.x.com",
    );
    expect(resolveDisplayBaseUrl(undefined, "https://web.x.com")).toBe(
      "https://web.x.com",
    );
  });

  it("两者均为空时返回 undefined", () => {
    expect(resolveDisplayBaseUrl("", "")).toBeUndefined();
    expect(resolveDisplayBaseUrl(undefined, undefined)).toBeUndefined();
    expect(resolveDisplayBaseUrl("  ", "  ")).toBeUndefined();
  });
});

describe("maskSecret", () => {
  it("空值返回 '-'", () => {
    expect(maskSecret("")).toBe("-");
    expect(maskSecret("   ")).toBe("-");
  });

  it("长度 <= 8 时全掩码", () => {
    expect(maskSecret("short")).toBe("••••••••");
    expect(maskSecret("12345678")).toBe("••••••••");
    expect(maskSecret("ab")).toBe("••••••••");
  });

  it("长度 > 8 时保留前 7 字符 + 掩码", () => {
    expect(maskSecret("sk-1234567890")).toBe("sk-1234••••••••");
    expect(maskSecret("123456789")).toBe("1234567••••••••");
  });

  it("先 trim 再处理", () => {
    // trim 后 "sk-very-long-key" 长度 > 8，保留前 7 字符
    expect(maskSecret("  sk-very-long-key  ")).toBe("sk-very••••••••");
  });
});

describe("extractProviderApiUrl", () => {
  it("notes 存在时优先返回 notes", () => {
    const p = provider({
      id: "p1",
      notes: "https://notes.x.com",
      websiteUrl: "https://web.x.com",
      settingsConfig: { base_url: "https://api.x.com" },
    });
    expect(extractProviderApiUrl(p, "fallback")).toBe("https://notes.x.com");
  });

  it("notes 为空时返回 websiteUrl", () => {
    const p = provider({
      id: "p1",
      websiteUrl: "https://web.x.com",
      settingsConfig: { base_url: "https://api.x.com" },
    });
    expect(extractProviderApiUrl(p, "fallback")).toBe("https://web.x.com");
  });

  it("notes 和 websiteUrl 均空时从 settingsConfig 提取 base_url", () => {
    const p = provider({
      id: "p1",
      settingsConfig: { base_url: "https://api.x.com" },
    });
    expect(extractProviderApiUrl(p, "fallback")).toBe("https://api.x.com");
  });

  it("所有来源均无时返回 fallbackText", () => {
    const p = provider({ id: "p1", settingsConfig: {} });
    expect(extractProviderApiUrl(p, "fallback")).toBe("fallback");
  });
});

describe("extractProviderApiKey", () => {
  it("config 非对象时返回空字符串", () => {
    const p = provider({ id: "p1", settingsConfig: null as any });
    expect(extractProviderApiKey(p, "claude")).toBe("");
  });

  describe("codex", () => {
    it("从 auth.OPENAI_API_KEY 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { auth: { OPENAI_API_KEY: "sk-openai" } },
      });
      expect(extractProviderApiKey(p, "codex")).toBe("sk-openai");
    });

    it("auth.OPENAI_API_KEY 为空时从 config TOML 提取 bearer token", () => {
      const toml = [
        'model = "gpt-4"',
        'model_provider = "myprovider"',
        "",
        "[model_providers.myprovider]",
        'base_url = "https://x.com"',
        'experimental_bearer_token = "sk-bearer"',
      ].join("\n");
      const p = provider({
        id: "p1",
        settingsConfig: { auth: {}, config: toml },
      });
      expect(extractProviderApiKey(p, "codex")).toBe("sk-bearer");
    });

    it("均无时返回空字符串", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { auth: {}, config: 'model = "gpt-4"' },
      });
      expect(extractProviderApiKey(p, "codex")).toBe("");
    });
  });

  describe("hermes", () => {
    it("从 api_key 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { api_key: "hermes-key" },
      });
      expect(extractProviderApiKey(p, "hermes")).toBe("hermes-key");
    });

    it("api_key 非字符串时返回空", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { api_key: 123 },
      });
      expect(extractProviderApiKey(p, "hermes")).toBe("");
    });
  });

  describe("claude", () => {
    it("从顶层 apiKey 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { apiKey: "top-key" },
      });
      expect(extractProviderApiKey(p, "claude")).toBe("top-key");
    });

    it("从 env.ANTHROPIC_AUTH_TOKEN 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { env: { ANTHROPIC_AUTH_TOKEN: "auth-token" } },
      });
      expect(extractProviderApiKey(p, "claude")).toBe("auth-token");
    });

    it("ANTHROPIC_AUTH_TOKEN 优先于 ANTHROPIC_API_KEY", () => {
      const p = provider({
        id: "p1",
        settingsConfig: {
          env: {
            ANTHROPIC_AUTH_TOKEN: "token",
            ANTHROPIC_API_KEY: "key",
          },
        },
      });
      expect(extractProviderApiKey(p, "claude")).toBe("token");
    });

    it("回退到 env.ANTHROPIC_API_KEY", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { env: { ANTHROPIC_API_KEY: "api-key" } },
      });
      expect(extractProviderApiKey(p, "claude")).toBe("api-key");
    });

    it("含 ${ 的 apiKey 被跳过", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { apiKey: "${VAR}", env: { ANTHROPIC_API_KEY: "real" } },
      });
      expect(extractProviderApiKey(p, "claude")).toBe("real");
    });
  });

  describe("gemini", () => {
    it("从 env.GEMINI_API_KEY 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { env: { GEMINI_API_KEY: "gem-key" } },
      });
      expect(extractProviderApiKey(p, "gemini")).toBe("gem-key");
    });

    it("从顶层 apiKey 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { apiKey: "top-gem" },
      });
      expect(extractProviderApiKey(p, "gemini")).toBe("top-gem");
    });
  });
});

describe("extractProviderModelId", () => {
  it("config 非对象时返回空字符串", () => {
    const p = provider({ id: "p1", settingsConfig: null as any });
    expect(extractProviderModelId(p, "claude")).toBe("");
  });

  describe("claude", () => {
    it("从 env.ANTHROPIC_MODEL 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { env: { ANTHROPIC_MODEL: "claude-sonnet" } },
      });
      expect(extractProviderModelId(p, "claude")).toBe("claude-sonnet");
    });

    it("ANTHROPIC_MODEL 优先于 ANTHROPIC_MODEL_NAME", () => {
      const p = provider({
        id: "p1",
        settingsConfig: {
          env: {
            ANTHROPIC_MODEL: "first",
            ANTHROPIC_MODEL_NAME: "second",
          },
        },
      });
      expect(extractProviderModelId(p, "claude")).toBe("first");
    });

    it("回退到 ANTHROPIC_DEFAULT_SONNET_MODEL", () => {
      const p = provider({
        id: "p1",
        settingsConfig: {
          env: { ANTHROPIC_DEFAULT_SONNET_MODEL: "sonnet-id" },
        },
      });
      expect(extractProviderModelId(p, "claude")).toBe("sonnet-id");
    });

    it("所有候选均无时返回空字符串", () => {
      const p = provider({ id: "p1", settingsConfig: { env: {} } });
      expect(extractProviderModelId(p, "claude")).toBe("");
    });
  });

  describe("codex", () => {
    it("从 config TOML 提取 model", () => {
      const toml = 'model = "gpt-4o"';
      const p = provider({ id: "p1", settingsConfig: { config: toml } });
      expect(extractProviderModelId(p, "codex")).toBe("gpt-4o");
    });

    it("TOML 无 model 时从 modelCatalog.models 数组提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: {
          config: "",
          modelCatalog: { models: [{ model: "catalog-model" }] },
        },
      });
      expect(extractProviderModelId(p, "codex")).toBe("catalog-model");
    });

    it("均无时返回空字符串", () => {
      const p = provider({ id: "p1", settingsConfig: { config: "" } });
      expect(extractProviderModelId(p, "codex")).toBe("");
    });
  });

  describe("gemini", () => {
    it("从 env.GEMINI_MODEL 提取", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { env: { GEMINI_MODEL: "gemini-pro" } },
      });
      expect(extractProviderModelId(p, "gemini")).toBe("gemini-pro");
    });

    it("无 GEMINI_MODEL 时返回空字符串", () => {
      const p = provider({ id: "p1", settingsConfig: { env: {} } });
      expect(extractProviderModelId(p, "gemini")).toBe("");
    });
  });

  describe("opencode", () => {
    it("从 models 对象提取第一个 key", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { models: { "model-a": {}, "model-b": {} } },
      });
      expect(extractProviderModelId(p, "opencode")).toBe("model-a");
    });

    it("models 为空对象时返回空字符串", () => {
      const p = provider({ id: "p1", settingsConfig: { models: {} } });
      expect(extractProviderModelId(p, "opencode")).toBe("");
    });
  });

  describe("openclaw / hermes", () => {
    it("从 models 数组提取第一个元素的 id", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { models: [{ id: "m1" }, { id: "m2" }] },
      });
      expect(extractProviderModelId(p, "openclaw")).toBe("m1");
      expect(extractProviderModelId(p, "hermes")).toBe("m1");
    });

    it("数组元素无 id 时回退到 model 字段", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { models: [{ model: "fallback-model" }] },
      });
      expect(extractProviderModelId(p, "hermes")).toBe("fallback-model");
    });

    it("数组为空时回退到 models 对象的 key", () => {
      const p = provider({
        id: "p1",
        settingsConfig: { models: { "key-model": {} } },
      });
      expect(extractProviderModelId(p, "openclaw")).toBe("key-model");
    });

    it("均无时返回空字符串", () => {
      const p = provider({ id: "p1", settingsConfig: {} });
      expect(extractProviderModelId(p, "openclaw")).toBe("");
    });
  });
});

describe("getProviderModelSubtitle", () => {
  it("hermes 有 models 时拼接 modelId 和 apiFormat", () => {
    const p = provider({
      id: "p1",
      settingsConfig: { models: [{ id: "hermes-model" }] },
      meta: { apiFormat: "anthropic" },
    });
    expect(getProviderModelSubtitle(p, "hermes")).toBe("hermes-model · anthropic");
  });

  it("hermes 有 models 但无 apiFormat 时只返回 modelId", () => {
    const p = provider({
      id: "p1",
      settingsConfig: { models: [{ id: "hermes-model" }] },
    });
    expect(getProviderModelSubtitle(p, "hermes")).toBe("hermes-model");
  });

  it("hermes 无 models 有 apiFormat 时返回 apiFormat", () => {
    const p = provider({
      id: "p1",
      settingsConfig: {},
      meta: { apiFormat: "openai_chat" },
    });
    expect(getProviderModelSubtitle(p, "hermes")).toBe("openai_chat");
  });

  it("无 apiFormat 且无 models 时返回 provider.id", () => {
    const p = provider({ id: "my-id", settingsConfig: {} });
    expect(getProviderModelSubtitle(p, "claude")).toBe("my-id");
  });

  it("非 hermes 有 apiFormat 时返回 apiFormat", () => {
    const p = provider({
      id: "p1",
      settingsConfig: {},
      meta: { apiFormat: "gemini_native" },
    });
    expect(getProviderModelSubtitle(p, "codex")).toBe("gemini_native");
  });

  it("hermes models 数组为空时回退到 id 或 apiFormat", () => {
    const p = provider({
      id: "fallback-id",
      settingsConfig: { models: [] },
    });
    expect(getProviderModelSubtitle(p, "hermes")).toBe("fallback-id");
  });
});

describe("getProviderCategoryLabel", () => {
  const t = vi.fn((key: string, opts?: any) => opts?.defaultValue ?? key);

  it("undefined category 返回 '-'", () => {
    expect(getProviderCategoryLabel(undefined, t as any)).toBe("-");
  });

  it("official 映射到正确 key", () => {
    t.mockClear();
    getProviderCategoryLabel("official", t as any);
    expect(t).toHaveBeenCalledWith("models.category.official", {
      defaultValue: "官方",
    });
  });

  it("cn_official 映射到正确 key 和 fallback", () => {
    t.mockClear();
    getProviderCategoryLabel("cn_official", t as any);
    expect(t).toHaveBeenCalledWith("models.category.cnOfficial", {
      defaultValue: "国内官方",
    });
  });

  it("custom 映射到正确 key 和 fallback", () => {
    t.mockClear();
    getProviderCategoryLabel("custom", t as any);
    expect(t).toHaveBeenCalledWith("models.category.custom", {
      defaultValue: "自定义",
    });
  });

  it("omo-slim 映射到正确 key", () => {
    t.mockClear();
    getProviderCategoryLabel("omo-slim", t as any);
    expect(t).toHaveBeenCalledWith("models.category.omoSlim", {
      defaultValue: "OMO Slim",
    });
  });
});

describe("getPresetInitial", () => {
  it("返回首字母大写", () => {
    expect(getPresetInitial("Anthropic")).toBe("A");
    expect(getPresetInitial("openai")).toBe("O");
  });

  it("先 trim 再取首字符", () => {
    expect(getPresetInitial("  claude")).toBe("C");
  });

  it("空字符串或纯空白返回 '?'", () => {
    expect(getPresetInitial("")).toBe("?");
    expect(getPresetInitial("   ")).toBe("?");
  });
});

describe("isUniversalSyncedProviderId", () => {
  it("universal-claude- 前缀返回 true", () => {
    expect(isUniversalSyncedProviderId("universal-claude-xxx")).toBe(true);
  });

  it("universal-codex- 前缀返回 true", () => {
    expect(isUniversalSyncedProviderId("universal-codex-yyy")).toBe(true);
  });

  it("universal-gemini- 前缀返回 true", () => {
    expect(isUniversalSyncedProviderId("universal-gemini-zzz")).toBe(true);
  });

  it("普通 id 返回 false", () => {
    expect(isUniversalSyncedProviderId("provider-1")).toBe(false);
    expect(isUniversalSyncedProviderId("claude-default")).toBe(false);
  });

  it("universal- 但非已知前缀返回 false", () => {
    expect(isUniversalSyncedProviderId("universal-other-1")).toBe(false);
  });
});
