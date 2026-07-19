import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { AppSwitcher } from "@/components/AppSwitcher";
import {
  AppToolStatusPanel,
  type AppToolInstallRequest,
} from "@/components/providers/AppToolStatusPanel";
import { ProviderList } from "@/components/providers/ProviderList";
import { ClaudeDesktopRouteToggle } from "@/components/proxy/ClaudeDesktopRouteToggle";
import { ProxyToggle } from "@/components/proxy/ProxyToggle";
import { FailoverToggle } from "@/components/proxy/FailoverToggle";
import { isTextEditableTarget } from "@/utils/domUtils";
import type { ComponentProps } from "react";

type ProviderListProps = ComponentProps<typeof ProviderList>;

interface ProvidersPageProps extends ProviderListProps {
  onSwitchApp: (app: AppId) => void;
  visibleApps?: VisibleApps;
  onAddProvider: () => void;
  onOpenInstall: (request: AppToolInstallRequest) => void;
  showProxyToggles: boolean;
  enableLocalProxy?: boolean;
  enableFailoverToggle?: boolean;
}

export function ProvidersPage({
  onSwitchApp,
  visibleApps,
  onAddProvider,
  onOpenInstall,
  showProxyToggles,
  enableLocalProxy,
  enableFailoverToggle,
  providers,
  appId,
  ...providerListProps
}: ProvidersPageProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const providerCount = Object.keys(providers).length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "f") {
        if (isTextEditableTarget(document.activeElement)) return;
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (key === "escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="providers-page flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-6">
      <div className="prov-toolbar">
        <h1>{t("nav.apps")}</h1>
        {showProxyToggles && (
          <div className="prov-subtools">
            {appId === "claude-desktop" ? (
              <ClaudeDesktopRouteToggle className="prov-toggle" />
            ) : (
              enableLocalProxy && (
                <ProxyToggle activeApp={appId} className="prov-toggle" />
              )
            )}
            {appId !== "claude-desktop" && enableFailoverToggle && (
              <FailoverToggle activeApp={appId} className="prov-toggle" />
            )}
          </div>
        )}
        <div className="spacer" />
       {/* <div className="prov-search">
          <Search className="h-4 w-4" />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("provider.searchPlaceholder", {
              defaultValue: "搜索模型或 key…",
            })}
            aria-label={t("provider.searchAriaLabel", {
              defaultValue: "Search providers",
            })}
          />
        </div>  
        <button
          type="button"
          className="prov-btn prov-btn-primary"
          onClick={onAddProvider}
        >
          <Plus />
          {t("provider.addProvider")}
        </button>*/}
      
      </div>

      <AppSwitcher
        activeApp={appId}
        onSwitch={onSwitchApp}
        visibleApps={visibleApps}
        variant="tabs"
        activeCount={providerCount}
      />

      <AppToolStatusPanel
        appId={appId}
        visibleApps={visibleApps}
        onOpenInstall={onOpenInstall}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-8">
        <ProviderList
          {...providerListProps}
          providers={providers}
          appId={appId}
          onCreate={onAddProvider}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      </div>
    </div>
  );
}
