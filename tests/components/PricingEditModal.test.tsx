import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PricingEditModal } from "@/components/usage/PricingEditModal";
import type { ModelPricing } from "@/types/usage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: string | { defaultValue?: string }) =>
      typeof options === "string" ? options : options?.defaultValue ?? key,
  }),
}));

const { updatePricingMock, toastSuccessMock, toastErrorMock } = vi.hoisted(
  () => ({
    updatePricingMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock("@/lib/query/usage", () => ({
  useUpdateModelPricing: () => ({
    mutateAsync: updatePricingMock,
    isPending: false,
  }),
}));

vi.mock("@/components/usage/ModelsDevPickerDialog", () => ({
  ModelsDevPickerDialog: ({
    onClose,
    onImported,
  }: {
    onClose: () => void;
    onImported: () => void;
  }) => (
    <div data-testid="models-dev-picker">
      <button onClick={onClose}>picker-close</button>
      <button onClick={onImported}>picker-import</button>
    </div>
  ),
}));

vi.mock("@/components/common/FullScreenPanel", () => ({
  FullScreenPanel: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div>
      {children}
      {footer}
    </div>
  ),
}));

const model: ModelPricing = {
  modelId: "deepseek-v4",
  displayName: "DeepSeek V4",
  inputCostPerMillion: "1",
  outputCostPerMillion: "3",
  cacheReadCostPerMillion: "0.0028",
  cacheCreationCostPerMillion: "0",
};

const PRICE_FIELDS = [
  { id: "inputCost", label: "输入成本" },
  { id: "outputCost", label: "输出成本" },
  { id: "cacheReadCost", label: "缓存读取成本" },
  { id: "cacheCreationCost", label: "缓存写入成本" },
] as const;

describe("PricingEditModal", () => {
  beforeEach(() => {
    updatePricingMock.mockReset();
    updatePricingMock.mockResolvedValue(undefined);
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("all price inputs have step=0.0001", () => {
    render(<PricingEditModal open model={model} onClose={() => {}} />);

    for (const { id } of PRICE_FIELDS) {
      const input = screen.getByLabelText(/每百万 tokens/ as unknown as string, {
        selector: `#${id}`,
      }) as HTMLInputElement;
      expect(input).toHaveAttribute("step", "0.0001");
    }
  });

  it("accepts precise cache read cost like 0.0028", () => {
    render(<PricingEditModal open model={model} onClose={() => {}} />);

    const cacheReadInput = document.getElementById(
      "cacheReadCost",
    ) as HTMLInputElement;
    expect(cacheReadInput.value).toBe("0.0028");
    expect(cacheReadInput.checkValidity()).toBe(true);
  });

  it("allows user to input sub-cent prices via change event", () => {
    render(
      <PricingEditModal open model={model} onClose={() => {}} isNew />,
    );

    const cacheReadInput = document.getElementById(
      "cacheReadCost",
    ) as HTMLInputElement;

    fireEvent.change(cacheReadInput, { target: { value: "0.0015" } });
    expect(cacheReadInput.value).toBe("0.0015");
  });

  it("validates a new model id and rejects an invalid price", () => {
    render(
      <PricingEditModal
        open
        model={{ ...model, modelId: "" }}
        onClose={() => {}}
        isNew
      />,
    );

    fireEvent.submit(document.getElementById("pricing-form")!);
    expect(toastErrorMock).toHaveBeenCalled();
    expect(updatePricingMock).not.toHaveBeenCalled();

    fireEvent.change(document.getElementById("modelId")!, {
      target: { value: "new-model" },
    });
    fireEvent.change(document.getElementById("inputCost")!, {
      target: { value: "-1" },
    });
    fireEvent.submit(document.getElementById("pricing-form")!);
    expect(toastErrorMock).toHaveBeenCalledTimes(2);
    expect(updatePricingMock).not.toHaveBeenCalled();
  });

  it("submits edited pricing and reports update failures", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <PricingEditModal open model={model} onClose={onClose} />,
    );
    fireEvent.change(document.getElementById("displayName")!, {
      target: { value: "Renamed model" },
    });
    fireEvent.change(document.getElementById("outputCost")!, {
      target: { value: "4.25" },
    });
    fireEvent.submit(document.getElementById("pricing-form")!);

    await waitFor(() =>
      expect(updatePricingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: model.modelId,
          displayName: "Renamed model",
          outputCost: "4.25",
        }),
      ),
    );
    expect(toastSuccessMock).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    updatePricingMock.mockRejectedValueOnce(new Error("update failed"));
    rerender(<PricingEditModal open model={model} onClose={onClose} />);
    fireEvent.submit(document.getElementById("pricing-form")!);
    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Error: update failed"),
    );
  });

  it("opens and closes the models.dev picker through both callbacks", () => {
    const onClose = vi.fn();
    render(<PricingEditModal open model={model} onClose={onClose} isNew />);

    fireEvent.click(screen.getByRole("button", { name: /models\.dev/ }));
    expect(screen.getByTestId("models-dev-picker")).toBeInTheDocument();
    fireEvent.click(screen.getByText("picker-close"));
    expect(screen.queryByTestId("models-dev-picker")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /models\.dev/ }));
    fireEvent.click(screen.getByText("picker-import"));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByTestId("models-dev-picker")).not.toBeInTheDocument();
  });
});
