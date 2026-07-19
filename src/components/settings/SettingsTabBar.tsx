import type { KeyboardEvent } from "react";
import { Activity, Info, Lock, Settings, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SettingsTabId =
  | "general"
  | "proxy"
  | "auth"
  | "advanced"
  | "usage"
  | "about";

interface SettingsTabBarProps {
  activeTab: SettingsTabId;
  onChange: (tab: SettingsTabId) => void;
}

const TAB_ITEMS: Array<{
  id: SettingsTabId;
  labelKey: string;
  defaultLabel: string;
  icon: typeof Settings;
}> = [
  {
    id: "general",
    labelKey: "settings.tabGeneral",
    defaultLabel: "通用",
    icon: Settings,
  },
  {
    id: "proxy",
    labelKey: "settings.tabProxy",
    defaultLabel: "路由",
    icon: Activity,
  },
  // {
  //   id: "auth",
  //   labelKey: "settings.tabAuth",
  //   defaultLabel: "认证",
  //   icon: Lock,
  // },
  {
    id: "advanced",
    labelKey: "settings.tabAdvanced",
    defaultLabel: "高级",
    icon: Star,
  },
  {
    id: "about",
    labelKey: "common.about",
    defaultLabel: "关于",
    icon: Info,
  },
];

/** Aligns with settings.html: pill-tabs settings-tabs. */
export function SettingsTabBar({ activeTab, onChange }: SettingsTabBarProps) {
  const { t } = useTranslation();

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    id: SettingsTabId,
  ) => {
    const currentIndex = TAB_ITEMS.findIndex((item) => item.id === id);
    if (currentIndex < 0) return;

    const lastIndex = TAB_ITEMS.length - 1;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = TAB_ITEMS[nextIndex].id;
    onChange(nextTab);
    const tabs =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      );
    tabs?.[nextIndex]?.focus();
  };

  return (
    <div className="settings-tabs" role="tablist">
      {TAB_ITEMS.map(({ id, labelKey, defaultLabel, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          tabIndex={activeTab === id ? 0 : -1}
          className={`settings-tab${activeTab === id ? " active" : ""}`}
          data-set={id}
          onClick={() => onChange(id)}
          onKeyDown={(event) => handleKeyDown(event, id)}
        >
          <Icon className="sic" strokeWidth={2} aria-hidden />
          {t(labelKey, { defaultValue: defaultLabel })}
        </button>
      ))}
    </div>
  );
}

interface SettingsPaneHeaderProps {
  tab: SettingsTabId;
}

const PANE_COPY: Record<
  SettingsTabId,
  { titleKey: string; titleDefault: string; subKey: string; subDefault: string }
> = {
  general: {
    titleKey: "settings.paneGeneralTitle",
    titleDefault: "通用设置",
    subKey: "settings.paneGeneralSub",
    subDefault: "语言、主题、应用可见性、技能存储、窗口与终端等基础偏好",
  },
  proxy: {
    titleKey: "settings.paneProxyTitle",
    titleDefault: "路由",
    subKey: "settings.paneProxySub",
    subDefault: "代理服务、故障转移、请求纠正与全局代理",
  },
  auth: {
    titleKey: "settings.paneAuthTitle",
    titleDefault: "认证",
    subKey: "settings.paneAuthSub",
    subDefault: "集中管理需要 OAuth 的模型认证",
  },
  advanced: {
    titleKey: "settings.paneAdvancedTitle",
    titleDefault: "高级",
    subKey: "settings.paneAdvancedSub",
    subDefault: "配置目录、数据备份、云同步、模型测试与日志",
  },
  usage: {
    titleKey: "settings.paneUsageTitle",
    titleDefault: "用量统计",
    subKey: "settings.paneUsageSub",
    subDefault: "查看 API 调用用量、成本与模型测试记录",
  },
  about: {
    titleKey: "settings.paneAboutTitle",
    titleDefault: "关于",
    subKey: "settings.paneAboutSub",
    subDefault: "版本信息与更新检查",
  },
};

export function SettingsPaneHeader({ tab }: SettingsPaneHeaderProps) {
  const { t } = useTranslation();
  const copy = PANE_COPY[tab];

  return (
    <>
      <h1 className="pane-title !mb-4">
        {t(copy.titleKey, { defaultValue: copy.titleDefault })}
      </h1>
      <p className="pane-sub !mb-4">
        {t(copy.subKey, { defaultValue: copy.subDefault })}
      </p>
    </>
  );
}
