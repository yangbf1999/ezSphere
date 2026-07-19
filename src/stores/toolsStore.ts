import type { DetectedTool } from "@/api/types";

interface ToolsState {
  detectedTools: DetectedTool[];
  setDetectedTools: (tools: DetectedTool[]) => void;
}

const toolsState: ToolsState = {
  detectedTools: [],
  setDetectedTools: () => undefined,
};

export function useToolsStore<T = ToolsState>(
  selector?: (state: ToolsState) => T,
): T {
  return selector ? selector(toolsState) : (toolsState as T);
}
