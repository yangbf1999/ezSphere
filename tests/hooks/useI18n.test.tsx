import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useI18n } from "@/hooks/useI18n";
import { createTestQueryClient } from "../utils/testQueryClient";

// vi.mock is hoisted before variable declarations, so use vi.hoisted
// to create mutable references the mock factory can close over.
const { mockTranslate, mockLanguage, stableT } = vi.hoisted(() => ({
  mockTranslate: vi.fn((key: string) => key),
  mockLanguage: { value: "zh" },
  // Stable function reference so useCallback([translate]) keeps t stable
  stableT: (key: string) => mockTranslate(key),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: stableT,
    i18n: { language: mockLanguage.value },
  }),
}));

interface WrapperProps {
  children: ReactNode;
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return { wrapper };
}

describe("useI18n", () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    // Default: i18next returns the key unchanged (no translations registered)
    mockTranslate.mockImplementation((key: string) => key);
    mockLanguage.value = "zh";
  });

  it("returns translated value when i18next provides a translation", () => {
    mockTranslate.mockImplementation((key: string) =>
      key === "mother.selectModel" ? "Translated Model" : key,
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.t("mother.selectModel")).toBe("Translated Model");
  });

  it("falls back to motherFallbacks when i18next returns the key unchanged", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.t("mother.selectModel")).toBe("选择模型");
    expect(result.current.t("mother.addServer")).toBe("添加服务器");
    expect(result.current.t("btn.delete")).toBe("删除");
  });

  it("returns the key itself when neither i18next nor motherFallbacks has it", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("returns the locale from i18n.language", () => {
    mockLanguage.value = "en";
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.locale).toBe("en");
  });

  it("defaults locale to zh when i18n.language is empty", () => {
    mockLanguage.value = "";
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.locale).toBe("zh");
  });

  it("t callback is stable across rerenders when translate does not change", () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(() => useI18n(), { wrapper });

    const first = result.current.t;
    rerender();
    const second = result.current.t;

    // useCallback with [translate] dependency; translate is stable
    expect(second).toBe(first);
  });
});
