import { createContext, useContext, useMemo, useState } from "react";
import { LANG_KEY, applyLanguage, makeT, readLanguage } from "./i18n.js";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readLanguage);

  const setLang = (next) => {
    const value = next === "en" ? "en" : "ru";
    try {
      localStorage.setItem(LANG_KEY, value);
    } catch {
      /* private mode */
    }
    applyLanguage(value);
    setLangState(value);
  };

  const t = useMemo(() => makeT(lang), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("i18n");
  return value;
}

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switch" role="radiogroup" aria-label={t("lang.label")}>
      <button type="button" className={lang === "ru" ? "on" : ""} aria-pressed={lang === "ru"} onClick={() => setLang("ru")}>
        Русский
      </button>
      <button type="button" className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
        English
      </button>
    </div>
  );
}
