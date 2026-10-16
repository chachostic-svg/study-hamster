import { useState } from "react";
import {
  Empty,
  Hamster,
  XpRing,
} from "../components.jsx";
import { useI18n } from "../i18n.jsx";
import {
  addDays,
  coachLine,
  dayName,
  deadlineLabel,
  dueLabel,
  formatGap,
  formatLongDate,
  greeting,
  hamsterMood,
  isActiveDay,
  lessonPhase,
  levelInfo,
  streakCount,
  subjectColor,
  todayKey,
  toMinutes,
  upcoming,
  xpForMinutes,
  xpForTask,
} from "../model.js";
export default function Today({ state, now, actions, onNavigate }) {
  const { t } = useI18n();
  const nowDate = new Date(now);
  const today = todayKey(nowDate);
  const level = levelInfo(state.xp);
  const streak = streakCount(state.activity, today);
  const lessons = state.lessons
    .filter((lesson) => lesson.day === nowDate.getDay())
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const openTasks = state.tasks.filter((task) => !task.done);
  const shown = [...openTasks].sort((a, b) => (a.due < b.due ? -1 : 1)).slice(0, 5);
  const minutes = (state.activity[today]?.minutes) || 0;
  const goal = state.goals.find((item) => !item.done) || state.goals[0];
  const next = upcoming(state.lessons, nowDate);
  const [title, setTitle] = useState("");
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const nextLesson = next.lessons[0];
  const nextText = !nextLesson || next.when === "today"
    ? ""
    : next.when === "tomorrow"
      ? t("today.tomorrowLesson", { subject: nextLesson.subject, time: nextLesson.start })
      : t("today.soonLesson", { day: dayName(next.day, t), subject: nextLesson.subject, time: nextLesson.start });

  function addQuick(event) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    const subject = lessons.find((lesson) => lessonPhase(lesson, nowDate) !== "past")?.subject || t("subject.default");
    actions.addTask({ title: clean, subject, due: today, priority: "mid", note: "" });
    setTitle("");
  }

  return (
    <div className="today">
      <header className="hero">
        <div>
          <p className="eyebrow">{formatLongDate(nowDate, t)}</p>
          <h1>{state.name ? `${greeting(nowDate, t)}, ${state.name}` : greeting(nowDate, t)}</h1>
          <p className="lede">{t("today.lede")}</p>
        </div>
        <div className="speech-wrap">
          <Hamster mood={hamsterMood(state, nowDate)} />
          <p className="speech">{coachLine(state, today, t)}</p>
        </div>
      </header>

      {!state.name && (
        <form
          className="banner name-banner"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            actions.setName(String(data.get("name") || ""));
          }}
        >
          <div>
            <strong>{t("today.askName")}</strong>
            <p>{t("today.nameHint")}</p>
          </div>
          <input name="name" maxLength={24} placeholder={t("today.namePlaceholder")} autoComplete="nickname" />
          <button className="btn" type="submit">{t("today.remember")}</button>
        </form>
      )}

      {state.demoHint && (
        <div className="banner">
          <div>
            <strong>{t("today.demoTitle")}</strong>
            <p>{t("today.demoText")}</p>
          </div>
          <div className="banner-actions">
            <button type="button" className="btn ghost" onClick={actions.dismissDemo}>{t("today.keepDemo")}</button>
            <button type="button" className="btn" onClick={actions.clearData}>{t("today.startEmpty")}</button>
          </div>
        </div>
      )}

      <section className="stat-row">
        <button type="button" className="stat stat-button" onClick={() => onNavigate("progress")}>
          <XpRing current={level.current} need={level.need} />
          <div>
            <span>{t("nav.level", { n: level.level })}</span>
            <strong>{t("nav.xp", { current: level.current, need: level.need })}</strong>
            <small>{t("today.levelLeft", { n: level.need - level.current })}</small>
          </div>
        </button>
        <article className="stat">
          <div className="week-dots" aria-hidden="true">
            {days.map((day) => (
              <i key={day} className={isActiveDay(state.activity, day) ? "on" : ""} />
            ))}
          </div>
          <div>
            <span>{t("today.streak")}</span>
            <strong>
              {streak} {t.plural(streak, "units.day")}
            </strong>
            <small>{streak ? t("today.streakKeep") : t("today.streakStart")}</small>
          </div>
        </article>
        <button type="button" className="stat stat-button" onClick={() => onNavigate("focus")}>
          <div
            className="mini-meter"
            style={{ "--p": `${Math.min(100, Math.round((minutes / state.focusGoal) * 100))}%` }}
            aria-hidden="true"
          />
          <div>
            <span>{t("today.focusToday")}</span>
            <strong>{t("today.minutes", { n: minutes, goal: state.focusGoal })}</strong>
            <small>{t("today.roundXp", { n: xpForMinutes(state.pomodoro.focus) })}</small>
          </div>
        </button>
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>{t("today.lessons")}</h2>
            <button type="button" className="btn ghost small" onClick={() => onNavigate("schedule")}>{t("today.wholeWeek")}</button>
          </div>
          {lessons.length === 0 ? (
            <Empty
              title={t("today.noLessons")}
              text={t("today.noLessonsText")}
              action={<button type="button" className="btn" onClick={() => onNavigate("schedule")}>{t("today.openSchedule")}</button>}
            />
          ) : (
            <ul className="timeline">
              {lessons.map((lesson) => {
                const phase = lessonPhase(lesson, nowDate);
                const gap = toMinutes(lesson.start) - (nowDate.getHours() * 60 + nowDate.getMinutes());
                return (
                  <li key={lesson.id} className={`lesson-mini ${phase}`} style={{ "--c": subjectColor(lesson.subject) }}>
                    <time>{lesson.start}</time>
                    <div>
                      <strong>{lesson.subject}</strong>
                      <span>
                        {t("today.until", { time: lesson.end })}
                        {lesson.room ? ` · ${t("today.room", { room: lesson.room })}` : ""}
                        {phase === "now" ? ` · ${t("today.now")}` : ""}
                        {phase === "later" && gap > 0 && gap <= 90 ? ` · ${formatGap(gap, t)}` : ""}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {nextText && <p className="next-line">{nextText}</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>{t("today.todo")}</h2>
            <button type="button" className="btn ghost small" onClick={() => onNavigate("tasks")}>{t("today.allTasks")}</button>
          </div>
          {shown.length === 0 ? (
            <p className="quiet">{t("today.noTasks")}</p>
          ) : (
            <ul className="task-list">
              {shown.map((task) => (
                <li key={task.id} className={task.due < today ? "task-row overdue" : "task-row"}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    aria-label={t("today.check", { title: task.title })}
                    onChange={() => actions.toggleTask(task.id)}
                  />
                  <div>
                    <strong>{task.title}</strong>
                    <span>
                      <i className="pill" style={{ "--c": subjectColor(task.subject) }}>{task.subject}</i>
                      {dueLabel(task.due, today, t)} · +{xpForTask(task.priority)} XP
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form className="quick-add" onSubmit={addQuick}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("today.quick")}
              aria-label={t("today.quick")}
            />
            <button className="btn" type="submit">{t("common.add")}</button>
          </form>
          {goal && (
            <button type="button" className="goal-peek" onClick={() => onNavigate("goals")}>
              <span>{t("today.goal", { when: deadlineLabel(goal.deadline, today, t) })}</span>
              <strong>{goal.title}</strong>
              <i><b style={{ width: `${goal.progress}%` }} /></i>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
