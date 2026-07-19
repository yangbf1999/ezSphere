import type { KeyboardEvent } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

type LanguageOption = "zh" | "zh-TW" | "en" | "ja";
const LANGUAGE_OPTIONS: LanguageOption[] = ["zh", "zh-TW", "en", "ja"];

interface LanguageSettingsProps {
  value: LanguageOption;
  onChange: (value: LanguageOption) => void;
}

export function LanguageSettings({ value, onChange }: LanguageSettingsProps) {
  const { t } = useTranslation();
  const activeIndex = LANGUAGE_OPTIONS.indexOf(value);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    option: LanguageOption,
  ) => {
    const currentIndex = LANGUAGE_OPTIONS.indexOf(option);
    const lastIndex = LANGUAGE_OPTIONS.length - 1;
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
    onChange(LANGUAGE_OPTIONS[nextIndex]);
    const radios =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      );
    radios?.[nextIndex]?.focus();
  };

  return (
    <section className="card section">
      <header className="card-header section-head">
        <Languages className="sec-ic" aria-hidden />
        <div>
          <h3>{t("settings.language")}</h3>
          <p className="sec-desc">{t("settings.languageHint")}</p>
        </div>
      </header>
      <div className="radio-group" role="radiogroup">
        <LanguageButton
          active={value === "zh"}
          tabIndex={activeIndex === 0 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "zh")}
          onClick={() => onChange("zh")}
        >
          {t("settings.languageOptionChinese")}
        </LanguageButton>
        <LanguageButton
          active={value === "zh-TW"}
          tabIndex={activeIndex === 1 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "zh-TW")}
          onClick={() => onChange("zh-TW")}
        >
          {t("settings.languageOptionTraditionalChinese")}
        </LanguageButton>
        <LanguageButton
          active={value === "en"}
          tabIndex={activeIndex === 2 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "en")}
          onClick={() => onChange("en")}
        >
          {t("settings.languageOptionEnglish")}
        </LanguageButton>
        <LanguageButton
          active={value === "ja"}
          tabIndex={activeIndex === 3 ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, "ja")}
          onClick={() => onChange("ja")}
        >
          {t("settings.languageOptionJapanese")}
        </LanguageButton>
      </div>
    </section>
  );
}

interface LanguageButtonProps {
  active: boolean;
  tabIndex?: number;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick: () => void;
  children: React.ReactNode;
}

function LanguageButton({
  active,
  tabIndex,
  onKeyDown,
  onClick,
  children,
}: LanguageButtonProps) {
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
      {children}
    </button>
  );
}
