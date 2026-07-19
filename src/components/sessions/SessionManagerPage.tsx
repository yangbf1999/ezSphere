import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSessionSearch } from "@/hooks/useSessionSearch";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  RefreshCw,
  Search,
  Play,
  Trash2,
  MessageSquare,
  Clock,
  FolderOpen,
  FileText,
  X,
  CheckSquare,
} from "lucide-react";
import {
  useDeleteSessionMutation,
  useSessionMessagesQuery,
  useSessionsQuery,
} from "@/lib/query";
import { sessionsApi } from "@/lib/api";
import type { SessionMeta } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { extractErrorMessage } from "@/utils/errorUtils";
import { isTextEditableTarget } from "@/utils/domUtils";
import { isMac } from "@/lib/platform";
import { ProviderIcon } from "@/components/ProviderIcon";
import { SessionItem } from "./SessionItem";
import { SessionMessageItem } from "./SessionMessageItem";
import { SessionsPageHeader } from "./SessionsPageHeader";
import { SessionTocDialog, SessionTocSidebar } from "./SessionToc";
import {
  extractCodexPromptPreview,
  formatSessionMessagePreview,
  formatSessionTitle,
  formatTimestamp,
  getBaseName,
  getProviderIconName,
  getProviderLabel,
  getSessionKey,
  shouldHideCodexMessageFromToc,
} from "./utils";

type ProviderFilter =
  | "all"
  | "codex"
  | "claude"
  | "opencode"
  | "openclaw"
  | "gemini"
  | "hermes";

const PROVIDER_FILTER_VALUES: ProviderFilter[] = [
  "all",
  "codex",
  "claude",
  "opencode",
  "openclaw",
  "gemini",
  "hermes",
];

const normalizeProviderFilter = (value: string): ProviderFilter =>
  PROVIDER_FILTER_VALUES.includes(value as ProviderFilter)
    ? (value as ProviderFilter)
    : "all";

