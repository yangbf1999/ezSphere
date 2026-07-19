import { describe, expect, it } from "vitest";
import { jsonConfigSchema, tomlConfigSchema } from "@/lib/schemas/common";
import { mcpServerSchema } from "@/lib/schemas/mcp";
import { providerSchema } from "@/lib/schemas/provider";
import { settingsSchema } from "@/lib/schemas/settings";

/**
 * Helper: assert a schema safeParse succeeds.
 */
function expectValid(schema: any, value: any) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(true);
}

/**
 * Helper: assert a schema safeParse fails.
 */
function expectInvalid(schema: any, value: any) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
}

// ---------------------------------------------------------------------------
// common.ts — jsonConfigSchema
// ---------------------------------------------------------------------------

describe("jsonConfigSchema", () => {
  it("accepts a valid JSON object string", () => {
    expectValid(jsonConfigSchema, '{"key":"value"}');
    expectValid(jsonConfigSchema, '{"a":1,"b":[1,2]}');
  });

  it("rejects an empty string", () => {
    expectInvalid(jsonConfigSchema, "");
  });

  it("rejects a whitespace-only string (min(1) on the raw string)", () => {
    expectInvalid(jsonConfigSchema, "   ");
  });

  it("rejects a JSON array", () => {
    expectInvalid(jsonConfigSchema, "[1,2,3]");
  });

  it("rejects JSON primitives (number / string / boolean / null)", () => {
    expectInvalid(jsonConfigSchema, "123");
    expectInvalid(jsonConfigSchema, '"hello"');
    expectInvalid(jsonConfigSchema, "true");
    expectInvalid(jsonConfigSchema, "null");
  });

  it("rejects invalid JSON syntax", () => {
    expectInvalid(jsonConfigSchema, "{bad}");
    expectInvalid(jsonConfigSchema, '{"a":}');
  });
});

// ---------------------------------------------------------------------------
// common.ts — tomlConfigSchema
// ---------------------------------------------------------------------------

describe("tomlConfigSchema", () => {
  it("accepts an empty string (required-ness decided upstream)", () => {
    expectValid(tomlConfigSchema, "");
  });

  it("accepts a whitespace-only string", () => {
    expectValid(tomlConfigSchema, "   \n  ");
  });

  it("accepts a valid stdio server config", () => {
    expectValid(tomlConfigSchema, 'command = "npx"\nargs = ["-y", "server"]');
  });

  it("accepts a valid http server config", () => {
    expectValid(
      tomlConfigSchema,
      'type = "http"\nurl = "https://example.com/mcp"',
    );
  });

  it("accepts a valid sse server config", () => {
    expectValid(
      tomlConfigSchema,
      'type = "sse"\nurl = "https://example.com/sse"',
    );
  });

  it("accepts the [mcp_servers.<id>] table format", () => {
    expectValid(
      tomlConfigSchema,
      '[mcp_servers.my-server]\ncommand = "npx"',
    );
  });

  it("rejects a stdio config without command", () => {
    expectInvalid(tomlConfigSchema, 'type = "stdio"');
  });

  it("rejects an http config without url", () => {
    expectInvalid(tomlConfigSchema, 'type = "http"');
  });

  it("rejects an sse config without url", () => {
    expectInvalid(tomlConfigSchema, 'type = "sse"');
  });

  it("rejects invalid TOML syntax", () => {
    expectInvalid(tomlConfigSchema, 'this is = = not valid');
  });

  it("rejects an unrecognized TOML structure (no server fields)", () => {
    expectInvalid(tomlConfigSchema, 'random_key = "value"');
  });
});

// ---------------------------------------------------------------------------
// mcp.ts — mcpServerSchema
// ---------------------------------------------------------------------------

