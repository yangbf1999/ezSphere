import { useTranslation } from "react-i18next";

/** 对齐 ezSphere sessions.html：页面标题 + sub */
export function SessionsPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="sessions-page-head !block">
      <h1 className="!mb-4">{t("sessionManager.title")}</h1>
      <p className="sub">{t("sessionManager.subtitle")}</p>
    </div>
  );
}
