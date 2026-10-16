import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { readThemeForSession } from "./auth.js";
import { applyLanguage, readLanguage } from "./i18n.js";
import { I18nProvider } from "./i18n.jsx";
import { resolveTheme } from "./model.js";
import "./index.css";

applyLanguage(readLanguage());
try {
  document.documentElement.dataset.theme = resolveTheme(readThemeForSession());
} catch {
  document.documentElement.dataset.theme = "light";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
