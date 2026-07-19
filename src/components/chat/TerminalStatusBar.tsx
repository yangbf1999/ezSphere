interface TerminalStatusBarProps {
  toolName?: string;
  textContent?: string;
  isVisible: boolean;
  isProcessing: boolean;
}

export function TerminalStatusBar({
  toolName,
  textContent,
  isVisible,
  isProcessing,
}: TerminalStatusBarProps) {
  if (!isVisible || !isProcessing) return null;

  const label = toolName ? `[${toolName}]` : textContent || "";
  const hasContent = label.length > 0;
  const duration = `${Math.min(8, Math.max(2, label.length * 0.06 + 1.5)).toFixed(1)}s`;
  const textColor = toolName
    ? "var(--shell-info)"
    : "var(--shell-text-muted)";

  return (
    <div className="flex h-7 select-none items-center overflow-hidden border-t border-[var(--shell-border)] bg-[var(--shell-bg-terminal)]">
      {hasContent ? (
        <div className="flex h-full flex-1 items-center overflow-hidden">
          <span
            key={label}
            className="marquee-text font-mono text-xs"
            style={
              {
                "--marquee-duration": duration,
                color: textColor,
              } as React.CSSProperties
            }
          >
            {label}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {label}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      ) : (
        <span className="inline-flex items-center gap-0.5 px-3">
          <span className="mr-1 font-mono text-xs text-[var(--shell-text-muted)]">
            思考中
          </span>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="inline-block h-1 w-1 rounded-full bg-[var(--shell-text-muted)]"
              style={{
                animation: "dotPulse 1.2s ease-in-out infinite",
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
