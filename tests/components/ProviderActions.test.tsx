import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProviderActions } from "@/components/providers/ProviderActions";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => {
      if (typeof opts === "string") return opts;
      if (opts && typeof opts === "object" && "defaultValue" in opts)
        return opts.defaultValue;
      return k;
    },
  }),
}));

function getMainButton() {
  // The main action button has class "main-act"
  return document.querySelector("button.main-act")!;
}

function getIconButton(ariaLabel: string) {
  return screen.getByRole("button", { name: ariaLabel });
}

describe("ProviderActions - main button states (shell layout)", () => {
  it("shows enable and calls onSwitch when provider is not current", () => {
    const onSwitch = vi.fn();
    render(
      <ProviderActions
        appId="claude"
        isCurrent={false}
        onSwitch={onSwitch}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("provider.enable");
    expect(main).not.toBeDisabled();

    fireEvent.click(main);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it("shows inUse and is disabled when provider is current", () => {
    const onSwitch = vi.fn();
    render(
      <ProviderActions
        appId="claude"
        isCurrent
        onSwitch={onSwitch}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("provider.inUse");
    expect(main).toBeDisabled();

    fireEvent.click(main);
    expect(onSwitch).not.toHaveBeenCalled();
  });
});

describe("ProviderActions - omo mode", () => {
  it("current omo provider calls onDisableOmo on main button click", () => {
    const onDisableOmo = vi.fn();
    const onSwitch = vi.fn();
    render(
      <ProviderActions
        appId="claude"
        isCurrent
        isOmo
        onSwitch={onSwitch}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
        onDisableOmo={onDisableOmo}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("provider.inUse");
    fireEvent.click(main);
    expect(onDisableOmo).toHaveBeenCalledTimes(1);
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it("non-current omo provider calls onSwitch on main button click", () => {
    const onSwitch = vi.fn();
    render(
      <ProviderActions
        appId="claude"
        isCurrent={false}
        isOmo
        onSwitch={onSwitch}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
      />,
    );

    fireEvent.click(getMainButton());
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});

describe("ProviderActions - additive mode (openclaw)", () => {
  it("not in config shows add and calls onSwitch", () => {
    const onSwitch = vi.fn();
    render(
      <ProviderActions
        appId="openclaw"
        isCurrent={false}
        isInConfig={false}
        onSwitch={onSwitch}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("添加");
    fireEvent.click(main);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it("in config shows remove and calls onRemoveFromConfig", () => {
    const onRemoveFromConfig = vi.fn();
    render(
      <ProviderActions
        appId="openclaw"
        isCurrent={false}
        isInConfig
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={onRemoveFromConfig}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("移除");
    fireEvent.click(main);
    expect(onRemoveFromConfig).toHaveBeenCalledTimes(1);
  });

  it("in config falls back to onDelete when onRemoveFromConfig is absent", () => {
    const onDelete = vi.fn();
    render(
      <ProviderActions
        appId="openclaw"
        isCurrent={false}
        isInConfig
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(getMainButton());
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe("ProviderActions - failover mode", () => {
  it("not in queue shows add and calls onToggleFailover(true)", () => {
    const onToggleFailover = vi.fn();
    render(
      <ProviderActions
        appId="claude"
        isCurrent={false}
        isAutoFailoverEnabled
        isInFailoverQueue={false}
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
        onToggleFailover={onToggleFailover}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("加入");
    fireEvent.click(main);
    expect(onToggleFailover).toHaveBeenCalledWith(true);
  });

  it("in queue shows joined and calls onToggleFailover(false)", () => {
    const onToggleFailover = vi.fn();
    render(
      <ProviderActions
        appId="claude"
        isCurrent={false}
        isAutoFailoverEnabled
        isInFailoverQueue
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
        onToggleFailover={onToggleFailover}
      />,
    );

    const main = getMainButton();
    expect(main).toHaveTextContent("已加入");
    fireEvent.click(main);
    expect(onToggleFailover).toHaveBeenCalledWith(false);
  });
});

describe("ProviderActions - icon action buttons", () => {
  const baseProps = {
    appId: "claude" as const,
    isCurrent: false,
    onSwitch: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onRemoveFromConfig: vi.fn(),
  };

  it("fires onEdit, onDuplicate, onDelete via icon buttons", () => {
    const onEdit = vi.fn();
    const onDuplicate = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProviderActions
        {...baseProps}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(getIconButton("common.edit"));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(getIconButton("provider.duplicate"));
    expect(onDuplicate).toHaveBeenCalledTimes(1);

    fireEvent.click(getIconButton("common.delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("fires onTest and onConfigureUsage when provided", () => {
    const onTest = vi.fn();
    const onConfigureUsage = vi.fn();
    render(
      <ProviderActions
        {...baseProps}
        onTest={onTest}
        onConfigureUsage={onConfigureUsage}
      />,
    );

    fireEvent.click(getIconButton("检测连通"));
    expect(onTest).toHaveBeenCalledTimes(1);

    fireEvent.click(getIconButton("provider.configureUsage"));
    expect(onConfigureUsage).toHaveBeenCalledTimes(1);
  });

  it("renders openTerminal button only when onOpenTerminal is provided", () => {
    const onOpenTerminal = vi.fn();
    const { rerender } = render(
      <ProviderActions {...baseProps} onOpenTerminal={onOpenTerminal} />,
    );
    expect(getIconButton("打开终端")).toBeInTheDocument();

    rerender(<ProviderActions {...baseProps} />);
    expect(screen.queryByRole("button", { name: "打开终端" })).not.toBeInTheDocument();
  });

  it("disables delete button when provider is current (canDelete false)", () => {
    render(
      <ProviderActions
        {...baseProps}
        isCurrent
      />,
    );

    const deleteBtn = getIconButton("common.delete");
    expect(deleteBtn).toBeDisabled();
  });

  it("disables edit and delete when isReadOnly", () => {
    render(
      <ProviderActions
        {...baseProps}
        isReadOnly
      />,
    );

    // When readOnly, edit and delete buttons use the managedByHermes hint and are disabled
    const hint = "由 Hermes 管理，请在 Hermes Web UI 中编辑";
    const readOnlyBtns = screen.getAllByRole("button", { name: hint });
    expect(readOnlyBtns.length).toBeGreaterThanOrEqual(1);
    for (const btn of readOnlyBtns) {
      expect(btn).toBeDisabled();
    }
  });
});

describe("ProviderActions - default model button (openclaw/hermes)", () => {
  it("openclaw in config shows set-as-default button when not default", () => {
    const onSetAsDefault = vi.fn();
    render(
      <ProviderActions
        appId="openclaw"
        isCurrent={false}
        isInConfig
        isDefaultModel={false}
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
        onSetAsDefault={onSetAsDefault}
      />,
    );

    const btn = screen.getByText("设为默认").closest("button")!;
    fireEvent.click(btn);
    expect(onSetAsDefault).toHaveBeenCalledTimes(1);
  });

  it("openclaw shows current-default (disabled) when already default", () => {
    const onSetAsDefault = vi.fn();
    render(
      <ProviderActions
        appId="openclaw"
        isCurrent={false}
        isInConfig
        isDefaultModel
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onRemoveFromConfig={vi.fn()}
        onSetAsDefault={onSetAsDefault}
      />,
    );

    const btn = screen.getByText("当前默认").closest("button")!;
    expect(btn).toBeDisabled();
  });
});
