import { useState } from "react";
import { Field, Modal, PageHeader, SubjectInput } from "../components.jsx";
import { useI18n } from "../i18n.jsx";
import { DAYS, dateForWeekday, lessonPhase, subjectColor, toMinutes, uid } from "../model.js";

export default function Schedule({ state, now, actions }) {
  const { t } = useI18n();
  const nowDate = new Date(now);
  const todayId = nowDate.getDay();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  function openNew(day) {
    setError("");
    setDraft({
      subject: t("subject.default"),
      day: day || 1,
      start: "08:30",
      end: "09:15",
      room: "",
    });
  }

  function save(event) {
    event.preventDefault();
    const subject = draft.subject.trim();
    if (!subject) {
      setError(t("schedule.needSubject"));
      return;
    }
    if (toMinutes(draft.end) <= toMinutes(draft.start)) {
      setError(t("schedule.badTime"));
      return;
    }
    const lesson = { ...draft, subject, room: draft.room.trim() };
    if (draft.id) actions.updateLesson(lesson);
    else actions.addLesson({ ...lesson, id: uid() });
    setDraft(null);
  }

  return (
    <div>
      <PageHeader title={t("schedule.title")} text={t("schedule.text")}>
        <button type="button" className="btn" onClick={() => openNew(todayId >= 1 && todayId <= 6 ? todayId : 1)}>
          {t("schedule.add")}
        </button>
      </PageHeader>
      <div className="week">
        {DAYS.map((day) => {
          const date = dateForWeekday(day.id, nowDate);
          const lessons = state.lessons
            .filter((lesson) => lesson.day === day.id)
            .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
          return (
            <section key={day.id} className={day.id === todayId ? "day-col today" : "day-col"}>
              <header className="day-head">
                <div>
                  <strong>{t(`day.${day.id}.short`)}</strong>
                  <span>{date.getDate()}</span>
                </div>
                <button type="button" className="icon-btn" onClick={() => openNew(day.id)} aria-label={t("schedule.addDay", { day: t(`day.${day.id}.long`) })}>
                  +
                </button>
              </header>
              {lessons.length === 0 && <p className="quiet">{t("schedule.empty")}</p>}
              {lessons.map((lesson) => {
                const phase = lessonPhase(lesson, nowDate);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`lesson ${phase}`}
                    style={{ "--c": subjectColor(lesson.subject) }}
                    onClick={() => {
                      setError("");
                      setDraft(lesson);
                    }}
                  >
                    <span>{lesson.start}–{lesson.end}</span>
                    <strong>{lesson.subject}</strong>
                    {lesson.room && <em>{t("schedule.room", { room: lesson.room })}</em>}
                    {phase === "now" && <b>{t("schedule.now")}</b>}
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>

      {draft && (
        <Modal title={draft.id ? t("schedule.lesson") : t("schedule.newLesson")} onClose={() => setDraft(null)}>
          <form className="stack" onSubmit={save}>
            <SubjectInput value={draft.subject} onChange={(subject) => setDraft({ ...draft, subject })} />
            <div className="seg day-seg" role="radiogroup" aria-label={t("schedule.weekday")}>
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  className={draft.day === day.id ? "on" : ""}
                  aria-pressed={draft.day === day.id}
                  onClick={() => setDraft({ ...draft, day: day.id })}
                >
                  {t(`day.${day.id}.short`)}
                </button>
              ))}
            </div>
            <div className="row-2">
              <Field label={t("schedule.start")}>
                <input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} required />
              </Field>
              <Field label={t("schedule.end")}>
                <input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} required />
              </Field>
            </div>
            <Field label={t("schedule.roomField")}>
              <input value={draft.room} onChange={(event) => setDraft({ ...draft, room: event.target.value })} placeholder={t("schedule.roomOptional")} />
            </Field>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="form-actions">
              {draft.id && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    actions.deleteLesson(draft.id);
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
