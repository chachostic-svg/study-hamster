import { useState } from "react";
import { Field, Modal, PageHeader } from "../components.jsx";
import { useI18n } from "../i18n.jsx";
import { addDays, deadlineLabel, todayKey } from "../model.js";

function blankGoal(today) {
  return {
    title: "",
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    deadline: addDays(today, 14),
  };
}

const smart = ["specific", "measurable", "achievable", "relevant"];

export default function Goals({ state, now, actions }) {
  const { t } = useI18n();
  const today = todayKey(new Date(now));
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const goals = [...state.goals].sort((a, b) => Number(a.done) - Number(b.done) || a.deadline.localeCompare(b.deadline));

  function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError(t("goals.needTitle"));
      return;
    }
    if (draft.id) actions.updateGoal(draft);
    else actions.addGoal(draft);
    setDraft(null);
  }

  return (
    <div>
      <PageHeader
        title={t("goals.title")}
        text={t("goals.text")}
      >
        <button
          type="button"
          className="btn"
          onClick={() => {
            setError("");
            setDraft(blankGoal(today));
          }}
        >
          {t("goals.add")}
        </button>
      </PageHeader>

      {goals.length === 0 ? (
        <section className="panel">
          <p className="quiet">{t("goals.empty")}</p>
        </section>
      ) : (
        <div className="goal-grid">
          {goals.map((goal) => {
            const late = !goal.done && goal.deadline < today;
            return (
              <article key={goal.id} className={goal.done ? "goal done" : late ? "goal late" : "goal"}>
                <header>
                  <button type="button" className="text-link" onClick={() => { setError(""); setDraft(goal); }}>
                    {goal.title}
                  </button>
                  <span>{deadlineLabel(goal.deadline, today, t)}</span>
                </header>
                <label className="range">
                  <span>{goal.done ? t("goals.done") : t("goals.progress", { n: goal.progress })}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    aria-label={t("goals.progressLabel", { title: goal.title })}
                    onChange={(event) => actions.setGoalProgress(goal.id, Number(event.target.value))}
                  />
                </label>
                <ul className="smart">
                  {smart.map((key) => (
                    goal[key] ? (
                      <li key={key}>
                        <i>{t(`goals.${key}`).slice(0, 1)}</i>
                        <span>{goal[key]}</span>
                      </li>
                    ) : null
                  ))}
                  <li>
                    <i>T</i>
                    <span>{new Intl.DateTimeFormat(t.locale, { day: "numeric", month: "long" }).format(new Date(`${goal.deadline}T00:00:00`))}</span>
                  </li>
                </ul>
                {!goal.done && (
                  <button type="button" className="btn ghost small" onClick={() => actions.setGoalProgress(goal.id, 100)}>
                    {t("goals.reached")}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      {draft && (
        <Modal title={draft.id ? t("goals.edit") : t("goals.create")} onClose={() => setDraft(null)}>
          <form className="stack" onSubmit={save}>
            <p className="quiet">{t("goals.hint")}</p>
            <Field label={t("goals.name")}>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={t("goals.namePlaceholder")}
                required
              />
            </Field>
            {smart.map((key) => (
              <Field key={key} label={t(`goals.${key}`)}>
                <input
                  value={draft[key]}
                  placeholder={t(`goals.${key}Placeholder`)}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                />
              </Field>
            ))}
            <Field label={t("goals.deadline")}>
              <input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} required />
            </Field>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="form-actions">
              {draft.id && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    actions.deleteGoal(draft.id);
                    setDraft(null);
                  }}
                >
                  {t("common.delete")}
                </button>
              )}
              <button className="btn" type="submit">{t("common.save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
