import { useState } from "react";
import { Field, Modal } from "../components.jsx";
import { LanguageSwitch, useI18n } from "../i18n.jsx";
import { todayKey } from "../model.js";

export default function Settings({ state, user, actions, onClose }) {
  const { t } = useI18n();
  const [armed, setArmed] = useState("");
  const [name, setName] = useState(state.name);

  function download() {
    const payload = {
      ...state,
      timer: { ...state.timer, running: false, endsAt: null },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `study-hamster-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        actions.importData(JSON.parse(String(reader.result)));
      } catch {
        actions.notify(t("settings.badFile"));
      }
    };
    reader.readAsText(file);
  }

  return (
    <Modal title={t("settings.title")} onClose={onClose}>
      <div className="stack">
        <div>
          <span className="field-label">{t("lang.label")}</span>
          <LanguageSwitch />
          <p className="quiet">{t("settings.langHint")}</p>
        </div>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            actions.setName(name);
          }}
        >
          <Field label={t("settings.name")}>
            <input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} placeholder={t("settings.namePlaceholder")} />
          </Field>
          <button className="btn ghost" type="submit">{t("settings.saveName")}</button>
        </form>

        <div>
          <span className="field-label">{t("settings.theme")}</span>
          <div className="seg" role="radiogroup" aria-label={t("settings.theme")}>
            {[
              ["light", t("settings.light")],
              ["dark", t("settings.dark")],
              ["system", t("settings.system")],
            ].map(([id, label]) => (
              <button key={id} type="button" className={state.theme === id ? "on" : ""} aria-pressed={state.theme === id} onClick={() => actions.setTheme(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Field label={t("settings.focusGoal")}>
          <input
            type="number"
            min="10"
            max="240"
            defaultValue={state.focusGoal}
            key={state.focusGoal}
            onBlur={(event) => actions.setFocusGoal(event.target.value)}
          />
        </Field>

        <label className="sound-toggle">
          <input type="checkbox" checked={state.sound} onChange={(event) => actions.setSound(event.target.checked)} />
          {t("settings.sound")}
        </label>

        <div className="settings-io">
          <button type="button" className="btn ghost" onClick={download}>{t("settings.download")}</button>
          <label className="btn ghost file-btn">
            {t("settings.openFile")}
            <input type="file" accept="application/json" onChange={onFile} />
          </label>
        </div>
        <p className="quiet">
          {user.provider === "google"
            ? t("settings.googleAccount", { login: user.login })
            : t("settings.localAccount", { login: user.login })}
        </p>
        <button type="button" className="btn ghost" onClick={actions.logout}>{t("settings.logout")}</button>

        <div className="danger-zone">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (armed === "clear") actions.clearData();
              else setArmed("clear");
            }}
          >
            {armed === "clear" ? t("settings.confirmClear") : t("settings.clear")}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (armed === "demo") actions.restoreDemo();
              else setArmed("demo");
            }}
          >
            {armed === "demo" ? t("settings.confirmDemo") : t("settings.demo")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
