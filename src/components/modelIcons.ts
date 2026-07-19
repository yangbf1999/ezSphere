export const getModelIcon = (name: string, modelId?: string): string | null => {
  const text = `${name} ${modelId || ""}`.toLowerCase();

  const iconMap: [string[], string][] = [
    [["qwen", "tongyi"], "qwen"],
    [["claude", "anthropic", "sonnet", "opus", "haiku"], "claude"],
    [["gpt", "openai", "chatgpt", "o1", "o3"], "chatgpt"],
    [["gemma"], "google"],
    [["gemini", "palm"], "gemini"],
    [["deepseek"], "deepseek"],
    [["mistral", "mixtral"], "mistral"],
    [["minimax"], "minimax"],
    [["grok", "x.ai"], "grok"],
    [["groq"], "groq"],
    [["kimi", "moonshot"], "kimi"],
    [["glm", "zhipu"], "glm"],
    [["ernie", "wenxin"], "ernie"],
    [["hunyuan"], "hunyuan"],
    [["cohere", "command"], "cohere"],
    [["perplexity", "pplx"], "perplexity"],
    [["together"], "together"],
    [["doubao", "bytedance", "volcengine", "volces"], "bytedance"],
    [["xiaomi", "mimo"], "xiaomi"],
    [["nemotron", "nvidia"], "nemotron"],
    [["stepfun", "step"], "stepfun"],
    [["granite", "ibm"], "granite"],
    [["meta"], "meta"],
    [["openrouter"], "openrouter"],
    [["worldrouter"], "worldrouter"],
    [["b.ai", "bai"], "b-ai"],
  ];

  for (const [keywords, icon] of iconMap) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      if (icon === "worldrouter") return "./icons/models/worldrouter.png";
      if (icon === "b-ai") return "./icons/models/b-ai.ico";
      return `./icons/models/${icon}.svg`;
    }
  }

  return null;
};
