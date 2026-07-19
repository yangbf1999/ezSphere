import React from "react";
import * as api from "../../api/tauri";

export const mdComponents = {
  code: ({ className, children, ...props }: any) => {
    const isInline = !className;
    return isInline ? (
      <code
        className="rounded-[var(--control-radius-inner)] bg-[var(--shell-bg-input)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--shell-text-primary)]"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className={`block overflow-x-auto whitespace-pre rounded-[var(--control-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-input)] p-3 pr-10 font-mono text-[0.85em] text-[var(--shell-text-primary)] ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => {
    const codeText = String(children?.props?.children || "").replace(/\n$/, "");
    const isBlock = children?.props?.className;
    if (!isBlock) return <>{children}</>;
    return (
      <div className="group relative my-2">
        {children}
        <button
          type="button"
          aria-label="Copy code"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            navigator.clipboard.writeText(codeText);
            const button = event.currentTarget;
            const svg = button.querySelector("svg");
            if (svg) svg.style.display = "none";
            button.insertAdjacentHTML(
              "beforeend",
              '<span class="copy-ok">OK</span>',
            );
            setTimeout(() => {
              const ok = button.querySelector(".copy-ok");
              if (ok) ok.remove();
              if (svg) svg.style.display = "";
            }, 1500);
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-[var(--control-radius-inner)] text-[var(--shell-text-muted)] transition-colors hover:bg-[var(--shell-bg-elevated)] hover:text-[var(--shell-text-primary)]"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    );
  },
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-[var(--shell-accent)] hover:underline"
      onClick={(event: React.MouseEvent) => {
        event.preventDefault();
        api.openExternal(href);
      }}
    >
      {children}
    </a>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-[var(--shell-text-primary)]">
      {children}
    </strong>
  ),
  em: ({ children }: any) => (
    <em className="text-[var(--shell-text-secondary)]">{children}</em>
  ),
  ul: ({ children }: any) => (
    <ul className="my-1 list-inside list-disc space-y-0.5">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-1 list-inside list-decimal space-y-0.5">{children}</ol>
  ),
  h1: ({ children }: any) => (
    <h1 className="mb-1 mt-3 text-lg font-bold text-[var(--shell-text-primary)]">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="mb-1 mt-2 text-base font-bold text-[var(--shell-text-primary)]">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mb-1 mt-2 text-sm font-bold text-[var(--shell-text-primary)]">
      {children}
    </h3>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-1 border-l-2 border-[var(--shell-border)] pl-3 italic text-[var(--shell-text-muted)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2 border-[var(--shell-border)]" />,
  table: ({ children }: any) => (
    <table className="my-2 w-full border-collapse text-sm">{children}</table>
  ),
  th: ({ children }: any) => (
    <th className="border border-[var(--shell-border)] bg-[var(--shell-bg-input)] px-2 py-1 text-left font-bold">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-[var(--shell-border)] px-2 py-1">
      {children}
    </td>
  ),
};