describe("mcpServerSchema", () => {
  it("accepts a minimal stdio server (type defaults to stdio)", () => {
    expectValid(mcpServerSchema, {
      id: "srv-1",
      server: { command: "npx" },
    });
  });

  it("accepts an http server with url", () => {
    expectValid(mcpServerSchema, {
      id: "srv-1",
      server: { type: "http", url: "https://example.com" },
    });
  });

  it("accepts an sse server with url", () => {
    expectValid(mcpServerSchema, {
      id: "srv-1",
      server: { type: "sse", url: "https://example.com/sse" },
    });
  });

  it("accepts a fully-populated server with optional fields", () => {
    expectValid(mcpServerSchema, {
      id: "srv-1",
      name: "My Server",
      description: "desc",
      tags: ["a", "b"],
      homepage: "https://home.example.com",
      docs: "https://docs.example.com",
      enabled: true,
      server: {
        command: "npx",
        args: ["-y", "pkg"],
        env: { KEY: "VAL" },
        cwd: "/tmp",
      },
    });
  });

  it("rejects when id is missing", () => {
    expectInvalid(mcpServerSchema, { server: { command: "npx" } });
  });

  it("rejects when id is an empty string", () => {
    expectInvalid(mcpServerSchema, { id: "", server: { command: "npx" } });
  });

  it("rejects when server is missing", () => {
    expectInvalid(mcpServerSchema, { id: "srv-1" });
  });

  it("rejects a stdio server without command", () => {
    expectInvalid(mcpServerSchema, {
      id: "srv-1",
      server: { type: "stdio" },
    });
  });

  it("rejects an http server without url", () => {
    expectInvalid(mcpServerSchema, {
      id: "srv-1",
      server: { type: "http" },
    });
  });

  it("rejects an invalid server type (not in enum)", () => {
    expectInvalid(mcpServerSchema, {
      id: "srv-1",
      server: { type: "ftp", command: "x" },
    });
  });

  it("rejects an invalid homepage URL", () => {
    expectInvalid(mcpServerSchema, {
      id: "srv-1",
      homepage: "not-a-url",
      server: { command: "npx" },
    });
  });

  it("rejects an invalid url inside the server spec", () => {
    expectInvalid(mcpServerSchema, {
      id: "srv-1",
      server: { type: "http", url: "not-a-url" },
    });
  });
});

// ---------------------------------------------------------------------------
// provider.ts — providerSchema
// ---------------------------------------------------------------------------

describe("providerSchema", () => {
  it("accepts a minimal valid provider", () => {
    expectValid(providerSchema, {
      name: "My Provider",
      settingsConfig: '{"key":"value"}',
    });
  });

  it("accepts an empty name (required-as-string but empty allowed)", () => {
    expectValid(providerSchema, { name: "", settingsConfig: "{}" });
  });

  it("accepts a valid website URL", () => {
    expectValid(providerSchema, {
      name: "P",
      settingsConfig: "{}",
      websiteUrl: "https://example.com",
    });
  });

  it("accepts an empty website URL (literal '')", () => {
    expectValid(providerSchema, {
      name: "P",
      settingsConfig: "{}",
      websiteUrl: "",
    });
  });

  it("rejects an invalid website URL", () => {
    expectInvalid(providerSchema, {
      name: "P",
      settingsConfig: "{}",
      websiteUrl: "not-a-url",
    });
  });

  it("accepts icon / iconColor optional fields", () => {
    expectValid(providerSchema, {
      name: "P",
      settingsConfig: "{}",
      icon: "claude",
      iconColor: "#D4915D",
    });
  });

  it("rejects when name is missing", () => {
    expectInvalid(providerSchema, { settingsConfig: "{}" });
  });

  it("rejects when settingsConfig is missing", () => {
    expectInvalid(providerSchema, { name: "P" });
  });

  it("rejects an empty settingsConfig", () => {
    expectInvalid(providerSchema, { name: "P", settingsConfig: "" });
  });

  it("rejects invalid JSON in settingsConfig", () => {
    expectInvalid(providerSchema, { name: "P", settingsConfig: "{bad}" });
  });

  it("rejects when name is the wrong type", () => {
    expectInvalid(providerSchema, { name: 123, settingsConfig: "{}" });
  });
});

