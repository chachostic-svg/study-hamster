import { PageHeader, XpRing } from "../components.jsx";
import { useI18n } from "../i18n.jsx";
import {
  ACHIEVEMENTS,
  addDays,
  bestStreak,
  levelInfo,
  parseKey,
  statsOf,
  streakCount,
  todayKey,
} from "../model.js";

export default function Progress({ state, now }) {
  const { t } = useI18n();
  const today = todayKey(new Date(now));
  const level = levelInfo(state.xp);
  const stats = statsOf(state, today);
  const best = bestStreak(state.activity);
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const max = Math.max(30, ...days.map((day) => state.activity[day]?.minutes || 0));
  const leftTasks = Math.max(1, Math.ceil((level.need - level.current) / 25));
  const unlocked = new Set(state.unlocked);

  return (
    <div>
      <PageHeader title={t("progress.title")} text={t("progress.text")} />
      <section className="level-hero panel">
        <XpRing current={level.current} need={level.need} size={120} />
        <div>
          <p className="eyebrow">{t("progress.level", { n: level.level })}</p>
          <h2>{t("progress.left", { name: state.name ? `${state.name}, ` : "", n: level.need - level.current })}</h2>
          <p>{t("progress.about", { n: leftTasks, unit: t.plural(leftTasks, "units.regularTask") })}</p>
        </div>
      </section>

      <section className="stat-row four">
        <article className="stat">
          <span>{t("progress.tasks")}</span>
          <strong>{stats.tasksDone}</strong>
          <small>{t("progress.closed")}</small>
        </article>
        <article className="stat">
          <span>{t("progress.focus")}</span>
          <strong>{stats.minutes}</strong>
          <small>{t.plural(stats.minutes, "units.minute")}</small>
        </article>
        <article className="stat">
          <span>{t("progress.goals")}</span>
          <strong>{stats.goalsDone}</strong>
          <small>{t("progress.of", { n: stats.goals })}</small>
        </article>
        <article className="stat">
          <span>{t("progress.streak")}</span>
          <strong>{streakCount(state.activity, today)}</strong>
          <small>{t("progress.best", { n: best })}</small>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>{t("progress.week")}</h2>
          <span className="quiet">{t("progress.minutes")}</span>
        </div>
        <div className="chart">
          {days.map((day) => {
            const minutes = state.activity[day]?.minutes || 0;
            const tasks = state.activity[day]?.tasks || 0;
            const height = Math.round((minutes / max) * 100);
            const label = new Intl.DateTimeFormat(t.locale, { weekday: "short" }).format(parseKey(day));
            return (
              <div key={day} className={day === today ? "chart-col today" : "chart-col"}>
                <div className="chart-bar-wrap" title={t("progress.chart", { minutes, tasks })}>
                  <div className="chart-bar" style={{ height: `${minutes ? Math.max(8, height) : 0}%` }} />
                </div>
                <span>{label}</span>
                <small>{tasks ? t("progress.tasksShort", { n: tasks }) : ""}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>{t("progress.badges")}</h2>
          <span className="quiet">{t("progress.count", { n: state.unlocked.length, total: ACHIEVEMENTS.length })}</span>
        </div>
        <div className="badges">
          {ACHIEVEMENTS.map((item) => {
            const open = unlocked.has(item.id);
            return (
              <article key={item.id} className={open ? "badge" : "badge locked"}>
                <span className="badge-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{t(`ach.${item.id}.title`)}</strong>
                  <p>{t(`ach.${item.id}.text`)}</p>
                  <small>{open ? t("progress.open") : `+${item.bonus} XP`}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
