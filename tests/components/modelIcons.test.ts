import { describe, it, expect } from "vitest";
import { getModelIcon } from "@/components/modelIcons";

describe("getModelIcon", () => {
  it("returns the claude icon for claude/anthropic model names", () => {
    expect(getModelIcon("Claude Sonnet", "claude-3-5-sonnet")).toBe(
      "./icons/models/claude.svg",
    );
    expect(getModelIcon("Anthropic Opus")).toBe("./icons/models/claude.svg");
    expect(getModelIcon("Haiku Mini")).toBe("./icons/models/claude.svg");
  });

  it("returns the chatgpt icon for gpt/openai names including o1/o3", () => {
    expect(getModelIcon("GPT-4o")).toBe("./icons/models/chatgpt.svg");
    expect(getModelIcon("OpenAI", "o1-preview")).toBe(
      "./icons/models/chatgpt.svg",
    );
    expect(getModelIcon("ChatGPT", "o3-mini")).toBe(
      "./icons/models/chatgpt.svg",
    );
  });

  it("returns the qwen icon for qwen/tongyi keywords", () => {
    expect(getModelIcon("Qwen Max")).toBe("./icons/models/qwen.svg");
    expect(getModelIcon("Tongyi Plus")).toBe("./icons/models/qwen.svg");
  });

  it("returns gemini icon for gemini and distinguishes gemma as google", () => {
    expect(getModelIcon("Gemini Pro")).toBe("./icons/models/gemini.svg");
    expect(getModelIcon("Gemma 2")).toBe("./icons/models/google.svg");
  });

  it("returns deepseek icon for deepseek", () => {
    expect(getModelIcon("DeepSeek V3")).toBe("./icons/models/deepseek.svg");
  });

  it("returns grok icon for grok / x.ai", () => {
    expect(getModelIcon("Grok 2")).toBe("./icons/models/grok.svg");
    expect(getModelIcon("xAI", "grok-beta")).toBe("./icons/models/grok.svg");
  });

  it("returns .png path for worldrouter and .ico path for b.ai", () => {
    expect(getModelIcon("WorldRouter Pro")).toBe(
      "./icons/models/worldrouter.png",
    );
    expect(getModelIcon("B.AI Turbo")).toBe("./icons/models/b-ai.ico");
  });

  it("matches doubao via multiple keywords (bytedance/volcengine/volces)", () => {
    expect(getModelIcon("Doubao Pro")).toBe("./icons/models/bytedance.svg");
    expect(getModelIcon("Volcengine Engine")).toBe(
      "./icons/models/bytedance.svg",
    );
  });

  it("returns null for unknown model names", () => {
    expect(getModelIcon("Some Random Model")).toBeNull();
    expect(getModelIcon("", "")).toBeNull();
  });

  it("is case-insensitive and checks both name and modelId", () => {
    expect(getModelIcon("model", "CLAUDE-3")).toBe(
      "./icons/models/claude.svg",
    );
    expect(getModelIcon("GROQ LLAMA")).toBe("./icons/models/groq.svg");
  });

  it("respects iconMap ordering when multiple keywords match (mixtral before groq)", () => {
    // "mixtral" is in the mistral entry which appears earlier in the map than groq
    expect(getModelIcon("Groq Mixtral")).toBe("./icons/models/mistral.svg");
  });
});
