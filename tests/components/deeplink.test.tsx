import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { McpConfirmation } from "@/components/deeplink/McpConfirmation";
import { PromptConfirmation } from "@/components/deeplink/PromptConfirmation";
import { SkillConfirmation } from "@/components/deeplink/SkillConfirmation";
import type { DeepLinkImportRequest } from "@/lib/api/deeplink";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, opts?: any) => k }),
}));

/** Encode a UTF-8 string to base64 (mirrors decodeBase64Utf8 inverse). */
function b64(str: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

describe("McpConfirmation", () => {
  it("decodes the base64 config and lists servers with their command/url", () => {
    const config = b64(
      JSON.stringify({
        mcpServers: {
          fs: { command: "npx", args: ["-y", "fs"] },
          web: { url: "https://example.com/sse" },
        },
      }),
    );

    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "mcp",
      apps: "claude, codex",
      config,
    };

    render(<McpConfirmation request={request} />);

    // target apps rendered as chips
    expect(screen.getByText("claude")).toBeInTheDocument();
    expect(screen.getByText("codex")).toBeInTheDocument();

    // server ids
    expect(screen.getByText("fs")).toBeInTheDocument();
    expect(screen.getByText("web")).toBeInTheDocument();

    // command / url lines
    expect(screen.getByText(/Command: npx/)).toBeInTheDocument();
    expect(screen.getByText(/URL: https:\/\/example\.com\/sse/)).toBeInTheDocument();
  });

  it("renders nothing in the server list when config is absent", () => {
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "mcp",
      apps: "claude",
    };
    render(<McpConfirmation request={request} />);
    expect(screen.queryByText("Command:")).not.toBeInTheDocument();
    expect(screen.queryByText("URL:")).not.toBeInTheDocument();
  });

  it("shows the enabled warning when request.enabled is true", () => {
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "mcp",
      apps: "claude",
      enabled: true,
      config: b64(JSON.stringify({ mcpServers: {} })),
    };
    render(<McpConfirmation request={request} />);
    expect(screen.getByText("deeplink.mcp.enabledWarning")).toBeInTheDocument();
  });
});

describe("PromptConfirmation", () => {
  it("decodes content and shows app/name/description + preview", () => {
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "prompt",
      app: "claude",
      name: "My Prompt",
      description: "A helpful prompt",
      content: b64("# Hello\n\nThis is the body."),
    };

    render(<PromptConfirmation request={request} />);

    expect(screen.getByText("claude")).toBeInTheDocument();
    expect(screen.getByText("My Prompt")).toBeInTheDocument();
    expect(screen.getByText("A helpful prompt")).toBeInTheDocument();
    expect(screen.getByText(/# Hello/)).toBeInTheDocument();
    expect(screen.getByText(/This is the body\./)).toBeInTheDocument();
  });

  it("truncates the preview at 500 characters with an ellipsis", () => {
    const long = "A".repeat(600);
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "prompt",
      app: "codex",
      name: "Big",
      content: b64(long),
    };

    const { container } = render(<PromptConfirmation request={request} />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre!.textContent).toContain("...");
    // 500 chars + "..."
    expect(pre!.textContent!.replace("...", "").length).toBe(500);
  });

  it("omits the description block when description is missing", () => {
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "prompt",
      app: "claude",
      name: "NoDesc",
      content: b64("x"),
    };
    render(<PromptConfirmation request={request} />);
    expect(screen.getByText("NoDesc")).toBeInTheDocument();
    expect(screen.queryByText("deeplink.prompt.description")).not.toBeInTheDocument();
  });
});

describe("SkillConfirmation", () => {
  it("renders repo, directory and provided branch", () => {
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "skill",
      repo: "owner/repo",
      directory: "skills/my-skill",
      branch: "develop",
    };
    render(<SkillConfirmation request={request} />);
    expect(screen.getByText("owner/repo")).toBeInTheDocument();
    expect(screen.getByText("skills/my-skill")).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
  });

  it("defaults branch to 'main' when not provided", () => {
    const request: DeepLinkImportRequest = {
      version: "1",
      resource: "skill",
      repo: "owner/repo",
      directory: "skills/my-skill",
    };
    render(<SkillConfirmation request={request} />);
    expect(screen.getByText("main")).toBeInTheDocument();
  });
});