export function SessionManagerPage({
  appId,
  layout = "shell",
}: {
  appId: string;
  layout?: "default" | "shell";
}) {
  const isShellLayout = layout === "shell";
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useSessionsQuery();
  const sessions = data ?? [];
  const detailRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(
    null,
  );
  const [tocDialogOpen, setTocDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<SessionMeta[] | null>(
    null,
  );
  const [selectedSessionKeys, setSelectedSessionKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>(
    () => normalizeProviderFilter(appId),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const providerFilterOptions = useMemo(
    () => [
      {
        value: "all" as ProviderFilter,
        label: t("sessionManager.providerFilterAll"),
      },
      { value: "claude" as ProviderFilter, label: "Claude Code" },
      { value: "codex" as ProviderFilter, label: "Codex" },
      // { value: "opencode" as ProviderFilter, label: "OpenCode" },
      // { value: "openclaw" as ProviderFilter, label: "OpenClaw" },
      // { value: "hermes" as ProviderFilter, label: "Hermes" },
      // { value: "gemini" as ProviderFilter, label: "Gemini CLI" },
    ],
    [t],
  );
  const activeProviderFilterIndex = providerFilterOptions.findIndex(
    (option) => option.value === providerFilter,
  );

  const moveProviderFilter = useCallback(
    (nextIndex: number) => {
      const option = providerFilterOptions[nextIndex];
      if (option) {
        setProviderFilter(option.value);
      }
    },
    [providerFilterOptions],
  );

  const handleProviderFilterKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = providerFilterOptions.length - 1;
      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = index === lastIndex ? 0 : index + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = index === 0 ? lastIndex : index - 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = lastIndex;
          break;
        default:
          return;
      }

      event.preventDefault();
      moveProviderFilter(nextIndex);
      const tabs =
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
          '[role="tab"]',
        );
      tabs?.[nextIndex]?.focus();
    },
    [moveProviderFilter, providerFilterOptions.length],
  );

  // 使用 FlexSearch 全文搜索
  const { search: searchSessions } = useSessionSearch({
    sessions,
    providerFilter,
  });

  const filteredSessions = useMemo(() => {
    return searchSessions(search);
  }, [searchSessions, search]);

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sessions.length };
    sessions.forEach((session) => {
      counts[session.providerId] = (counts[session.providerId] ?? 0) + 1;
    });
    return counts;
  }, [sessions]);

  useEffect(() => {
    if (!isShellLayout) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "f") {
        if (isTextEditableTarget(document.activeElement)) return;
        event.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShellLayout]);

  useEffect(() => {
    if (filteredSessions.length === 0) {
      setSelectedKey(null);
      return;
    }
    const exists = selectedKey
      ? filteredSessions.some(
          (session) => getSessionKey(session) === selectedKey,
        )
      : false;
    if (!exists) {
      setSelectedKey(getSessionKey(filteredSessions[0]));
    }
  }, [filteredSessions, selectedKey]);

  const selectedSession = useMemo(() => {
    if (!selectedKey) return null;
    return (
      filteredSessions.find(
        (session) => getSessionKey(session) === selectedKey,
      ) || null
    );
  }, [filteredSessions, selectedKey]);

  const { data: messages = [], isLoading: isLoadingMessages } =
    useSessionMessagesQuery(
      selectedSession?.providerId,
      selectedSession?.sourcePath,
    );
  const deleteSessionMutation = useDeleteSessionMutation();
  const isDeleting = deleteSessionMutation.isPending || isBatchDeleting;

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
    gap: 12,
  });

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedKey]);

  useEffect(() => {
    const validKeys = new Set(
      sessions.map((session) => getSessionKey(session)),
    );
    setSelectedSessionKeys((current) => {
      let changed = false;
      const next = new Set<string>();
      current.forEach((key) => {
        if (validKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [sessions]);

  const isCodexSession = selectedSession?.providerId === "codex";

  // 提取用户消息用于目录
  const userMessagesToc = useMemo(() => {
    return messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => {
        if (msg.role.toLowerCase() !== "user") return false;
        return !(isCodexSession && shouldHideCodexMessageFromToc(msg.content));
      })
      .map(({ msg, index }) => {
        const previewContent = isCodexSession
          ? extractCodexPromptPreview(msg.content)
          : msg.content;

        return {
          index,
          preview: formatSessionMessagePreview(previewContent),
          ts: msg.ts,
        };
      });
  }, [isCodexSession, messages]);

  const scrollToMessage = (index: number) => {
    virtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
    setActiveMessageIndex(index);
    setTocDialogOpen(false);
    setTimeout(() => setActiveMessageIndex(null), 2000);
  };

  const handleCopy = useCallback(
    async (text: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(successMessage);
      } catch (error) {
        toast.error(
          extractErrorMessage(error) ||
            t("common.error", { defaultValue: "Copy failed" }),
        );
      }
    },
    [t],
  );

  const handleMessageCopy = useCallback(
    (content: string) => {
      void handleCopy(
        content,
        t("sessionManager.messageCopied", { defaultValue: "已复制消息内容" }),
      );
    },
    [handleCopy, t],
  );

  const handleResume = async () => {
    if (!selectedSession?.resumeCommand) return;

    if (!isMac()) {
      await handleCopy(
        selectedSession.resumeCommand,
        t("sessionManager.resumeCommandCopied"),
      );
      return;
    }

    try {
      await sessionsApi.launchTerminal({
        command: selectedSession.resumeCommand,
        cwd: selectedSession.projectDir ?? undefined,
      });
      toast.success(t("sessionManager.terminalLaunched"));
    } catch (error) {
      const fallback = selectedSession.resumeCommand;
      await handleCopy(fallback, t("sessionManager.resumeFallbackCopied"));
      toast.error(extractErrorMessage(error) || t("sessionManager.openFailed"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargets || deleteTargets.length === 0 || isDeleting) {
      return;
    }

    const targets = deleteTargets.filter((session) => session.sourcePath);
    setDeleteTargets(null);

    if (targets.length === 0) {
      return;
    }

    if (targets.length === 1) {
      const [target] = targets;
      await deleteSessionMutation.mutateAsync({
        providerId: target.providerId,
        sessionId: target.sessionId,
        sourcePath: target.sourcePath!,
      });
      setSelectedSessionKeys((current) => {
        const next = new Set(current);
        next.delete(getSessionKey(target));
        return next;
      });
      return;
    }

    setIsBatchDeleting(true);
    try {
      const results = await sessionsApi.deleteMany(
        targets.map((session) => ({
          providerId: session.providerId,
          sessionId: session.sessionId,
          sourcePath: session.sourcePath!,
        })),
      );

      const deletedKeys = results
        .filter((result) => result.success)
        .map(
          (result) =>
            `${result.providerId}:${result.sessionId}:${result.sourcePath ?? ""}`,
        );

      const failedErrors = results
        .filter((result) => !result.success)
        .map((result) => result.error || t("common.unknown"));

      if (deletedKeys.length > 0) {
        const deletedKeySet = new Set(deletedKeys);
        queryClient.setQueryData<SessionMeta[]>(["sessions"], (current) =>
          (current ?? []).filter(
            (session) => !deletedKeySet.has(getSessionKey(session)),
          ),
        );
      }

      results
        .filter((result) => result.success)
        .forEach((result) => {
          queryClient.removeQueries({
            queryKey: ["sessionMessages", result.providerId, result.sourcePath],
          });
        });

      setSelectedSessionKeys((current) => {
        const next = new Set(current);
        deletedKeys.forEach((key) => next.delete(key));
        return next;
      });

      await queryClient.invalidateQueries({ queryKey: ["sessions"] });

      if (deletedKeys.length > 0) {
        toast.success(
          t("sessionManager.batchDeleteSuccess", {
            defaultValue: "已删除 {{count}} 个会话",
            count: deletedKeys.length,
          }),
        );
      }

      if (failedErrors.length > 0) {
        toast.error(
          t("sessionManager.batchDeleteFailed", {
            defaultValue: "{{failed}} 个会话删除失败",
            failed: failedErrors.length,
          }),
          {
            description: failedErrors[0],
          },
        );
      }
    } catch (error) {
      toast.error(
        extractErrorMessage(error) ||
          t("sessionManager.batchDeleteRequestFailed", {
            defaultValue: "批量删除失败，请稍后重试",
          }),
      );
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const deletableFilteredSessions = useMemo(
    () => filteredSessions.filter((session) => Boolean(session.sourcePath)),
    [filteredSessions],
  );

  const selectedSessions = useMemo(
    () =>
      sessions.filter((session) =>
        selectedSessionKeys.has(getSessionKey(session)),
      ),
    [sessions, selectedSessionKeys],
  );

  const selectedDeletableSessions = useMemo(
    () => selectedSessions.filter((session) => Boolean(session.sourcePath)),
    [selectedSessions],
  );

  useEffect(() => {
    if (!selectionMode) return;

    const visibleKeys = new Set(
      deletableFilteredSessions.map((session) => getSessionKey(session)),
    );

    setSelectedSessionKeys((current) => {
      let changed = false;
      const next = new Set<string>();

      current.forEach((key) => {
        if (visibleKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [deletableFilteredSessions, selectionMode]);

  const allFilteredSelected =
    deletableFilteredSessions.length > 0 &&
    deletableFilteredSessions.every((session) =>
      selectedSessionKeys.has(getSessionKey(session)),
    );

  const toggleSessionChecked = (session: SessionMeta, checked: boolean) => {
    if (!session.sourcePath) return;
    const key = getSessionKey(session);
    setSelectedSessionKeys((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedSessionKeys((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        deletableFilteredSessions.forEach((session) =>
          next.delete(getSessionKey(session)),
        );
      } else {
        deletableFilteredSessions.forEach((session) =>
          next.add(getSessionKey(session)),
        );
      }
      return next;
    });
  };

  const openBatchDeleteDialog = () => {
    if (selectedDeletableSessions.length === 0) return;
    setDeleteTargets(selectedDeletableSessions);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedSessionKeys(new Set());
  };

  return (
    <TooltipProvider>
      <div
        className={
          isShellLayout
            ? "sessions-page flex flex-col h-full min-h-0"
            : "mx-auto px-4 sm:px-6 flex flex-col h-full min-h-0"
        }
        onWheel={(e) => {
          const target = e.target;
          if (
            target instanceof Element &&
            target.closest(".sess-list, .detail-scroll, .sessions-filter-group")
          ) {
            return;
          }
          e.stopPropagation();
        }}
      >
        {isShellLayout ? <SessionsPageHeader /> : null}
        {isShellLayout ? (
          <div className="filter-bar sessions-filter-bar">
            <div className="search-field sessions-search-field">
              <Search strokeWidth={2} aria-hidden />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("sessionManager.searchPlaceholder")}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearch("");
                  }
                }}
              />
              {search ? (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t("common.clear", { defaultValue: "清空" })}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <div className="sessions-filter-row">
              <div
                className="filter-group sessions-filter-group tabsSessions"
                role="tablist"
                aria-label={t("sessionManager.sourceFilter", {
                  defaultValue: "Source filter",
                })}
              >
                {providerFilterOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={providerFilter === option.value}
                    tabIndex={
                      index === activeProviderFilterIndex ||
                      (activeProviderFilterIndex === -1 && index === 0)
                        ? 0
                        : -1
                    }
                    className={`filter-btn${
                      providerFilter === option.value ? " active" : ""
                    }`}
                    onClick={() => setProviderFilter(option.value)}
                    onKeyDown={(event) =>
                      handleProviderFilterKeyDown(event, index)
                    }
                  >
                    {option.label}
                    <span className="filter-count">
                      {providerCounts[option.value] ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="sessions-filter-actions">
                {(selectionMode || deletableFilteredSessions.length > 0) && (
                  <button
                    type="button"
                    className={`icon-btn${selectionMode ? " icon-btn-active" : ""}`}
                    aria-label={
                      selectionMode
                        ? t("sessionManager.exitBatchModeTooltip", {
                            defaultValue: "退出批量管理",
                          })
                        : t("sessionManager.manageBatchTooltip", {
                            defaultValue: "批量管理",
                          })
                    }
                    onClick={() => {
                      if (selectionMode) {
                        exitSelectionMode();
                      } else {
                        setSelectionMode(true);
                      }
                    }}
                  >
                    <CheckSquare className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => void refetch()}
                  title={t("common.refresh")}
                  aria-label={t("common.refresh")}
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={
            isShellLayout
              ? "sessions-layout flex-1 min-h-0"
              : "flex-1 overflow-hidden flex flex-col gap-4"
          }
        >
          <div
            className={
              isShellLayout
                ? "sessions-split"
                : "flex-1 overflow-hidden grid gap-4 md:grid-cols-[320px_1fr]"
            }
          >
            {isShellLayout ? (
              <div className="pane sessions-list-card">
                <div className="pane-head">
                  {isSearchOpen ? (
                    <div className="pane-head-search">
                      <div className="search">
                        <Search strokeWidth={2} aria-hidden />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder={t("sessionManager.searchPlaceholder")}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setIsSearchOpen(false);
                              setSearch("");
                            }
                          }}
                          onBlur={() => {
                            if (search.trim() === "") {
                              setIsSearchOpen(false);
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={t("common.close")}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearch("");
                        }}
                      >
                        <X className="size-3.5" />
                      </button>
                      {selectionMode && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-active"
                          aria-label={t("sessionManager.exitBatchModeTooltip", {
                            defaultValue: "退出批量管理",
                          })}
                          onClick={exitSelectionMode}
                        >
                          <CheckSquare className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="search search-trigger">
                        <Search strokeWidth={2} aria-hidden />
                        <input
                          readOnly
                          placeholder={t("sessionManager.searchPlaceholder")}
                          onClick={() => {
                            setIsSearchOpen(true);
                            setTimeout(() => searchInputRef.current?.focus(), 0);
                          }}
                        />
                      </div>
                      <select
                        className="f-select provider-filter"
                        aria-label={t("sessionManager.providerFilterAll")}
                        value={providerFilter}
                        onChange={(event) =>
                          setProviderFilter(event.target.value as ProviderFilter)
                        }
                      >
                        <option value="all">
                          {t("sessionManager.providerFilterAll")}
                        </option>
                        <option value="claude">Claude Code</option>
                        <option value="codex">Codex</option>
                        <option value="opencode">OpenCode</option>
                        <option value="openclaw">OpenClaw</option>
                        <option value="hermes">Hermes</option>
                        <option value="gemini">Gemini CLI</option>
                      </select>
                      <div className="pane-head-actions">
                        {(selectionMode || deletableFilteredSessions.length > 0) && (
                          <button
                            type="button"
                            className={`icon-btn${selectionMode ? " icon-btn-active" : ""}`}
                            aria-label={
                              selectionMode
                                ? t("sessionManager.exitBatchModeTooltip", {
                                    defaultValue: "退出批量管理",
                                  })
                                : t("sessionManager.manageBatchTooltip", {
                                    defaultValue: "批量管理",
                                  })
                            }
                            onClick={() => {
                              if (selectionMode) {
                                exitSelectionMode();
                              } else {
                                setSelectionMode(true);
                              }
                            }}
                          >
                            <CheckSquare className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => void refetch()}
                          title={t("common.refresh")}
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {selectionMode && (
                  <div className="batch-bar mb-4">
                    <div className="batch-bar-meta">
                      <span className="batch-count">
                        {t("sessionManager.selectedCount", {
                          defaultValue: "已选 {{count}} 项",
                          count: selectedDeletableSessions.length,
                        })}
                      </span>
                      <span>{t("sessionManager.batchModeHint")}</span>
                    </div>
                    <div className="batch-bar-actions">
                      {deletableFilteredSessions.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={handleToggleSelectAll}
                        >
                          {allFilteredSelected
                            ? t("sessionManager.clearFilteredSelection", {
                                defaultValue: "取消全选",
                              })
                            : t("sessionManager.selectAllFiltered", {
                                defaultValue: "全选当前",
                              })}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setSelectedSessionKeys(new Set())}
                      >
                        {t("sessionManager.clearSelection", {
                          defaultValue: "清空已选",
                        })}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={openBatchDeleteDialog}
                        disabled={
                          isDeleting || selectedDeletableSessions.length === 0
                        }
                      >
                        <Trash2 className="size-3.5" />
                        {isBatchDeleting
                          ? t("sessionManager.batchDeleting", {
                              defaultValue: "删除中...",
                            })
                          : t("sessionManager.deleteSelected", {
                              defaultValue: "批量删除",
                            })}
                      </button>
                    </div>
                  </div>
                )}
                <div className="sess-list">
                  {isLoading ? (
                    <div className="sess-loading">
                      <RefreshCw className="size-5 animate-spin" />
                      <span>{t("sessionManager.loadingSessions")}</span>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="sess-empty">
                      <MessageSquare className="size-8" />
                      <p>{t("sessionManager.noSessions")}</p>
                    </div>
                  ) : (
                    filteredSessions.map((session) => {
                      const isSelected =
                        selectedKey !== null &&
                        getSessionKey(session) === selectedKey;

                      return (
                        <SessionItem
                          key={getSessionKey(session)}
                          session={session}
                          isSelected={isSelected}
                          selectionMode={selectionMode}
                          searchQuery={search}
                          layout="shell"
                          isChecked={selectedSessionKeys.has(
                            getSessionKey(session),
                          )}
                          isCheckDisabled={!session.sourcePath}
                          onSelect={setSelectedKey}
                          onToggleChecked={(checked) =>
                            toggleSessionChecked(session, checked)
                          }
                          onDelete={() => setDeleteTargets([session])}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* 原 default 左栏 Card 布局保留 */
              <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <CardHeader className="py-2 px-3 border-b">
                {isSearchOpen ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t("sessionManager.searchPlaceholder")}
                        className="h-8 pl-8 pr-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setIsSearchOpen(false);
                            setSearch("");
                          }
                        }}
                        onBlur={() => {
                          if (search.trim() === "") {
                            setIsSearchOpen(false);
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearch("");
                        }}
                        aria-label={t("common.close")}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    {selectionMode && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20"
                            aria-label={t(
                              "sessionManager.exitBatchModeTooltip",
                              {
                                defaultValue: "退出批量管理",
                              },
                            )}
                            onClick={exitSelectionMode}
                          >
                            <CheckSquare className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("sessionManager.exitBatchModeTooltip", {
                            defaultValue: "退出批量管理",
                          })}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CardTitle className="text-sm font-medium whitespace-nowrap">
                          {t("sessionManager.sessionList")}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {filteredSessions.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(selectionMode ||
                          deletableFilteredSessions.length > 0) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={selectionMode ? "secondary" : "ghost"}
                                size="icon"
                                className={
                                  selectionMode
                                    ? "size-7 bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20"
                                    : "size-7"
                                }
                                aria-label={
                                  selectionMode
                                    ? t("sessionManager.exitBatchModeTooltip", {
                                        defaultValue: "退出批量管理",
                                      })
                                    : t("sessionManager.manageBatchTooltip", {
                                        defaultValue: "批量管理",
                                      })
                                }
                                onClick={() => {
                                  if (selectionMode) {
                                    exitSelectionMode();
                                  } else {
                                    setSelectionMode(true);
                                  }
                                }}
                              >
                                <CheckSquare className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {selectionMode
                                ? t("sessionManager.exitBatchModeTooltip", {
                                    defaultValue: "退出批量管理",
                                  })
                                : t("sessionManager.manageBatchTooltip", {
                                    defaultValue: "批量管理",
                                  })}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={t("common.search")}
                              onClick={() => {
                                setIsSearchOpen(true);
                                setTimeout(
                                  () => searchInputRef.current?.focus(),
                                  0,
                                );
                              }}
                            >
                              <Search className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("sessionManager.searchSessions")}
                          </TooltipContent>
                        </Tooltip>

                        <Select
                          value={providerFilter}
                          onValueChange={(value) =>
                            setProviderFilter(value as ProviderFilter)
                          }
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectTrigger className="size-7 p-0 justify-center border-0 bg-transparent hover:bg-muted">
                                <ProviderIcon
                                  icon={
                                    providerFilter === "all"
                                      ? "apps"
                                      : getProviderIconName(providerFilter)
                                  }
                                  name={providerFilter}
                                  size={14}
                                />
                              </SelectTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              {providerFilter === "all"
                                ? t("sessionManager.providerFilterAll")
                                : providerFilter}
                            </TooltipContent>
                          </Tooltip>
                          <SelectContent>
                            <SelectItem value="all">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  icon="apps"
                                  name="all"
                                  size={14}
                                />
                                <span>
                                  {t("sessionManager.providerFilterAll")}
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="codex">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  icon="openai"
                                  name="codex"
                                  size={14}
                                />
                                <span>Codex</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="claude">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  icon="claude"
                                  name="claude"
                                  size={14}
                                />
                                <span>Claude Code</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="opencode">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  icon="opencode"
                                  name="opencode"
                                  size={14}
                                />
                                <span>OpenCode</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="openclaw">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  icon="openclaw"
                                  name="openclaw"
                                  size={14}
                                />
                                <span>OpenClaw</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="gemini">
                              <div className="flex items-center gap-2">
                                <ProviderIcon
                                  icon="gemini"
                                  name="gemini"
                                  size={14}
                                />
                                <span>Gemini CLI</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => void refetch()}
                              aria-label={t("common.refresh")}
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.refresh")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    {selectionMode && (
                      <div className="grid gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {t("sessionManager.selectedCount", {
                              defaultValue: "已选 {{count}} 项",
                              count: selectedDeletableSessions.length,
                            })}
                          </Badge>
                          <span className="truncate">
                            {t("sessionManager.batchModeHint", {
                              defaultValue: "勾选要删除的会话",
                            })}
                          </span>
                        </div>
                        <div className="grid gap-3 min-[520px]:grid-cols-[minmax(0,1fr)_auto] min-[520px]:items-center">
                          <div className="flex flex-wrap items-center gap-2">
                            {deletableFilteredSessions.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2.5 text-xs whitespace-nowrap"
                                onClick={handleToggleSelectAll}
                              >
                                {allFilteredSelected
                                  ? t("sessionManager.clearFilteredSelection", {
                                      defaultValue: "取消全选",
                                    })
                                  : t("sessionManager.selectAllFiltered", {
                                      defaultValue: "全选当前",
                                    })}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs whitespace-nowrap"
                              onClick={() => setSelectedSessionKeys(new Set())}
                            >
                              {t("sessionManager.clearSelection", {
                                defaultValue: "清空已选",
                              })}
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 gap-1.5 px-2.5 whitespace-nowrap justify-self-start min-[520px]:justify-self-end"
                            onClick={openBatchDeleteDialog}
                            disabled={
                              isDeleting ||
                              selectedDeletableSessions.length === 0
                            }
                          >
                            <Trash2 className="size-3.5" />
                            <span className="text-xs">
                              {isBatchDeleting
                                ? t("sessionManager.batchDeleting", {
                                    defaultValue: "删除中...",
                                  })
                                : t("sessionManager.deleteSelected", {
                                    defaultValue: "批量删除",
                                  })}
                            </span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredSessions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="size-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t("sessionManager.noSessions")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredSessions.map((session) => {
                          const isSelected =
                            selectedKey !== null &&
                            getSessionKey(session) === selectedKey;

                          return (
                            <SessionItem
                              key={getSessionKey(session)}
                              session={session}
                              isSelected={isSelected}
                              selectionMode={selectionMode}
                              searchQuery={search}
                              layout="default"
                              isChecked={selectedSessionKeys.has(
                                getSessionKey(session),
                              )}
                              isCheckDisabled={!session.sourcePath}
                              onSelect={setSelectedKey}
                              onToggleChecked={(checked) =>
                                toggleSessionChecked(session, checked)
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            )}

            {isShellLayout ? (
              <div className="pane" ref={detailRef}>
                {!selectedSession ? (
                  <div className="detail-empty">
                    <MessageSquare className="size-12" />
                    <p>{t("sessionManager.selectSession")}</p>
                  </div>
                ) : (
                  <>
                    <div className="pane-head detail-head">
                      <span className="detail-title">
                        {formatSessionTitle(selectedSession)}
                      </span>
                      <span className="detail-meta">
                        {getProviderLabel(selectedSession.providerId, t)} ·{" "}
                        {t("sessionManager.messageCount", {
                          defaultValue: "{{count}} 条",
                          count: messages.length,
                        })}
                      </span>
                      {isMac() && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => void handleResume()}
                          disabled={!selectedSession.resumeCommand}
                          title={
                            selectedSession.resumeCommand
                              ? t("sessionManager.resumeTooltip")
                              : t("sessionManager.noResumeCommand")
                          }
                        >
                          <Play strokeWidth={2} />
                          {t("sessionManager.resume", { defaultValue: "恢复" })}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setDeleteTargets([selectedSession])}
                        disabled={!selectedSession.sourcePath || isDeleting}
                        title={t("sessionManager.deleteTooltip", {
                          defaultValue: "永久删除此本地会话记录",
                        })}
                      >
                        <Trash2 strokeWidth={2} />
                        {isDeleting
                          ? t("sessionManager.deleting")
                          : t("sessionManager.delete", { defaultValue: "删除" })}
                      </button>
                    </div>

                    <div className="detail-body">
                      {(selectedSession.projectDir ||
                        selectedSession.sourcePath ||
                        selectedSession.resumeCommand) && (
                        <div className="detail-extra">
                          {selectedSession.projectDir && (
                            <button
                              type="button"
                              className="detail-meta-link"
                              onClick={() =>
                                void handleCopy(
                                  selectedSession.projectDir!,
                                  t("sessionManager.projectDirCopied"),
                                )
                              }
                            >
                              <FolderOpen className="size-3" />
                              {getBaseName(selectedSession.projectDir)}
                            </button>
                          )}
                          {selectedSession.sourcePath && (
                            <button
                              type="button"
                              className="detail-meta-link"
                              onClick={() =>
                                void handleCopy(
                                  selectedSession.sourcePath!,
                                  t("sessionManager.sourcePathCopied"),
                                )
                              }
                            >
                              <FileText className="size-3" />
                              {getBaseName(selectedSession.sourcePath)}
                            </button>
                          )}
                          {selectedSession.resumeCommand && (
                            <div className="resume-command-row">
                              <code>{selectedSession.resumeCommand}</code>
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() =>
                                  void handleCopy(
                                    selectedSession.resumeCommand!,
                                    t("sessionManager.resumeCommandCopied"),
                                  )
                                }
                                title={t("sessionManager.copyCommand")}
                                aria-label={t("sessionManager.copyCommand")}
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="detail-messages">
                        <div
                          ref={scrollContainerRef}
                          className="detail-scroll"
                        >
                          {isLoadingMessages ? (
                            <div className="sess-loading">
                              <RefreshCw className="size-5 animate-spin" />
                              <span>{t("sessionManager.loadingMessages")}</span>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="sess-empty">
                              <MessageSquare className="size-8" />
                              <p>{t("sessionManager.emptySession")}</p>
                            </div>
                          ) : (
                            <div
                              style={{
                                height: virtualizer.getTotalSize(),
                                position: "relative",
                              }}
                            >
                              {virtualizer
                                .getVirtualItems()
                                .map((virtualRow) => (
                                  <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={virtualizer.measureElement}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                  >
                                    <SessionMessageItem
                                      message={messages[virtualRow.index]}
                                      isActive={
                                        activeMessageIndex === virtualRow.index
                                      }
                                      searchQuery={search}
                                      layout="shell"
                                      onCopy={handleMessageCopy}
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
            /* 原 default 右栏 Card 布局保留 */
            <Card
              className="flex flex-col overflow-hidden min-h-0"
              ref={detailRef}
            >
              {!selectedSession ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  <MessageSquare className="size-12 mb-3 opacity-30" />
                  <p className="text-sm">{t("sessionManager.selectSession")}</p>
                </div>
              ) : (
                <>
                  {/* 详情头部 */}
                  <CardHeader className="py-3 px-4 border-b shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      {/* 左侧：会话信息 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="shrink-0">
                                <ProviderIcon
                                  icon={getProviderIconName(
                                    selectedSession.providerId,
                                  )}
                                  name={selectedSession.providerId}
                                  size={20}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {getProviderLabel(selectedSession.providerId, t)}
                            </TooltipContent>
                          </Tooltip>
                          <h2 className="text-base font-semibold truncate">
                            {formatSessionTitle(selectedSession)}
                          </h2>
                        </div>

                        {/* 元信息 */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>
                              {formatTimestamp(
                                selectedSession.lastActiveAt ??
                                  selectedSession.createdAt,
                              )}
                            </span>
                          </div>
                          {selectedSession.projectDir && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleCopy(
                                      selectedSession.projectDir!,
                                      t("sessionManager.projectDirCopied"),
                                    )
                                  }
                                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                  <FolderOpen className="size-3" />
                                  <span className="truncate max-w-[200px]">
                                    {getBaseName(selectedSession.projectDir)}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-xs"
                              >
                                <p className="font-mono text-xs break-all">
                                  {selectedSession.projectDir}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                  {t("sessionManager.clickToCopyPath")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {selectedSession.sourcePath && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleCopy(
                                      selectedSession.sourcePath!,
                                      t("sessionManager.sourcePathCopied"),
                                    )
                                  }
                                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                  <FileText className="size-3 shrink-0" />
                                  <span className="font-mono truncate max-w-[200px]">
                                    {getBaseName(selectedSession.sourcePath)}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-xs"
                              >
                                <p className="font-mono text-xs break-all">
                                  {selectedSession.sourcePath}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                  {t("sessionManager.clickToCopyPath")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* 右侧：操作按钮组 */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isMac() && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => void handleResume()}
                                disabled={!selectedSession.resumeCommand}
                              >
                                <Play className="size-3.5" />
                                <span className="hidden sm:inline">
                                  {t("sessionManager.resume", {
                                    defaultValue: "恢复会话",
                                  })}
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {selectedSession.resumeCommand
                                ? t("sessionManager.resumeTooltip", {
                                    defaultValue: "在终端中恢复此会话",
                                  })
                                : t("sessionManager.noResumeCommand", {
                                    defaultValue: "此会话无法恢复",
                                  })}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              onClick={() =>
                                setDeleteTargets([selectedSession])
                              }
                              disabled={
                                !selectedSession.sourcePath || isDeleting
                              }
                            >
                              <Trash2 className="size-3.5" />
                              <span className="hidden sm:inline">
                                {isDeleting
                                  ? t("sessionManager.deleting", {
                                      defaultValue: "删除中...",
                                    })
                                  : t("sessionManager.delete", {
                                      defaultValue: "删除会话",
                                    })}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("sessionManager.deleteTooltip", {
                              defaultValue: "永久删除此本地会话记录",
                            })}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* 恢复命令预览 */}
                    {selectedSession.resumeCommand && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 rounded-md bg-muted/60 px-3 py-1.5 font-mono text-xs text-muted-foreground truncate">
                          {selectedSession.resumeCommand}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 shrink-0"
                              onClick={() =>
                                void handleCopy(
                                  selectedSession.resumeCommand!,
                                  t("sessionManager.resumeCommandCopied"),
                                )
                              }
                              aria-label={t("common.copy")}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("sessionManager.copyCommand", {
                              defaultValue: "复制命令",
                            })}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </CardHeader>

                  {/* 消息列表区域 */}
                  <CardContent className="flex-1 min-h-0 p-0">
                    <div className="flex h-full min-w-0">
                      {/* 消息列表 */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="px-4 pt-4 pb-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {t("sessionManager.conversationHistory", {
                                defaultValue: "对话记录",
                              })}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {messages.length}
                            </Badge>
                          </div>
                        </div>
                        <div
                          ref={scrollContainerRef}
                          className="flex-1 overflow-y-auto px-4 pb-4 min-w-0"
                        >
                          {isLoadingMessages ? (
                            <div className="flex items-center justify-center py-12">
                              <RefreshCw className="size-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <MessageSquare className="size-8 text-muted-foreground/50 mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {t("sessionManager.emptySession")}
                              </p>
                            </div>
                          ) : (
                            <div
                              style={{
                                height: virtualizer.getTotalSize(),
                                position: "relative",
                              }}
                            >
                              {virtualizer
                                .getVirtualItems()
                                .map((virtualRow) => (
                                  <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={virtualizer.measureElement}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                  >
                                    <SessionMessageItem
                                      message={messages[virtualRow.index]}
                                      isActive={
                                        activeMessageIndex === virtualRow.index
                                      }
                                      searchQuery={search}
                                      layout="default"
                                      onCopy={handleMessageCopy}
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 右侧目录 - 类似少数派 (大屏幕) */}
                      <SessionTocSidebar
                        items={userMessagesToc}
                        onItemClick={scrollToMessage}
                      />
                    </div>

                    {/* 浮动目录按钮 (小屏幕) */}
                    <SessionTocDialog
                      items={userMessagesToc}
                      onItemClick={scrollToMessage}
                      open={tocDialogOpen}
                      onOpenChange={setTocDialogOpen}
                    />
                  </CardContent>
                </>
              )}
            </Card>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={Boolean(deleteTargets)}
        title={
          deleteTargets && deleteTargets.length > 1
            ? t("sessionManager.batchDeleteConfirmTitle", {
                defaultValue: "批量删除会话",
              })
            : t("sessionManager.deleteConfirmTitle", {
                defaultValue: "删除会话",
              })
        }
        message={
          deleteTargets && deleteTargets.length > 1
            ? t("sessionManager.batchDeleteConfirmMessage", {
                defaultValue:
                  "将永久删除已选中的 {{count}} 个本地会话记录。\n\n此操作不可恢复。",
                count: deleteTargets.length,
              })
            : deleteTargets?.[0]
              ? t("sessionManager.deleteConfirmMessage", {
                  defaultValue:
                    "将永久删除本地会话“{{title}}”\nSession ID: {{sessionId}}\n\n此操作不可恢复。",
                  title: formatSessionTitle(deleteTargets[0]),
                  sessionId: deleteTargets[0].sessionId,
                })
              : ""
        }
        confirmText={
          deleteTargets && deleteTargets.length > 1
            ? t("sessionManager.batchDeleteConfirmAction", {
                defaultValue: "删除所选会话",
              })
            : t("sessionManager.deleteConfirmAction", {
                defaultValue: "删除会话",
              })
        }
        cancelText={t("common.cancel", { defaultValue: "取消" })}
        variant="destructive"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTargets(null);
          }
        }}
      />
    </TooltipProvider>
  );
}
