import { useEffect, useMemo, useState } from "react";
import { Paperclip, KeyRound, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import installRepairAgentIcon from "@/assets/icons/robet.png";
import { getModelIcon } from "../modelIcons";
import { useI18n } from "../../hooks/useI18n";
import { mdComponents } from "../../pages/MotherAgent/mdComponents";
import { IS_LINUX } from "../../utils/platform";

export type BubbleRole =
  | "user"
  | "assistant"
  | "system"
  | "error"
  | "working"
  | "skeleton";

export interface BubbleChip {
  type: "file" | "image" | "model";
  name: string;
  modelId?: string;
  preview?: string;
}

export interface ChatBubbleProps {
  role: BubbleRole;
  content: string;
  variant?: "mother" | "install";
  chips?: BubbleChip[];
  isStreaming?: boolean;
  subContent?: string;
}

const BASE_CHIP =
  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[var(--control-radius-inner)] border";
const CHIP_MODEL = `${BASE_CHIP} border-[var(--shell-border)] bg-[color-mix(in_oklab,var(--shell-accent),transparent_90%)]`;
const CHIP_FILE = `${BASE_CHIP} border-[var(--shell-border)] bg-[var(--shell-bg-input)]`;

function ReadonlyChips({ chips }: { chips: BubbleChip[] }) {
  if (!chips.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chips.map((chip, index) => {
        if (chip.type === "model") {
          const icon = getModelIcon(chip.name, chip.modelId || "");
          return (
            <span key={index} className={CHIP_MODEL}>
              {icon ? (
                <img src={icon} alt="" className="h-4 w-4" />
              ) : (
                <KeyRound size={12} className="text-[var(--shell-accent)]" aria-hidden="true" />
              )}
            </span>
          );
        }
        if (chip.type === "image") {
          return (
            <span key={index} className={CHIP_FILE}>
              {chip.preview ? (
                <img
                  src={chip.preview}
                  alt={chip.name}
                  className="h-4 w-4 rounded object-cover"
                />
              ) : (
                <ImageIcon
                  size={12}
                  className="text-[var(--shell-text-muted)]"
                  aria-hidden="true"
                />
              )}
            </span>
          );
        }
        return (
          <span key={index} className={CHIP_FILE}>
            <Paperclip size={12} className="text-[var(--shell-text-muted)]" aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}

const SPINNER_GLYPHS = ["·", "✦", "*", "✧", "✦", "·"];
const SPINNER_FRAMES = [...SPINNER_GLYPHS, ...[...SPINNER_GLYPHS].reverse()];
const SPINNER_VERBS_EN = [
  "Accomplishing",
  "Architecting",
  "Bootstrapping",
  "Calculating",
  "Composing",
  "Computing",
  "Considering",
  "Crafting",
  "Generating",
  "Optimizing",
  "Processing",
  "Reasoning",
  "Synthesizing",
  "Thinking",
  "Working",
];
const SPINNER_VERBS_ZH = [
  "思考",
  "推演",
  "分析",
  "梳理",
  "验证",
  "定位",
  "整理",
  "生成",
  "计算",
  "处理",
  "规划",
  "检查",
];

function formatSpinnerVerb(verb: string, isZh: boolean) {
  return isZh ? `正在${verb}中...` : `${verb}...`;
}

function InputDotsStatic() {
  const { locale } = useI18n();
  const isZh = locale.startsWith("zh");
  const verbs = isZh ? SPINNER_VERBS_ZH : SPINNER_VERBS_EN;

  const [staticGlyph] = useState(
    () => SPINNER_GLYPHS[Math.floor(Math.random() * SPINNER_GLYPHS.length)],
  );
  const staticVerb = useMemo(() => {
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    return formatSpinnerVerb(verb, isZh);
  }, [isZh, verbs]);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block w-3 text-center font-mono text-base leading-none text-[var(--shell-accent)]">
        {staticGlyph}
      </span>
      <span className="font-mono text-sm text-[var(--shell-accent)]">
        {staticVerb}
      </span>
    </span>
  );
}

function InputDots() {
  if (IS_LINUX) return <InputDotsStatic />;
  return <InputDotsAnimated />;
}

function InputDotsAnimated() {
  const { locale } = useI18n();
  const isZh = locale.startsWith("zh");
  const verbs = isZh ? SPINNER_VERBS_ZH : SPINNER_VERBS_EN;
  const pickRandom = () => {
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    return formatSpinnerVerb(verb, isZh);
  };

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setFrame((current) => (current + 1) % SPINNER_FRAMES.length),
      100,
    );
    return () => clearInterval(id);
  }, []);

  const [target, setTarget] = useState<string>(pickRandom);
  const [shown, setShown] = useState<string>(target);
  const [phase, setPhase] = useState<"show" | "erase" | "type">("show");

  useEffect(() => {
    const next = pickRandom();
    setTarget(next);
    setShown(next);
    setPhase("show");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZh]);

  useEffect(() => {
    if (phase === "show") {
      const id = setTimeout(() => setPhase("erase"), 2800);
      return () => clearTimeout(id);
    }
    if (phase === "erase") {
      if (shown.length === 0) {
        setTarget(pickRandom());
        setPhase("type");
        return;
      }
      const id = setTimeout(() => setShown((value) => value.slice(0, -1)), 45);
      return () => clearTimeout(id);
    }
    if (shown.length >= target.length) {
      setPhase("show");
      return;
    }
    const id = setTimeout(
      () => setShown(target.slice(0, shown.length + 1)),
      70,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shown, target]);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="spinner-glyph inline-block w-3 text-center font-mono text-base leading-none text-[var(--shell-accent)]">
        {SPINNER_FRAMES[frame]}
      </span>
      <span className="inline-flex items-baseline font-mono text-sm">
        <span className="spinner-shimmer">{shown}</span>
        {phase !== "show" && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[0.5em] self-center bg-[var(--shell-accent)]"
            style={{ animation: "caretBlink 1s steps(2) infinite" }}
          />
        )}
      </span>
    </span>
  );
}