// ---------------------------------------------------------------------------
// settings.ts — settingsSchema
// ---------------------------------------------------------------------------

describe("settingsSchema", () => {
  const minimalValid = {
    showInTray: true,
    minimizeToTrayOnClose: false,
  };

  it("accepts a minimal valid settings object", () => {
    expectValid(settingsSchema, minimalValid);
  });

  it("rejects when showInTray is missing", () => {
    expectInvalid(settingsSchema, { minimizeToTrayOnClose: false });
  });

  it("rejects when minimizeToTrayOnClose is missing", () => {
    expectInvalid(settingsSchema, { showInTray: true });
  });

  it("rejects when a required boolean is the wrong type", () => {
    expectInvalid(settingsSchema, {
      showInTray: "yes",
      minimizeToTrayOnClose: false,
    });
  });

  it("accepts all valid language values", () => {
    for (const lang of ["en", "zh", "zh-TW", "ja"]) {
      expectValid(settingsSchema, { ...minimalValid, language: lang });
    }
  });

  it("rejects an invalid language value", () => {
    expectInvalid(settingsSchema, { ...minimalValid, language: "fr" });
  });

  it("accepts a non-empty directory override", () => {
    expectValid(settingsSchema, {
      ...minimalValid,
      claudeConfigDir: "/home/user/.claude",
    });
  });

  it("accepts an empty-string directory override", () => {
    expectValid(settingsSchema, { ...minimalValid, claudeConfigDir: "" });
  });

  it("accepts a null directory override", () => {
    expectValid(settingsSchema, { ...minimalValid, claudeConfigDir: null });
  });

  it("accepts valid skillSyncMethod values", () => {
    for (const method of ["auto", "symlink", "copy"]) {
      expectValid(settingsSchema, { ...minimalValid, skillSyncMethod: method });
    }
  });

  it("rejects an invalid skillSyncMethod value", () => {
    expectInvalid(settingsSchema, {
      ...minimalValid,
      skillSyncMethod: "manual",
    });
  });

  it("accepts a valid webdavSync block", () => {
    expectValid(settingsSchema, {
      ...minimalValid,
      webdavSync: {
        enabled: true,
        autoSync: false,
        baseUrl: "https://dav.example.com",
        username: "user",
        password: "secret",
        remoteRoot: "/remote",
      },
    });
  });

  it("rejects webdavSync.enabled when it is not a boolean", () => {
    expectInvalid(settingsSchema, {
      ...minimalValid,
      webdavSync: { enabled: "yes" },
    });
  });

  it("accepts a valid localMigrations block", () => {
    expectValid(settingsSchema, {
      ...minimalValid,
      localMigrations: {
        codexThirdPartyHistoryProviderBucketV1: {
          completedAt: "2026-01-01T00:00:00Z",
          targetProviderId: "provider-1",
        },
      },
    });
  });

  it("rejects localMigrations with a missing required field (completedAt)", () => {
    expectInvalid(settingsSchema, {
      ...minimalValid,
      localMigrations: {
        codexThirdPartyHistoryProviderBucketV1: {
          targetProviderId: "provider-1",
        },
      },
    });
  });

  it("accepts optional boolean flags", () => {
    expectValid(settingsSchema, {
      ...minimalValid,
      enableClaudePluginIntegration: true,
      skipClaudeOnboarding: true,
      launchOnStartup: false,
      enableLocalProxy: true,
      preserveCodexOfficialAuthOnSwitch: false,
      unifyCodexSessionHistory: true,
    });
  });

  it("accepts currentProvider string fields", () => {
    expectValid(settingsSchema, {
      ...minimalValid,
      currentProviderClaude: "claude-1",
      currentProviderCodex: "codex-1",
      currentProviderGemini: "gemini-1",
      currentProviderClaudeDesktop: "desktop-1",
    });
  });
});
