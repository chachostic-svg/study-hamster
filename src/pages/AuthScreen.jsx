import { useEffect, useRef, useState } from "react";
import { Field, Hamster } from "../components.jsx";
import { hasAccounts, register, signIn, signInWithGoogle } from "../auth.js";
import {
  clearGoogleClientId,
  googleClientId,
  googleClientSource,
  mountGoogleButton,
  saveGoogleClientId,
} from "../google.js";
import { explain } from "../i18n.js";
import { LanguageSwitch, useI18n } from "../i18n.jsx";

function GoogleAccess({ disabled, onCredential, onError }) {
  const { t, lang } = useI18n();
  const host = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  });
  const [clientId, setClientId] = useState(() => googleClientId());
  const [source, setSource] = useState(() => googleClientSource());
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    if (!clientId || !host.current) return undefined;
    let alive = true;
    const mount = mountGoogleButton(host.current, clientId, (credential) => onCredentialRef.current(credential), lang);
    mount.ready.catch(() => {
      if (alive) onErrorRef.current("google.script");
    });
    return () => {
      alive = false;
      mount.cancel();
    };
  }, [clientId, lang]);

  if (!clientId) {
    return (
      <form
        className="stack google-setup"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            const id = saveGoogleClientId(new FormData(event.currentTarget).get("clientId"));
            setSetupError("");
            setClientId(id);
            setSource("saved");
          } catch (reason) {
            setSetupError(reason instanceof Error ? reason.message : "google.save");
          }
        }}
      >
        <Field label={t("auth.clientId")}>
          <input name="clientId" autoComplete="off" spellCheck="false" placeholder="….apps.googleusercontent.com" required />
        </Field>
        <p className="quiet">
          {t("auth.clientHint", { origin: window.location.origin })}
        </p>
        {setupError && <p className="error" role="alert">{explain(new Error(setupError), t)}</p>}
        <button className="btn ghost wide" type="submit">{t("auth.connect")}</button>
      </form>
    );
  }

  return (
    <div className="google-slot">
      <div ref={host} className={disabled ? "google-btn is-off" : "google-btn"} />
      {source === "saved" && (
        <button
          type="button"
          className="text-btn compact"
          onClick={() => {
            clearGoogleClientId();
            setClientId(googleClientId());
            setSource(googleClientSource());
          }}
        >
          {t("auth.otherClient")}
        </button>
      )}
    </div>
  );
}

export default function AuthScreen({ onEnter }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(() => (hasAccounts() ? "login" : "register"));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const user = isRegister
        ? await register({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
          confirm: data.get("confirm"),
        })
        : await signIn({
          email: data.get("email"),
          password: data.get("password"),
        });
      onEnter(user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "auth.enter");
    } finally {
      setPending(false);
    }
  }

  async function onGoogle(credential) {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      onEnter(await signInWithGoogle(credential));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "auth.googleEnter");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-card">
        <div className="auth-lang"><LanguageSwitch /></div>
        <Hamster mood="happy" />
        <p className="eyebrow">{t("app.name")}</p>
        <h1>{isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}</h1>
        <p className="quiet">{t("auth.lede")}</p>
        <GoogleAccess disabled={pending} onCredential={onGoogle} onError={setError} />
        <p className="or-line">{t("auth.or")}</p>
        <form className="stack" onSubmit={submit}>
          {isRegister && (
            <Field label={t("auth.name")}>
              <input name="name" maxLength={24} autoComplete="nickname" placeholder={t("auth.namePlaceholder")} required />
            </Field>
          )}
          <Field label={t("auth.email")}>
            <input name="email" type="email" autoComplete="email" placeholder="mira@mail.com" required />
          </Field>
          <Field label={t("auth.password")}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </Field>
          {isRegister && (
            <Field label={t("auth.confirm")}>
              <input name="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" required />
            </Field>
          )}
          <label className="sound-toggle">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
            {t("auth.showPassword")}
          </label>
          {error && <p className="error" role="alert">{explain(new Error(error), t)}</p>}
          {pending && <p className="quiet">{t("auth.opening")}</p>}
          <button className="btn wide" type="submit" disabled={pending}>
            {pending ? t("common.wait") : isRegister ? t("auth.submitRegister") : t("auth.submitLogin")}
          </button>
        </form>
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setError("");
          }}
        >
          {isRegister ? t("auth.toLogin") : t("auth.toRegister")}
        </button>
      </section>
    </main>
  );
}
