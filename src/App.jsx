import { useEffect, useRef, useState } from "react";
import { currentUser, logout, renameAccount } from "./auth.js";
import { Icon, XpRing } from "./components.jsx";
import { LanguageSwitch, useI18n } from "./i18n.jsx";
import {
  ACHIEVEMENTS,
  clamp,
  commitRewards,
  emptyState,
  finishTimer,
  formatClock,
  hydrate,
  levelInfo,
  loadState,
  pauseTimer,
  remainingSeconds,
  rememberChime,
  resetTimer,
  resolveTheme,
  saveState,
  selectMode,
  setGoalProgress,
  startTimer,
  starterState,
  streakCount,
  takeChime,
  todayKey,
  toggleTask,
  uid,
  updatePomodoro,
} from "./model.js";
import Chat from "./pages/Chat.jsx";
import Focus from "./pages/Focus.jsx";
import Goals from "./pages/Goals.jsx";
import Homework from "./pages/Homework.jsx";
import Progress from "./pages/Progress.jsx";
import Schedule from "./pages/Schedule.jsx";
import Settings from "./pages/Settings.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import Today from "./pages/Today.jsx";

const NAV = [
  { id: "today", icon: "today" },
  { id: "schedule", icon: "schedule" },
  { id: "tasks", icon: "tasks" },
  { id: "focus", icon: "focus" },
  { id: "goals", icon: "goals" },
  { id: "progress", icon: "progress" },
  { id: "chat", icon: "chat" },
];

