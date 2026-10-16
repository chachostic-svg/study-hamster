import { useState } from "react";
import { Field, Modal, PageHeader, PrioritySwitch, SubjectInput } from "../components.jsx";
import { useI18n } from "../i18n.jsx";
import { dueLabel, priorityLabel, sortTasks, subjectColor, todayKey, xpForTask } from "../model.js";

const filters = ["open", "today", "all", "done"];

export default function Homework({ state, now, actions }) {
  const { t } = useI18n();
  const today = todayKey(new Date(now));
  const [filter, setFilter] = useState("open");
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  const visible = sortTasks(state.tasks).filter((task) => {
    if (filter === "done") return task.done;
    if (filter === "all") return true;
    if (task.done) return false;
    if (filter === "today") return task.due === today;
    return true;
  });

  function save(event) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError(t("tasks.needTitle"));
      return;
    }
    if (!draft.subject.trim()) {
      setError(t("tasks.needSubject"));
      return;
    }
    if (draft.id) actions.updateTask(draft);
    else actions.addTask(draft);
    setDraft(null);
  }

  return (
    <div>
      <PageHeader title={t("tasks.title")} text={t("tasks.text")}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setError("");
            setDraft({ title: "", subject: t("subject.default"), due: today, priority: "mid", note: "" });
          }}
        >
          {t("tasks.add")}
        </button>
      </PageHeader>

      <div className="filters" role="tablist" aria-label={t("tasks.filter")}>
        {filters.map((id) => (
          <button
            key={id}
            type="button"
            className={filter === id ? "filter on" : "filter"}
            onClick={() => setFilter(id)}
          >
            {t(`tasks.${id}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="panel">
          <p className="quiet">{t("tasks.empty")}</p>
        </div>
      ) : (
        <ul className="task-list panel plain-list">
          {visible.map((task) => (
            <li key={task.id} className={`task-row ${task.done ? "done" : ""} ${!task.done && task.due < today ? "overdue" : ""}`}>
              <input
                type="checkbox"
                checked={task.done}
                aria-label={t("tasks.check", { title: task.title })}
                onChange={() => actions.toggleTask(task.id)}
              />
              <button
                type="button"
                className="task-open"
                onClick={() => {
                  setError("");
                  setDraft(task);
                }}
              >
                <strong>{task.title}</strong>
                <span>
                  <i className="pill" style={{ "--c": subjectColor(task.subject) }}>{task.subject}</i>
                  {dueLabel(task.due, today, t)} · {priorityLabel(task.priority, t)} · +{xpForTask(task.priority)} XP
                </span>
                {task.note && <em>{task.note}</em>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <Modal title={draft.id ? t("tasks.edit") : t("tasks.create")} onClose={() => setDraft(null)}>
          <form className="stack" onSubmit={save}>
            <Field label={t("tasks.what")}>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={t("tasks.whatPlaceholder")}
                required
              />
            </Field>
            <SubjectInput value={draft.subject} onChange={(subject) => setDraft({ ...draft, subject })} />
            <Field label={t("tasks.due")}>
              <input type="date" value={draft.due} onChange={(event) => setDraft({ ...draft, due: event.target.value })} required />
            </Field>
            <PrioritySwitch value={draft.priority} onChange={(priority) => setDraft({ ...draft, priority })} />
            <Field label={t("tasks.note")}>
              <textarea
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                placeholder={t("tasks.notePlaceholder")}
              />
            </Field>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="form-actions">
              {draft.id && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    actions.deleteTask(draft.id);
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
