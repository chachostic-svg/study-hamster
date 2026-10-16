import { useEffect, useRef, useState } from "react";
import { askHamster, geminiStatus, saveGeminiKey } from "../askHamster.js";
import { Field, Hamster, PageHeader } from "../components.jsx";
import { explain } from "../i18n.js";
import { useI18n } from "../i18n.jsx";
import { studyBrief } from "../studyBrief.js";

const SUGGESTIONS = ["suggestToday", "suggestTomorrow", "suggestPythagoras"];

export default function Chat({ state, now, actions }) {
  const { t } = useI18n();
  const [ready, setReady] = useState(null);
  const [keyError, setKeyError] = useState("");
  const [messages, setMessages] = useState(() => state.chat || []);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    let alive = true;
    geminiStatus()
      .then((value) => {
        if (alive) setReady(value);
      })
      .catch(() => {
        if (alive) setReady(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function connect(event) {
    event.preventDefault();
    setKeyError("");
    try {
      await saveGeminiKey(new FormData(event.currentTarget).get("key"));
      setReady(true);
    } catch (error) {
      setKeyError(explain(error, t));
    }
  }

  async function send(text) {
    const question = text.trim();
    if (!question || pending) return;
    const history = [...messages, { role: "user", text: question }].slice(-20);
    setMessages([...history, { role: "assistant", text: "" }]);
    setDraft("");
    setPending(true);
    try {
      const answer = await askHamster(history, studyBrief(state, now, t.lang), (full) => {
        setMessages([...history, { role: "assistant", text: full }]);
      });
      const done = [...history, { role: "assistant", text: answer || t("chat.silent") }];
      setMessages(done);
      actions.setChat(done);
    } catch (error) {
      const done = [...history, {
        role: "assistant",
        text: explain(error, t),
      }];
      setMessages(done);
      actions.setChat(done);
    } finally {
      setPending(false);
    }
  }

  if (ready === null) {
    return (
      <div>
        <PageHeader title={t("chat.title")} text={t("chat.checking")} />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="chat-setup">
        <Hamster mood="happy" />
        <PageHeader title={t("chat.title")} text={t("chat.setup")} />
        <form className="stack panel chat-key" onSubmit={connect}>
          <Field label={t("chat.key")}>
            <input name="key" autoComplete="off" spellCheck="false" placeholder="AQ.…" required />
          </Field>
          <p className="quiet">
            {t("chat.keyBefore")}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>
            {t("chat.keyAfter")}
          </p>
          {keyError && <p className="error" role="alert">{keyError}</p>}
          <button className="btn" type="submit">{t("chat.connect")}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <PageHeader title={t("chat.title")} text={t("chat.intro")}>
        {messages.length > 0 && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setMessages([]);
              actions.setChat([]);
            }}
          >
            {t("chat.clear")}
          </button>
        )}
      </PageHeader>
      <div className="chat-log" ref={logRef} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Hamster mood="happy" />
            <p>{t("chat.empty")}</p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((item) => (
                <button key={item} type="button" className="btn ghost small" onClick={() => send(t(`chat.${item}`))}>{t(`chat.${item}`)}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <p key={`${message.role}-${index}`} className={message.role === "user" ? "bubble user" : "bubble hamster"}>
            {message.text || (pending && index === messages.length - 1 ? t("chat.thinking") : "")}
          </p>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <textarea
          rows={2}
          value={draft}
          placeholder={t("chat.placeholder")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button className="btn" type="submit" disabled={pending || !draft.trim()}>
          {pending ? t("common.wait") : t("chat.ask")}
        </button>
      </form>
    </div>
  );
}