export default function App() {
  const [user, setUser] = useState(() => currentUser());

  useEffect(() => {
    if (!user) document.documentElement.dataset.theme = resolveTheme("system");
  }, [user]);

  if (!user) return <AuthScreen onEnter={setUser} />;
  return (
    <StudyApp
      key={user.id}
      user={user}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}

function StudyApp({ user, onLogout }) {
  const { t } = useI18n();
  const [state, setState] = useState(() => finishTimer(loadState(user.id)));
  const [page, setPage] = useState("today");
  const [now, setNow] = useState(() => Date.now());
  const [toasts, setToasts] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const skipToast = useRef(false);
  const memory = useRef(null);

  const commit = (recipe) => setState((prev) => commitRewards(recipe(prev)));
  const replace = (next) => {
    skipToast.current = true;
    setState(next);
  };

  const push = (toast) => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 3600);
  };

  useEffect(() => {
    saveState(state, user.id);
    const theme = resolveTheme(state.theme);
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#14110e" : "#f4efe4");
  }, [state, user.id]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      setState((prev) => finishTimer(prev, time));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const level = levelInfo(state.xp).level;
    if (!memory.current) {
      memory.current = { xp: state.xp, unlocked: state.unlocked, level };
      rememberChime(state.timer.chime);
      return;
    }
    if (skipToast.current) {
      skipToast.current = false;
      memory.current = { xp: state.xp, unlocked: state.unlocked, level };
      rememberChime(state.timer.chime);
      return;
    }
    const prev = memory.current;
    const gained = state.xp - prev.xp;
    const fresh = state.unlocked.filter((id) => !prev.unlocked.includes(id));
    if (gained > 0) push({ kind: "xp", text: `+${gained} XP` });
    if (level > prev.level) push({ kind: "level", text: t("toast.level", { n: level }) });
    for (const id of fresh) {
      const item = ACHIEVEMENTS.find((achievement) => achievement.id === id);
      if (item) push({ kind: "ach", text: `${item.icon} ${t(`ach.${item.id}.title`)}` });
    }
    takeChime(state.timer.chime, state.sound);
    memory.current = { xp: state.xp, unlocked: state.unlocked, level };
  }, [state, t]);

  useEffect(() => {
    if (!state.timer.running) {
      document.title = t("app.name");
      return;
    }
    const label = state.timer.mode === "focus" ? t("timer.focus") : t("timer.break");
    document.title = `${formatClock(remainingSeconds(state.timer, now))} · ${label}`;
  }, [state.timer, now, t]);

  const actions = {
    setName: (name) => setState((prev) => {
      const clean = name.trim().slice(0, 24);
      renameAccount(user.id, clean);
      return { ...prev, name: clean };
    }),
    setTheme: (theme) => setState((prev) => ({ ...prev, theme })),
    setSound: (sound) => setState((prev) => ({ ...prev, sound })),
    setFocusGoal: (value) => setState((prev) => ({ ...prev, focusGoal: clamp(value, 10, 240) })),
    dismissDemo: () => setState((prev) => ({ ...prev, demoHint: false })),
    addLesson: (lesson) => commit((prev) => ({
      ...prev,
      lessons: [...prev.lessons, {
        ...lesson,
        id: lesson.id || uid(),
        subject: lesson.subject.trim(),
        room: (lesson.room || "").trim(),
      }],
    })),
    updateLesson: (lesson) => commit((prev) => ({
      ...prev,
      lessons: prev.lessons.map((item) => (item.id === lesson.id
        ? { ...item, ...lesson, subject: lesson.subject.trim(), room: (lesson.room || "").trim() }
        : item)),
    })),
    deleteLesson: (id) => commit((prev) => ({ ...prev, lessons: prev.lessons.filter((item) => item.id !== id) })),
    addTask: (task) => commit((prev) => ({
      ...prev,
      tasks: [...prev.tasks, {
        id: uid(),
        title: task.title.trim(),
        subject: task.subject.trim() || t("subject.default"),
        due: task.due,
        priority: task.priority || "mid",
        note: (task.note || "").trim(),
        done: false,
      }],
    })),
    updateTask: (task) => commit((prev) => ({
      ...prev,
      tasks: prev.tasks.map((item) => (item.id === task.id
        ? {
          ...item,
          title: task.title.trim(),
          subject: task.subject.trim() || item.subject,
          due: task.due,
          priority: task.priority,
          note: (task.note || "").trim(),
        }
        : item)),
    })),
    toggleTask: (id) => commit((prev) => toggleTask(prev, id)),
    deleteTask: (id) => commit((prev) => ({ ...prev, tasks: prev.tasks.filter((item) => item.id !== id) })),
    addGoal: (goal) => commit((prev) => ({
      ...prev,
      goals: [...prev.goals, {
        id: uid(),
        title: goal.title.trim(),
        specific: goal.specific.trim(),
        measurable: goal.measurable.trim(),
        achievable: goal.achievable.trim(),
        relevant: goal.relevant.trim(),
        deadline: goal.deadline,
        progress: 0,
        done: false,
        awarded: false,
      }],
    })),
    updateGoal: (goal) => commit((prev) => ({
      ...prev,
      goals: prev.goals.map((item) => (item.id === goal.id
        ? {
          ...item,
          title: goal.title.trim(),
          specific: goal.specific.trim(),
          measurable: goal.measurable.trim(),
          achievable: goal.achievable.trim(),
          relevant: goal.relevant.trim(),
          deadline: goal.deadline,
        }
        : item)),
    })),
    setGoalProgress: (id, progress) => commit((prev) => setGoalProgress(prev, id, progress)),
    deleteGoal: (id) => commit((prev) => ({ ...prev, goals: prev.goals.filter((item) => item.id !== id) })),
    setPomodoro: (patch) => setState((prev) => updatePomodoro(prev, patch)),
    startTimer: () => setState((prev) => startTimer(prev)),
    pauseTimer: () => setState((prev) => pauseTimer(prev, Date.now())),
    resetTimer: () => setState((prev) => resetTimer(prev)),
    setTimerSubject: (subject) => setState((prev) => ({ ...prev, timer: { ...prev.timer, subject } })),
    setTimerMode: (mode) => setState((prev) => selectMode(prev, mode)),
    clearData: () => replace(emptyState(state)),
    restoreDemo: () => replace(starterState(state)),
    importData: (data) => {
      const next = hydrate(data);
      replace(next);
      push({ kind: "good", text: t("toast.imported") });
    },
    notify: (text) => push({ kind: "bad", text }),
    setChat: (chat) => setState((prev) => ({ ...prev, chat })),
    logout: onLogout,
  };

  const level = levelInfo(state.xp);
  const streak = streakCount(state.activity, todayKey(new Date(now)));
  const overdue = state.tasks.some((task) => !task.done && task.due < todayKey(new Date(now)));
  const pageProps = { state, now, actions, onNavigate: setPage };

  return (
    <>
      <a className="skip" href="#content">{t("nav.skip")}</a>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <img className="brand-mark" src="/hamsters/head.png?v=5" alt="" />
            <div className="brand-copy">
              <p className="eyebrow">{t("app.tagline")}</p>
              <strong>{t("app.name")}</strong>
              <small className="account-chip" title={user.login}>{user.login}</small>
            </div>
          </div>
          <nav className="nav" aria-label={t("nav.sections")}>
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={page === item.id ? "nav-btn active" : "nav-btn"}
                aria-current={page === item.id ? "page" : undefined}
                onClick={() => setPage(item.id)}
              >
                <Icon name={item.icon} />
                <span>{t(`nav.${item.id}`)}</span>
                {item.id === "tasks" && overdue && <i className="dot" aria-label={t("nav.overdue")} />}
              </button>
            ))}
          </nav>
          <button type="button" className="side-card" onClick={() => setPage("progress")}>
            <XpRing current={level.current} need={level.need} size={58} />
            <span>
              <strong>{t("nav.level", { n: level.level })}</strong>
              <small>{t("nav.xp", { current: level.current, need: level.need })}</small>
              <small className="streak-line">
                {streak ? t("nav.streak", { n: streak, unit: t.plural(streak, "units.day") }) : t("nav.streakEmpty")}
              </small>
            </span>
          </button>
          <div className="side-tools">
            <LanguageSwitch />
            <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" />
              {t("nav.settings")}
            </button>
          </div>
        </aside>
        <main className="main" id="content">
          {page === "today" && <Today {...pageProps} />}
          {page === "schedule" && <Schedule {...pageProps} />}
          {page === "tasks" && <Homework {...pageProps} />}
          {page === "focus" && <Focus {...pageProps} />}
          {page === "goals" && <Goals {...pageProps} />}
          {page === "progress" && <Progress {...pageProps} />}
          {page === "chat" && <Chat {...pageProps} />}
        </main>
      </div>
      {settingsOpen && (
        <Settings state={state} user={user} actions={actions} onClose={() => setSettingsOpen(false)} />
      )}
      <div className="toaster" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className={`toast ${toast.kind}`}>{toast.text}</p>
        ))}
      </div>
    </>
  );
}
