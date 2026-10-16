import { Field, PageHeader, SubjectInput } from "../components.jsx";
import { useI18n } from "../i18n.jsx";
import { focusHint, formatClock, modeMinutes, remainingSeconds, todayKey, xpForMinutes } from "../model.js";

const modes = ["focus", "short", "long"];

export default function Focus({ state, now, actions }) {
  const { t } = useI18n();
  const timer = state.timer;
  const total = modeMinutes(state) * 60;
  const left = remainingSeconds(timer, now);
  const ratio = total ? Math.max(0, Math.min(1, left / total)) : 0;
  const radius = 96;
  const length = 2 * Math.PI * radius;
  const today = todayKey(new Date(now));
  const sessions = state.sessions.filter((session) => session.date === today);
  const minutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const full = !timer.running && left < total - 1;
  const reward = xpForMinutes(state.pomodoro.focus);

  return (
    <div>
      <PageHeader title={t("focus.title")} text={t("focus.text")} />
      <div className="timer-layout">
        <section className="panel timer-card">
          <div className="mode-switch" role="tablist" aria-label={t("focus.modes")}>
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={timer.running}
                className={timer.mode === mode ? "on" : ""}
                onClick={() => actions.setTimerMode(mode)}
              >
                {t(`focus.${mode}`)}
              </button>
            ))}
          </div>
          <div className="timer-stage">
            <svg viewBox="0 0 220 220" className={`ring mode-${timer.mode}`} aria-hidden="true">
              <circle className="ring-track" cx="110" cy="110" r={radius} />
              <circle
                className="ring-value"
                cx="110"
                cy="110"
                r={radius}
                strokeDasharray={length}
                strokeDashoffset={length * (1 - ratio)}
              />
            </svg>
            <div className="time-readout">
              <strong>{formatClock(left)}</strong>
              <span>{timer.mode === "focus" ? timer.subject : timer.mode === "long" ? t("focus.longBreak") : t("focus.shortBreak")}</span>
            </div>
          </div>
          <div className="cycles" aria-label={t("focus.cycles")}>
            {[0, 1, 2, 3].map((index) => (
              <i key={index} className={timer.mode === "long" || index < timer.cycle % 4 ? "on" : ""} />
            ))}
          </div>
          <p className="quiet center">{focusHint(timer, left, total, t)}</p>
          {timer.mode === "focus" && (
            <SubjectInput value={timer.subject} onChange={actions.setTimerSubject} label={t("focus.subject")} required={false} />
          )}
          <div className="timer-actions">
            <button type="button" className="btn big" onClick={timer.running ? actions.pauseTimer : actions.startTimer}>
              {timer.running ? t("focus.pause") : full ? t("focus.resume") : timer.mode === "focus" ? t("focus.startFocus") : t("focus.startBreak")}
            </button>
            <button type="button" className="btn ghost" onClick={actions.resetTimer}>{t("focus.reset")}</button>
          </div>
          <p className="quiet center">{t("focus.reward", { n: reward })}</p>
          <label className="sound-toggle">
            <input type="checkbox" checked={state.sound} onChange={(event) => actions.setSound(event.target.checked)} />
            {t("focus.sound")}
          </label>
        </section>

        <aside className="panel">
          <div className="panel-head">
            <h2>{t("focus.today")}</h2>
            <span className="quiet">{t("focus.minutes", { n: minutes })}</span>
          </div>
          <form
            className="stack compact"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              actions.setPomodoro({
                focus: data.get("focus"),
                short: data.get("short"),
                long: data.get("long"),
              });
            }}
          >
            <div className="row-3">
              <Field label={t("focus.focusMin")}>
                <input name="focus" type="number" min="1" max="90" defaultValue={state.pomodoro.focus} key={`f-${state.pomodoro.focus}`} />
              </Field>
              <Field label={t("focus.shortMin")}>
                <input name="short" type="number" min="1" max="30" defaultValue={state.pomodoro.short} key={`s-${state.pomodoro.short}`} />
              </Field>
              <Field label={t("focus.longMin")}>
                <input name="long" type="number" min="1" max="45" defaultValue={state.pomodoro.long} key={`l-${state.pomodoro.long}`} />
              </Field>
            </div>
            <button className="btn ghost" type="submit">{t("focus.saveLengths")}</button>
          </form>
          {sessions.length === 0 ? (
            <p className="quiet">{t("focus.noSessions")}</p>
          ) : (
            <ul className="session-list">
              {sessions.map((session) => (
                <li key={session.id}>
                  <strong>{session.subject}</strong>
                  <span>
                    {t("focus.session", { n: session.minutes })} · {new Intl.DateTimeFormat(t.locale, { hour: "2-digit", minute: "2-digit" }).format(session.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
