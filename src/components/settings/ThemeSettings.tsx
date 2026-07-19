import type { KeyboardEvent } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme-provider";

type ThemeOption = "light" | "dark" | "system";
const THEME_OPTIONS: ThemeOption[] = ["light", "dark", "system"];

export function ThemeSettings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const activeIndex = THEME_OPTIONS.indexOf(theme);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    option: ThemeOption,
  ) => {
    const currentIndex = THEME_OPTIONS.indexOf(option);
    const lastIndex = THEME_OPTIONS.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
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
    setTheme(THEME_OPTIONS[nextIndex]);
    const radios =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      );
    radios?.[nextIndex]?.focus();
  };

  return (
    <section className="card section">
      <header className="card-header section-head">
        <Moon className="sec-ic" aria-hidden />
        <div>
          <h3>{t("settings.theme")}</h3>
          <p className="sec-desc">{t("settings.themeHint")}</p>
        </div>
      </header>
      <div className="radio-group" role="radiogroup">
        <ThemeButton
          active={theme === "light"}
          tabIndex={activeIndex === 0 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "light")}
          onClick={() => setTheme("light")}
          icon={Sun}
        >
          {t("settings.themeLight")}
        </ThemeButton>
        <ThemeButton
          active={theme === "dark"}
          tabIndex={activeIndex === 1 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "dark")}
          onClick={() => setTheme("dark")}
          icon={Moon}
        >
          {t("settings.themeDark")}
        </ThemeButton>
        <ThemeButton
          active={theme === "system"}
          tabIndex={activeIndex === 2 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "system")}
          onClick={() => setTheme("system")}
          icon={Monitor}
        >
          {t("settings.themeSystem")}
        </ThemeButton>
      </div>
    </section>
  );
}

interface ThemeButtonProps {
  active: boolean;
  tabIndex?: number;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function ThemeButton({
  active,
  tabIndex,
  onKeyDown,
  onClick,
  icon: Icon,
  children,
}: ThemeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="radio"
      aria-checked={active}
      tabIndex={tabIndex ?? (active ? 0 : -1)}
      className={`radio-btn${active ? " active" : ""}`}
    >
      <Icon aria-hidden />
      {children}
    </button>
  );
}