const CONTENT_LIMIT = 12000;
const truncate = (text: string) =>
  text.length > CONTENT_LIMIT ? `${text.slice(0, CONTENT_LIMIT)}...` : text;

function InstallRepairAgentAvatar() {
  const { t } = useI18n();

  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--control-radius)] bg-white">
      <img
        src={installRepairAgentIcon}
        alt={t("installRepair.chat.agentName")}
        className="h-[22px] w-[22px] rounded-[8px] object-contain"
      />
    </div>
  );
}

function cleanAgentText(content: string): string {
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<\/?chat[^>]*>/gi, "")
    .trim();
}

export function ChatBubble({
  role,
  content,
  variant = "mother",
  chips = [],
  isStreaming = false,
  subContent,
}: ChatBubbleProps) {
  const isInstall = variant === "install";
  const { t } = useI18n();

  if (role === "skeleton") {
    return (
      <div className="mb-6 space-y-2">
        {[80, 60, 40].map((width, index) => (
          <div
            key={index}
            className="h-3 animate-pulse rounded-full bg-[var(--shell-bg-input)]"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    );
  }

  if (role === "system") {
    return (
      <div className="my-4 flex justify-center">
        <span className="font-mono text-xs text-[var(--shell-text-muted)]">
          {content}
        </span>
      </div>
    );
  }

  if (role === "error") {
    return (
      <div className="my-4 flex flex-col items-center gap-0.5">
        <span className="text-center font-mono text-xs text-[var(--shell-error)]">
          {content}
        </span>
        {subContent && (
          <span className="text-center font-mono text-[11px] text-[color-mix(in_oklab,var(--shell-error),transparent_35%)]">
            {subContent}
          </span>
        )}
      </div>
    );
  }

  if (role === "working") {
    if (isInstall) {
      return (
        <div className="mb-6 flex max-w-[880px] items-start gap-3">
          <InstallRepairAgentAvatar />
          <div className="min-w-0 pt-1">
            <InputDots />
          </div>
        </div>
      );
    }

    return (
      <div className="my-4 flex justify-start">
        <InputDots />
      </div>
    );
  }

  if (role === "assistant") {
    const cleaned = cleanAgentText(content);
    if (!cleaned && !isStreaming) return null;

    if (isInstall) {
      return (
        <div className="mb-6 flex max-w-[880px] items-start gap-3">
          <InstallRepairAgentAvatar />
          <div className="min-w-0">
            <div className="mb-1 text-xs font-medium text-[var(--shell-text-muted)]">
              {t("installRepair.chat.agentName")}
            </div>
            {cleaned ? (
              <div
                className="rounded-[0_10px_10px_10px] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] px-3.5 py-3 text-[13.5px] leading-relaxed text-[var(--shell-text-primary)]"
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={mdComponents}
                  >
                    {truncate(cleaned)}
                  </ReactMarkdown>
                  {isStreaming && (
                    <span
                      className="ml-0.5 inline-block h-4 w-1.5 align-text-bottom bg-[var(--shell-accent)]"
                      style={
                        IS_LINUX
                          ? undefined
                          : { animation: "caretBlink 1s steps(2) infinite" }
                      }
                    />
                  )}
                </div>
              </div>
            ) : (
              <InputDots />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 font-sans text-sm leading-relaxed text-[var(--shell-text-primary)]">
        {cleaned ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {truncate(cleaned)}
            </ReactMarkdown>
            {isStreaming && (
              <span
                className="ml-0.5 inline-block h-4 w-1.5 align-text-bottom bg-[var(--shell-accent)]"
                style={IS_LINUX ? undefined : { animation: "caretBlink 1s steps(2) infinite" }}
              />
            )}
          </div>
        ) : (
          <InputDots />
        )}
      </div>
    );
  }

  if (isInstall) {
    return (
      <div className="mb-6 flex max-w-[880px] items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--control-radius)] bg-[color-mix(in_oklab,var(--shell-bg-surface),var(--shell-text-primary)_6%)] font-mono text-[13px] font-bold text-[var(--shell-text-secondary)]">
          {t("installRepair.chat.you")}
        </div>
        <div className="min-w-0">
          <div
            className="text-[13.5px] leading-relaxed text-[var(--shell-text-primary)]"
            style={{
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              whiteSpace: "pre-line",
            }}
          >
            {truncate(content)}
          </div>
          {chips.length > 0 && <ReadonlyChips chips={chips} />}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col items-end">
      <div
        className="max-w-[78%] whitespace-pre-line rounded-[var(--shell-card-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] px-3.5 py-2 font-sans text-sm leading-relaxed text-[var(--shell-text-primary)]"
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {truncate(content)}
      </div>
      {chips.length > 0 && <ReadonlyChips chips={chips} />}
    </div>
  );
}
