import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { ArrowUp, ChevronDown, Square, Trash2 } from 'lucide-react';
import { RemoteModelSelector, type ModelOption } from '../../components/RemoteModelSelector';
import { getModelIcon } from '../../components/modelIcons';
import { PendingChipsRow } from '../../components/PendingChipsRow';
import { ChatBubble, ToolCallCard } from '../../components/chat';
import { buildPendingMessage } from '../../utils/buildPendingMessage';
import { useI18n } from '../../hooks/useI18n';
import * as api from '../../api/tauri';
import { useNavigationStore } from '../../stores/navigationStore';
import { useMotherAgent } from './context';
import { MA_PAGE_SIZE } from './types';

// ===== Main Content (center area) — CHAT =====
type MotherAgentMainVariant = 'mother' | 'install';

export function MotherAgentMain({ variant = 'mother' }: { variant?: MotherAgentMainVariant } = {}) {
  const { t } = useI18n();
  const isInstall = variant === 'install';
  const {
    models,
    agentModel,
    setAgentModel,
    chatInput,
    setChatInput,
    chatOutput,
    isProcessing,
    chatEndRef,
    handleChatSend,
    sendMessage,

    selectedServerId,
    clearChat,
    abortAgent,
    maDiskTotal,
    loadOlderChat,
  } = useMotherAgent();

  // Build model list for RemoteModelSelector (with icons)
  const modelList: ModelOption[] = React.useMemo(
    () =>
      models.map((m) => ({
        id: m.internalId,
        name: m.name,
        icon: getModelIcon(m.name, m.modelId),
      })),
    [models]
  );

  // Listen for clear-chat event from title bar
  useEffect(() => {
    const handler = () => clearChat();
    window.addEventListener('clear-chat', handler);
    return () => window.removeEventListener('clear-chat', handler);
  }, [clearChat]);

  const [remoteHints, setRemoteHints] = useState<Array<{ action: string; agent?: string }>>([]);
  const chatInputRef = useRef<HTMLTextAreaElement>(null!);
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ id: string; name: string; type: 'file' | 'image'; preview?: string }>
  >([]);

  // Wrap handleChatSend to append pending file info as text
  const localSend = useCallback(() => {
    const hasFiles = pendingFiles.length > 0;

    if (hasFiles) {
      const { messageText, chips } = buildPendingMessage(chatInput, pendingFiles, [], []);

      setPendingFiles([]);
      setChatInput('');
      sendMessage(messageText, chatInput.trim(), chips);
    } else {
      handleChatSend();
    }
  }, [pendingFiles, chatInput, setChatInput, handleChatSend, sendMessage, setPendingFiles]);

  useEffect(() => {
    // Load quick-hint buttons from bundled assets (offline-first).
    api
      .getMotherHints()
      .then((s) => {
        try {
          const data = JSON.parse(s);
          setRemoteHints(data.hints || []);
        } catch {
          setRemoteHints([]);
        }
      })
      .catch(() => setRemoteHints([]));
  }, []);

  // ── Scroll management — sticky-bottom auto-follow ──
  // Default-stuck-to-bottom: streaming chunks, tool calls, "thinking" indicators
  // all keep the viewport pinned. Sticky flips off the moment the user scrolls
  // up beyond the threshold; flips back on when they return to the bottom.
  const chatContainerRef = useRef<HTMLDivElement>(null!);
  const stickToBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const PAGE_SIZE = MA_PAGE_SIZE;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Re-snap to bottom every time the user opens this page — not just on first
  // hydration (the component stays mounted via CSS hidden, so a one-shot
  // initial-scroll flag misses subsequent visits).
  const isActivePage = useNavigationStore(
    (s: { activePage: string }) => s.activePage === (isInstall ? 'install' : 'mother'),
  );

  const snapToBottom = useCallback(() => {
    const c = chatContainerRef.current;
    if (!c) return;
    c.scrollTop = c.scrollHeight;
    setShowScrollBtn(false);
  }, []);

  // Reset pagination + re-arm sticky when the server changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayCount(PAGE_SIZE);
    stickToBottomRef.current = true;
    requestAnimationFrame(snapToBottom);
  }, [selectedServerId, snapToBottom]);

  // Re-arm sticky + snap whenever the page becomes active
  useEffect(() => {
    if (!isActivePage) return;
    stickToBottomRef.current = true;
    // Two rAFs: first lets layout settle after CSS unhide, second scrolls.
    requestAnimationFrame(() => requestAnimationFrame(snapToBottom));
  }, [isActivePage, snapToBottom]);

  // Sticky auto-follow: every chat update (new message, streaming delta,
  // tool call, processing-flag flip) re-snaps to bottom if sticky is on.
  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return;
    snapToBottom();
  }, [chatOutput, displayCount, isProcessing, snapToBottom]);

  // ResizeObserver safety net — catches async growth (markdown re-render,
  // image loads, code-block syntax highlighting) that bypasses React state.
  useEffect(() => {
    const c = chatContainerRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      if (stickToBottomRef.current) snapToBottom();
    });
    Array.from(c.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  }, [snapToBottom]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 80;
    // Sticky tracks the actual scroll position. Programmatic snaps land
    // at distance≈0, so they correctly keep sticky=true; user wheel/drag
    // away from the bottom flips it off.
    stickToBottomRef.current = isNearBottom;
    setShowScrollBtn(!isNearBottom && chatOutput.length > 0);

    if (container.scrollTop !== 0) return;

    // Phase 1: more in-memory messages to show
    if (displayCount < chatOutput.length) {
      setShowSkeleton(true);
      const prevScrollHeight = container.scrollHeight;
      setTimeout(() => {
        setShowSkeleton(false);
        setDisplayCount((c) => Math.min(c + PAGE_SIZE, chatOutput.length));
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight - prevScrollHeight;
          }
        });
      }, 300);
      return;
    }

    // Phase 2: load older batch from disk when in-memory is exhausted
    const alreadyLoaded = chatOutput.length;
    if (alreadyLoaded >= maDiskTotal) return;

    setShowSkeleton(true);
    const prevScrollHeight2 = container.scrollHeight;
    loadOlderChat()
      .then((older) => {
        setShowSkeleton(false);
        if (older.length === 0) return;
        setDisplayCount((c) => c + older.length);
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight - prevScrollHeight2;
          }
        });
      })
      .catch(() => {
        setShowSkeleton(false);
      });
  };

  const scrollToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    setShowScrollBtn(false);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatEndRef]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Chat conversation area */}
      <div className="relative flex-1">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className={
            isInstall
              ? 'chat-body absolute inset-0 overflow-y-auto slim-scroll px-10 py-6'
              : 'absolute inset-0 overflow-y-auto slim-scroll p-4'
          }
        >
          {/* Quick prompt hints — scrolls with content */}
          <div className="mb-2 select-none">
            {!isInstall && remoteHints.length > 0 && (
              <div className="flex flex-wrap gap-2 py-2">
                {remoteHints.map((hint, i) => {
                  // showSpecs swaps to a local-machine wording when 127.0.0.1
                  // is selected — otherwise the agent often refuses, treating
                  // "server" prompts as a remote/privileged operation.
                  const isLocalShowSpecs =
                    hint.action === 'showSpecs' && selectedServerId === 'local';
                  const i18nKey = (
                    isLocalShowSpecs
                      ? 'mother.hintShowSpecsLocal'
                      : `mother.hint${hint.action[0].toUpperCase()}${hint.action.slice(1)}`
                  ) as any;
                  const label = t(i18nKey).replace('{agent}', hint.agent || '');
                  // Skip hints whose i18n key was removed (label equals raw key)
                  if (label === i18nKey) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        // Replace input contents — don't append. Each hint
                        // is a self-contained prompt; concatenating them
                        // produces nonsense for the agent.
                        setChatInput(label);
                        const el = chatInputRef.current;
                        if (el) {
                          el.focus();
                          requestAnimationFrame(() => {
                            el.selectionStart = el.selectionEnd = label.length;
                          });
                        }
                      }}
                      className="cursor-pointer rounded-full border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] px-3 py-1.5 text-xs text-[var(--shell-text-secondary)] transition-colors hover:border-[var(--shell-text-muted)] hover:bg-[var(--shell-bg-elevated)] hover:text-[var(--shell-text-primary)]"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat messages — markdown stream */}
          <div className={isInstall ? 'chat-transcript pt-2 pb-2' : 'pt-2 pb-2'}>
            {/* Skeleton placeholders — shown briefly when lazy-loading older messages */}
            {showSkeleton &&
              [0, 1, 2].map((i) => (
                <ChatBubble key={`sk-${i}`} role="skeleton" content="" variant={variant} />
              ))}
            {isInstall && chatOutput.length === 0 && !isProcessing && (
              <ChatBubble
                role="assistant"
                content={t("installRepair.chat.welcome")}
                variant={variant}
              />
            )}
            {chatOutput.slice(-displayCount).map((msg, i, arr) => {
              if (msg.type === 'user') {
                return (
                  <ChatBubble
                    key={i}
                    role="user"
                    content={msg.text}
                    variant={variant}
                    chips={msg.chips}
                  />
                );
              }
              if (msg.type === 'tool_call') {
                return (
                  <ToolCallCard
                    key={`${i}-${msg.id}`}
                    name={msg.name}
                    args={msg.args}
                    status={msg.status}
                    output={msg.output}
                  />
                );
              }
              if (msg.type === 'assistant') {
                const isLast = arr.slice(i + 1).every((m) => m.type !== 'assistant');
                const lastOutput = chatOutput[chatOutput.length - 1];
                const isCurrentResponse = isLast && lastOutput?.type === 'assistant';
                return (
                  <ChatBubble
                    key={i}
                    role="assistant"
                    content={msg.text}
                    variant={variant}
                    isStreaming={isProcessing && isCurrentResponse}
                  />
                );
              }
              if (msg.type === 'cancelled') {
                const text = msg.i18nKey ? t(msg.i18nKey) : msg.text;
                return (
                  <div key={i} className="flex justify-center my-4">
                    <span className="font-mono text-xs text-[var(--shell-text-muted)]">{text}</span>
                  </div>
                );
              }
              if (msg.type === 'error') {
                const text = msg.i18nKey ? t(msg.i18nKey) : msg.text;
                return <ChatBubble key={i} role="error" content={text} variant={variant} />;
              }
              return null;
            })}
            {/* Typing indicator — show when processing and no new assistant response has started */}
            {isProcessing &&
              (chatOutput.length === 0 ||
                chatOutput[chatOutput.length - 1]?.type !== 'assistant') && (
                <ChatBubble role="assistant" content="" variant={variant} isStreaming={true} />
              )}
            <div ref={chatEndRef} />
          </div>
        </div>
        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className={`absolute z-10 flex h-8 w-8 items-center justify-center rounded-[var(--control-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] text-[var(--shell-text-secondary)] transition-colors hover:border-[var(--shell-text-muted)] hover:text-[var(--shell-text-primary)] ${
              isInstall ? 'bottom-4 right-10' : 'bottom-3 right-3'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Rich input area — Claude-style elevated rounded card */}
      <div className={isInstall ? 'chat-input flex-shrink-0 px-10 pb-[18px] pt-3.5' : 'mb-1 mt-1 flex-shrink-0'}>
        <div
          className={
            isInstall
              ? 'composer rounded-[14px] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] px-3.5 py-3'
              : 'rounded-[var(--shell-card-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)] p-2.5'
          }
        >
          {/* Pending attachments chips — shared component */}
          <PendingChipsRow
            files={pendingFiles}
            onRemoveFile={(id) => setPendingFiles((prev) => prev.filter((x) => x.id !== id))}
          />
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isProcessing) localSend();
              }
            }}
            placeholder={t('mother.enterMessage')}
            disabled={isProcessing}
            rows={2}
            className={
              isInstall
                ? 'w-full min-h-[44px] max-h-[160px] resize-none bg-transparent p-0 text-[13.5px] leading-[1.55] text-[var(--shell-text-primary)] outline-none placeholder:text-[var(--shell-text-muted)] disabled:opacity-30'
                : 'w-full resize-none bg-transparent px-2 py-1 font-sans text-sm font-medium text-[var(--shell-text-primary)] outline-none placeholder:text-[var(--shell-text-muted)] disabled:opacity-30'
            }
          />
          <div
            className={
              isInstall ? 'mt-2.5 flex items-center gap-2' : 'flex items-center justify-end gap-1.5'
            }
          >
            <RemoteModelSelector
              models={modelList}
              currentModelId={agentModel}
              loading={false}
              onSelect={(id) => setAgentModel(id || null)}
              placeholder={t('mother.selectModel')}
              dropdownAlign={isInstall ? 'left' : 'right'}
            />
            {isInstall && <div className="flex-1" />}
            {isInstall && (
              <button
                type="button"
                onClick={() => clearChat()}
                disabled={isProcessing}
                title={t('common.clear')}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--control-radius)] px-2.5 text-[12.5px] font-medium text-[var(--shell-text-secondary)] transition-colors hover:bg-[var(--shell-bg-elevated)] hover:text-[var(--shell-text-primary)] disabled:cursor-default disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t('common.clear')}</span>
              </button>
            )}
            {isProcessing ? (
              <button
                onClick={() => abortAgent()}
                className={
                  isInstall
                    ? 'flex h-8 w-8 items-center justify-center rounded-[var(--control-radius)] bg-[color-mix(in_oklab,var(--shell-error),transparent_86%)] transition-colors hover:bg-[color-mix(in_oklab,var(--shell-error),transparent_78%)]'
                    : 'w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 transition-colors'
                }
              >
                <Square size={14} fill="#f87171" className="text-red-400" />
              </button>
            ) : (
              <button
                onClick={localSend}
                disabled={!chatInput.trim()}
                className={
                  isInstall
                    ? 'flex h-8 w-8 items-center justify-center rounded-[var(--control-radius)] bg-[var(--shell-accent)] text-white transition-all hover:brightness-110 disabled:opacity-20'
                    : 'flex h-8 w-8 items-center justify-center rounded-[var(--control-radius)] bg-[var(--shell-accent)] transition-all hover:brightness-110 disabled:opacity-20'
                }
              >
                <ArrowUp
                  size={18}
                  strokeWidth={2.5}
                  className={isInstall ? 'text-white' : 'text-[var(--shell-bg-terminal)]'}
                />
              </button>
            )}
          </div>
        </div>
        {/* Hidden file inputs */}
      </div>
    </div>
  );
}
