import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light" as const, icon: Sun, labelKey: "settings.themeLight" },
  { value: "dark" as const, icon: Moon, labelKey: "settings.themeDark" },
  { value: "system" as const, icon: Monitor, labelKey: "settings.themeSystem" },
];

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn("theme-toggle", className)}
      role="group"
      aria-label={t("settings.theme")}
    >
      {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            data-theme={value}
            aria-pressed={active}
            aria-label={t(labelKey)}
            className={cn(active && "active")}
            onClick={() => setTheme(value)}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
