export const STORAGE_KEY = "study-hamster-v1";

export function dataKey(userId) {
  return `${STORAGE_KEY}:${userId}`;
}

export const DAYS = [
  { id: 1, short: "Пн", long: "Понедельник" },
  { id: 2, short: "Вт", long: "Вторник" },
  { id: 3, short: "Ср", long: "Среда" },
  { id: 4, short: "Чт", long: "Четверг" },
  { id: 5, short: "Пт", long: "Пятница" },
  { id: 6, short: "Сб", long: "Суббота" },
];

export const SUBJECTS = [
  "Математика",
  "Русский язык",
  "Литература",
  "Английский",
  "Физика",
  "История",
  "Биология",
  "Химия",
  "Информатика",
  "География",
  "Обществознание",
];

export const PRIORITIES = [
  { id: "low", label: "Спокойно", xp: 15 },
  { id: "mid", label: "Обычно", xp: 25 },
  { id: "high", label: "Важно", xp: 40 },
];

const SUBJECT_COLORS = {
  Математика: "#e39b2b",
  "Русский язык": "#c45c42",
  Литература: "#8d5a3b",
  Английский: "#3d6f8a",
  Физика: "#3f6b52",
  История: "#7a5b8a",
  Биология: "#5a8f4a",
  Химия: "#2f7d78",
  Информатика: "#345a9e",
  География: "#b56b3a",
  Обществознание: "#a14d62",
  Math: "#e39b2b",
  Russian: "#c45c42",
  Literature: "#8d5a3b",
  English: "#3d6f8a",
  Physics: "#3f6b52",
  History: "#7a5b8a",
  Biology: "#5a8f4a",
  Chemistry: "#2f7d78",
  "Computer science": "#345a9e",
  Geography: "#b56b3a",
  "Social studies": "#a14d62",
};

const FALLBACK_COLORS = ["#e39b2b", "#c45c42", "#3d6f8a", "#3f6b52", "#7a5b8a", "#b56b3a", "#2f7d78"];

export function subjectColor(name) {
  if (SUBJECT_COLORS[name]) return SUBJECT_COLORS[name];
  let hash = 0;
  for (const char of name || "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export function uid() {
  return crypto.randomUUID();
}

export function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return todayKey(date);
}

export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function plural(n, one, few, many) {
  const abs = Math.abs(n);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}

export function formatLongDate(date = new Date(), t) {
  const raw = new Intl.DateTimeFormat(t?.locale || "ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatShortDate(key, t) {
  if (!key) return "";
  return new Intl.DateTimeFormat(t?.locale || "ru-RU", { day: "numeric", month: "short" }).format(parseKey(key));
}

export function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatGap(mins, t) {
  const say = (key, vars) => (typeof t === "function" ? t(key, vars) : key);
  if (mins <= 0) return say("gap.soon");
  if (mins < 60) return say("gap.minutes", { n: mins });
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (!rest) return say("gap.hours", { n: hours });
  return say("gap.both", { hours, minutes: rest });
}

export function greeting(date = new Date(), t) {
  const say = (key) => (typeof t === "function" ? t(key) : key);
  const hour = date.getHours();
  if (hour < 12) return say("greet.morning");
  if (hour < 18) return say("greet.day");
  return say("greet.evening");
}

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function dayName(id, t) {
  const key = id === 0 || id === 7 ? 0 : id;
  if (typeof t === "function") return t(`day.${key}.long`);
  if (key === 0) return "Воскресенье";
  return DAYS.find((day) => day.id === key)?.long || "";
}

export function dateForWeekday(dayId, now = new Date()) {
  const today = now.getDay();
  const mondayOffset = today === 0 ? -6 : 1 - today;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + mondayOffset + (dayId - 1));
  return date;
}

export function levelInfo(xp) {
  let level = 1;
  let floor = 0;
  let need = 100;
  const safe = Math.max(0, Number(xp) || 0);
  while (safe >= floor + need && level < 99) {
    floor += need;
    level += 1;
    need = 100 + (level - 1) * 50;
  }
  return { level, current: safe - floor, need, xp: safe };
}

export function xpForTask(priority) {
  return PRIORITIES.find((item) => item.id === priority)?.xp || 25;
}

export function xpForMinutes(minutes) {
  return Math.max(10, Math.round(minutes * 0.8));
}

export function priorityLabel(priority, t) {
  if (typeof t === "function") return t(`priority.${priority === "low" || priority === "high" ? priority : "mid"}`);
  return PRIORITIES.find((item) => item.id === priority)?.label || "Обычно";
}

export function defaultPomodoro() {
  return { focus: 25, short: 5, long: 15 };
}

export function defaultTimer(pomodoro = defaultPomodoro()) {
  return {
    mode: "focus",
    remaining: pomodoro.focus * 60,
    endsAt: null,
    running: false,
    subject: "Математика",
    cycle: 0,
    chime: 0,
    rewardMinutes: pomodoro.focus,
  };
}

export function modeMinutes(state, mode = state.timer.mode) {
  if (mode === "short") return state.pomodoro.short;
  if (mode === "long") return state.pomodoro.long;
  return state.pomodoro.focus;
}

export function remainingSeconds(timer, now = Date.now()) {
  if (timer.running && timer.endsAt) return Math.max(0, Math.round((timer.endsAt - now) / 1000));
  return Math.max(0, timer.remaining || 0);
}

export function resolveTheme(theme) {
  if (theme === "dark" || theme === "light") return theme;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function isActiveDay(activity, key) {
  const day = activity?.[key];
  if (!day) return false;
  return (day.tasks || 0) > 0 || (day.minutes || 0) > 0;
}

export function streakCount(activity, today = todayKey()) {
  let cursor = today;
  if (!isActiveDay(activity, cursor)) {
    cursor = addDays(cursor, -1);
    if (!isActiveDay(activity, cursor)) return 0;
  }
  let count = 0;
  while (isActiveDay(activity, cursor) && count < 400) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function bestStreak(activity) {
  const keys = Object.keys(activity || {})
    .filter((key) => isActiveDay(activity, key))
    .sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const key of keys) {
    run = prev && key === addDays(prev, 1) ? run + 1 : 1;
    prev = key;
    best = Math.max(best, run);
  }
  return best;
}

function bumpActivity(activity, key, patch) {
  const prev = activity?.[key] || { tasks: 0, minutes: 0 };
  return {
    ...activity,
    [key]: {
      tasks: Math.max(0, (prev.tasks || 0) + (patch.tasks || 0)),
      minutes: Math.max(0, (prev.minutes || 0) + (patch.minutes || 0)),
    },
  };
}

export function statsOf(state, today = todayKey()) {
  const tasks = state.tasks || [];
  const todayTasks = tasks.filter((task) => task.due === today);
  return {
    tasksDone: tasks.filter((task) => task.done).length,
    hardDone: tasks.filter((task) => task.done && task.priority === "high").length,
    todayTotal: todayTasks.length,
    todayDone: todayTasks.filter((task) => task.done).length,
    sessions: (state.sessions || []).length,
    minutes: (state.sessions || []).reduce((sum, session) => sum + (session.minutes || 0), 0),
    goals: (state.goals || []).length,
    goalsDone: (state.goals || []).filter((goal) => goal.done).length,
    streak: streakCount(state.activity, today),
    level: levelInfo(state.xp || 0).level,
  };
}

export const ACHIEVEMENTS = [
  { id: "first-task", title: "Первый шаг", text: "Закрой первое домашнее задание", icon: "✏️", bonus: 15, test: (s) => s.tasksDone >= 1 },
  { id: "five-tasks", title: "В потоке", text: "Выполни 5 заданий", icon: "📚", bonus: 25, test: (s) => s.tasksDone >= 5 },
  { id: "twelve-tasks", title: "Тетрадь закрыта", text: "Выполни 12 заданий", icon: "🗂️", bonus: 40, test: (s) => s.tasksDone >= 12 },
  { id: "hard-task", title: "Сложное — сделано", text: "Закрой задание с важностью «важно»", icon: "🎯", bonus: 20, test: (s) => s.hardDone >= 1 },
  { id: "clear-day", title: "Чистый стол", text: "Закрой все задания со сроком на сегодня, если их хотя бы два", icon: "✨", bonus: 30, test: (s) => s.todayTotal >= 2 && s.todayDone === s.todayTotal },
  { id: "first-pomo", title: "Тишина и фокус", text: "Доведи до конца первый помодоро", icon: "⏳", bonus: 15, test: (s) => s.sessions >= 1 },
  { id: "four-pomo", title: "Четыре круга", text: "Заверши 4 помодоро", icon: "🍅", bonus: 25, test: (s) => s.sessions >= 4 },
  { id: "hour", title: "Целый час", text: "Набери 60 минут фокуса", icon: "🕰️", bonus: 20, test: (s) => s.minutes >= 60 },
  { id: "five-hours", title: "Глубокая работа", text: "Набери 5 часов фокуса", icon: "🌊", bonus: 50, test: (s) => s.minutes >= 300 },
  { id: "streak-3", title: "Три дня подряд", text: "Занимайся 3 дня без пропусков", icon: "🔥", bonus: 30, test: (s) => s.streak >= 3 },
  { id: "streak-7", title: "Неделя хомяка", text: "Собери серию из 7 дней", icon: "🏆", bonus: 70, test: (s) => s.streak >= 7 },
  { id: "goal-done", title: "Дошёл до цели", text: "Доведи SMART-цель до 100%", icon: "🏁", bonus: 25, test: (s) => s.goalsDone >= 1 },
  { id: "three-goals", title: "План на перспективу", text: "Поставь 3 SMART-цели", icon: "🗺️", bonus: 20, test: (s) => s.goals >= 3 },
  { id: "level-3", title: "Уверенный темп", text: "Достигни 3 уровня", icon: "⭐", bonus: 20, test: (s) => s.level >= 3 },
  { id: "level-6", title: "Хомяк-отличник", text: "Достигни 6 уровня", icon: "🐹", bonus: 40, test: (s) => s.level >= 6 },
];

export function applyAchievements(state) {
  const unlocked = new Set(state.unlocked || []);
  const fresh = [];
  let bonus = 0;
  const stats = statsOf(state);
  for (const item of ACHIEVEMENTS) {
    if (!unlocked.has(item.id) && item.test(stats)) {
      fresh.push(item);
      unlocked.add(item.id);
      bonus += item.bonus || 0;
    }
  }
  if (!fresh.length) return { state, fresh };
  const next = applyAchievements({
    ...state,
    xp: (state.xp || 0) + bonus,
    unlocked: [...unlocked],
  });
  return { state: next.state, fresh: [...fresh, ...next.fresh] };
}

export function commitRewards(state) {
  return applyAchievements(state).state;
}

function lesson(day, start, end, subject, room) {
  return { id: `seed-${day}-${start}`, day, start, end, subject, room };
}

export function defaultState() {
  const pomodoro = defaultPomodoro();
  const today = todayKey();
  return {
    name: "",
    theme: "system",
    sound: true,
    xp: 0,
    unlocked: [],
    focusGoal: 50,
    demoHint: true,
    pomodoro,
    timer: defaultTimer(pomodoro),
    lessons: [
      lesson(1, "08:30", "09:15", "Математика", "214"),
      lesson(1, "09:25", "10:10", "Русский язык", "109"),
      lesson(1, "10:20", "11:05", "Английский", "305"),
      lesson(1, "11:25", "12:10", "История", "207"),
      lesson(1, "12:20", "13:05", "Физика", "301"),
      lesson(2, "08:30", "09:15", "Литература", "109"),
      lesson(2, "09:25", "10:10", "Математика", "214"),
      lesson(2, "10:20", "11:05", "Биология", "118"),
      lesson(2, "11:25", "12:10", "География", "220"),
      lesson(3, "08:30", "09:15", "Химия", "314"),
      lesson(3, "09:25", "10:10", "Русский язык", "109"),
      lesson(3, "10:20", "11:05", "Информатика", "401"),
      lesson(3, "11:25", "12:10", "Английский", "305"),
      lesson(3, "12:20", "13:05", "История", "207"),
      lesson(4, "08:30", "09:15", "Математика", "214"),
      lesson(4, "09:25", "10:10", "Физика", "301"),
      lesson(4, "10:20", "11:05", "Литература", "109"),
      lesson(4, "11:25", "12:10", "Обществознание", "207"),
      lesson(5, "08:30", "09:15", "Английский", "305"),
      lesson(5, "09:25", "10:10", "Математика", "214"),
      lesson(5, "10:20", "11:05", "Биология", "118"),
      lesson(5, "11:25", "12:10", "Русский язык", "109"),
      lesson(6, "09:00", "09:45", "Информатика", "401"),
    ],
    tasks: [
      {
        id: "seed-task-1",
        title: "№ 214–220 по алгебре",
        subject: "Математика",
        due: today,
        priority: "high",
        note: "Повторить формулы сокращённого умножения",
        done: false,
      },
      {
        id: "seed-task-2",
        title: "Прочитать «Грозу», действие I",
        subject: "Литература",
        due: today,
        priority: "mid",
        note: "Выписать 5 реплик Катерины",
        done: false,
      },
      {
        id: "seed-task-3",
        title: "Задачи 3 и 4 со страницы 86",
        subject: "Физика",
        due: addDays(today, 1),
        priority: "mid",
        note: "",
        done: false,
      },
      {
        id: "seed-task-4",
        title: "Эссе на 120 слов: my favourite place",
        subject: "Английский",
        due: addDays(today, 3),
        priority: "mid",
        note: "",
        done: false,
      },
      {
        id: "seed-task-5",
        title: "§12 — ответить на вопросы",
        subject: "История",
        due: addDays(today, -1),
        priority: "low",
        note: "Можно коротко, своими словами",
        done: false,
      },
    ],
    goals: [
      {
        id: "seed-goal-1",
        title: "Подготовиться к контрольной по математике",
        specific: "Решить варианты 12–20 из сборника",
        measurable: "9 вариантов из 9, с проверкой ответов",
        achievable: "По два варианта после уроков",
        relevant: "Контрольная влияет на четвертную",
        deadline: addDays(today, 17),
        progress: 35,
        done: false,
        awarded: false,
      },
    ],
    sessions: [],
    activity: {},
    chat: [],
  };
}

function mergeTimer(data, pomodoro) {
  const base = defaultTimer(pomodoro);
  const timer = { ...base, ...(data?.timer || {}) };
  return {
    ...timer,
    running: Boolean(timer.running && timer.endsAt),
    subject: timer.subject || "Математика",
    cycle: Number(timer.cycle) || 0,
    chime: Number(timer.chime) || 0,
    remaining: Number(timer.remaining) || base.remaining,
  };
}

export function loadState(userId) {
  try {
    const raw = userId ? localStorage.getItem(dataKey(userId)) : null;
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.lessons) || !Array.isArray(data.tasks)) return defaultState();
    const pomodoro = {
      focus: clamp(data.pomodoro?.focus ?? 25, 1, 90),
      short: clamp(data.pomodoro?.short ?? 5, 1, 30),
      long: clamp(data.pomodoro?.long ?? 15, 1, 45),
    };
    const base = defaultState();
    return {
      ...base,
      ...data,
      name: String(data.name || "").slice(0, 24),
      theme: ["light", "dark", "system"].includes(data.theme) ? data.theme : "system",
      sound: data.sound !== false,
      xp: Math.max(0, Number(data.xp) || 0),
      focusGoal: clamp(data.focusGoal ?? 50, 10, 240),
      pomodoro,
      timer: mergeTimer(data, pomodoro),
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      lessons: data.lessons,
      tasks: data.tasks,
      goals: Array.isArray(data.goals) ? data.goals : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      activity: data.activity && typeof data.activity === "object" ? data.activity : {},
      demoHint: Boolean(data.demoHint),
      chat: cleanChat(data.chat),
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state, userId) {
  if (!userId) return;
  try {
    localStorage.setItem(dataKey(userId), JSON.stringify(state));
  } catch {
    /* хранилище может быть закрыто */
  }
}

export function emptyState(prev) {
  const pomodoro = defaultPomodoro();
  return {
    name: prev.name,
    theme: prev.theme,
    sound: prev.sound,
    xp: 0,
    unlocked: [],
    focusGoal: 50,
    demoHint: false,
    pomodoro,
    timer: defaultTimer(pomodoro),
    lessons: [],
    tasks: [],
    goals: [],
    sessions: [],
    activity: {},
    chat: [],
  };
}

function cleanChat(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
    .slice(-40)
    .map((item) => ({ role: item.role, text: item.text.slice(0, 4000) }));
}

export function starterState(prev) {
  return {
    ...defaultState(),
    name: prev.name,
    theme: prev.theme,
    sound: prev.sound,
  };
}

function asLesson(lesson) {
  if (!lesson || typeof lesson.subject !== "string" || !lesson.subject.trim()) return null;
  const day = Number(lesson.day);
  if (![1, 2, 3, 4, 5, 6].includes(day)) return null;
  return {
    id: String(lesson.id || uid()),
    day,
    start: String(lesson.start || "08:30"),
    end: String(lesson.end || "09:15"),
    subject: lesson.subject.trim(),
    room: String(lesson.room || "").trim(),
  };
}

function asTask(task) {
  if (!task || typeof task.title !== "string" || !task.title.trim()) return null;
  const priority = ["low", "mid", "high"].includes(task.priority) ? task.priority : "mid";
  return {
    id: String(task.id || uid()),
    title: task.title.trim(),
    subject: String(task.subject || "Математика").trim() || "Математика",
    due: /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? task.due : todayKey(),
    priority,
    note: String(task.note || "").trim(),
    done: Boolean(task.done),
  };
}

function asGoal(goal) {
  if (!goal || typeof goal.title !== "string" || !goal.title.trim()) return null;
  const progress = clamp(goal.progress ?? 0, 0, 100);
  const done = Boolean(goal.done) || progress >= 100;
  return {
    id: String(goal.id || uid()),
    title: goal.title.trim(),
    specific: String(goal.specific || "").trim(),
    measurable: String(goal.measurable || "").trim(),
    achievable: String(goal.achievable || "").trim(),
    relevant: String(goal.relevant || "").trim(),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(goal.deadline) ? goal.deadline : addDays(todayKey(), 7),
    progress: done ? 100 : progress,
    done,
    awarded: Boolean(goal.awarded) || done,
  };
}

export function hydrate(data) {
  if (!data || typeof data !== "object") throw new Error("bad file");
  if (!Array.isArray(data.lessons) || !Array.isArray(data.tasks)) throw new Error("bad file");
  const pomodoro = {
    focus: clamp(data.pomodoro?.focus ?? 25, 1, 90),
    short: clamp(data.pomodoro?.short ?? 5, 1, 30),
    long: clamp(data.pomodoro?.long ?? 15, 1, 45),
  };
  const next = {
    name: String(data.name || "").slice(0, 24),
    theme: ["light", "dark", "system"].includes(data.theme) ? data.theme : "system",
    sound: data.sound !== false,
    xp: Math.max(0, Number(data.xp) || 0),
    unlocked: Array.isArray(data.unlocked)
      ? data.unlocked.filter((id) => ACHIEVEMENTS.some((item) => item.id === id))
      : [],
    focusGoal: clamp(data.focusGoal ?? 50, 10, 240),
    demoHint: false,
    pomodoro,
    timer: defaultTimer(pomodoro),
    lessons: data.lessons.map(asLesson).filter(Boolean),
    tasks: data.tasks.map(asTask).filter(Boolean),
    goals: Array.isArray(data.goals) ? data.goals.map(asGoal).filter(Boolean) : [],
    sessions: Array.isArray(data.sessions) ? data.sessions.slice(0, 300) : [],
    activity: data.activity && typeof data.activity === "object" ? data.activity : {},
  };
  return next;
}

export function toggleTask(state, id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return state;
  const done = !task.done;
  const xp = xpForTask(task.priority);
  return {
    ...state,
    xp: Math.max(0, state.xp + (done ? xp : -xp)),
    tasks: state.tasks.map((item) => (item.id === id ? { ...item, done } : item)),
    activity: bumpActivity(state.activity, todayKey(), { tasks: done ? 1 : -1 }),
  };
}

export function setGoalProgress(state, id, progress) {
  const value = clamp(progress, 0, 100);
  let bonus = 0;
  let activity = state.activity;
  const goals = state.goals.map((goal) => {
    if (goal.id !== id) return goal;
    const done = value >= 100;
    if (done && !goal.awarded) {
      bonus += 60;
      activity = bumpActivity(activity, todayKey(), { tasks: 1 });
    }
    return { ...goal, progress: value, done, awarded: goal.awarded || done };
  });
  return { ...state, goals, xp: state.xp + bonus, activity };
}

export function updatePomodoro(state, patch) {
  const pomodoro = {
    focus: clamp(patch.focus ?? state.pomodoro.focus, 1, 90),
    short: clamp(patch.short ?? state.pomodoro.short, 1, 30),
    long: clamp(patch.long ?? state.pomodoro.long, 1, 45),
  };
  if (state.timer.running) return { ...state, pomodoro };
  return {
    ...state,
    pomodoro,
    timer: {
      ...state.timer,
      remaining: modeMinutes({ ...state, pomodoro }) * 60,
      rewardMinutes: pomodoro.focus,
    },
  };
}

export function startTimer(state) {
  if (state.timer.running) return state;
  return {
    ...state,
    timer: {
      ...state.timer,
      running: true,
      endsAt: Date.now() + state.timer.remaining * 1000,
      rewardMinutes: state.timer.mode === "focus" ? modeMinutes(state) : state.timer.rewardMinutes,
    },
  };
}

export function pauseTimer(state, now = Date.now()) {
  if (!state.timer.running) return state;
  return {
    ...state,
    timer: {
      ...state.timer,
      running: false,
      endsAt: null,
      remaining: remainingSeconds(state.timer, now),
    },
  };
}

export function resetTimer(state) {
  return {
    ...state,
    timer: {
      ...state.timer,
      running: false,
      endsAt: null,
      remaining: modeMinutes(state) * 60,
    },
  };
}

export function selectMode(state, mode) {
  const safe = ["focus", "short", "long"].includes(mode) ? mode : "focus";
  return {
    ...state,
    timer: {
      ...state.timer,
      mode: safe,
      running: false,
      endsAt: null,
      remaining: modeMinutes(state, safe) * 60,
    },
  };
}

export function finishTimer(state, now = Date.now()) {
  const timer = state.timer;
  if (!timer?.running || !timer.endsAt || now < timer.endsAt) return state;
  const sessionId = `pomo-${timer.endsAt}`;
  if ((state.sessions || []).some((session) => session.id === sessionId)) {
    return { ...state, timer: { ...timer, running: false, endsAt: null } };
  }
  if (timer.mode !== "focus") {
    return {
      ...state,
      timer: {
        ...timer,
        running: false,
        endsAt: null,
        mode: "focus",
        remaining: state.pomodoro.focus * 60,
        chime: (timer.chime || 0) + 1,
      },
    };
  }
  const minutes = timer.rewardMinutes || state.pomodoro.focus;
  const date = todayKey(new Date(timer.endsAt));
  const cycle = (timer.cycle || 0) + 1;
  const nextMode = cycle % 4 === 0 ? "long" : "short";
  const rewarded = {
    ...state,
    xp: state.xp + xpForMinutes(minutes),
    sessions: [
      { id: sessionId, date, minutes, subject: timer.subject || "Учёба", at: timer.endsAt },
      ...(state.sessions || []),
    ].slice(0, 300),
    activity: bumpActivity(state.activity, date, { minutes }),
    timer: {
      ...timer,
      running: false,
      endsAt: null,
      mode: nextMode,
      remaining: (nextMode === "long" ? state.pomodoro.long : state.pomodoro.short) * 60,
      cycle,
      chime: (timer.chime || 0) + 1,
    },
  };
  return commitRewards(rewarded);
}

export function dueLabel(due, today = todayKey(), t) {
  const say = (key, vars) => (typeof t === "function" ? t(key, vars) : key);
  if (!due) return "";
  if (due === today) return say("due.today");
  if (due === addDays(today, 1)) return say("due.tomorrow");
  if (due === addDays(today, -1)) return say("due.yesterday");
  if (due < today) {
    const days = Math.round((parseKey(today) - parseKey(due)) / 86400000);
    const unit = t?.plural ? t.plural(days, "units.day") : plural(days, "день", "дня", "дней");
    return say("due.overdue", { n: days, unit });
  }
  return formatShortDate(due, t);
}

export function deadlineLabel(key, today = todayKey(), t) {
  const say = (keyName, vars) => (typeof t === "function" ? t(keyName, vars) : keyName);
  if (!key) return "";
  if (key === today) return say("due.deadlineToday");
  if (key < today) {
    const days = Math.round((parseKey(today) - parseKey(key)) / 86400000);
    const unit = t?.plural ? t.plural(days, "units.day") : plural(days, "день", "дня", "дней");
    return say("due.deadlineLate", { n: days, unit });
  }
  const days = Math.round((parseKey(key) - parseKey(today)) / 86400000);
  if (days === 1) return say("due.tomorrow");
  const unit = t?.plural ? t.plural(days, "units.day") : plural(days, "день", "дня", "дней");
  return say("due.deadlineLeft", { n: days, unit });
}

export function lessonPhase(lesson, nowDate = new Date()) {
  if (lesson.day !== nowDate.getDay()) return "other";
  const mins = nowDate.getHours() * 60 + nowDate.getMinutes();
  const start = toMinutes(lesson.start);
  const end = toMinutes(lesson.end);
  if (mins >= start && mins < end) return "now";
  if (mins < start) return "later";
  return "past";
}

export function upcoming(lessons, nowDate = new Date()) {
  const day = nowDate.getDay();
  const mins = nowDate.getHours() * 60 + nowDate.getMinutes();
  const todayLeft = (lessons || [])
    .filter((item) => item.day === day && toMinutes(item.end) > mins)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  if (todayLeft.length) return { when: "today", day, lessons: todayLeft };
  for (let step = 1; step <= 6; step += 1) {
    const id = (day + step) % 7;
    const list = (lessons || [])
      .filter((item) => item.day === id)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    if (list.length) return { when: step === 1 ? "tomorrow" : "soon", day: id, lessons: list };
  }
  return { when: "none", day: null, lessons: [] };
}

export function coachLine(state, today = todayKey(), t) {
  const say = (key, vars) => (typeof t === "function" ? t(key, vars) : key);
  const unit = (n, key, fallback) => (t?.plural ? t.plural(n, key) : plural(n, ...fallback));
  if (state.timer?.running && state.timer.mode === "focus") return say("coach.focus");
  const overdue = state.tasks.filter((task) => !task.done && task.due < today);
  if (overdue.length === 1) return say("coach.overdueOne");
  if (overdue.length > 1) {
    return say("coach.overdue", { n: overdue.length, unit: unit(overdue.length, "units.task", ["задание", "задания", "заданий"]) });
  }
  const todayOpen = state.tasks.filter((task) => !task.done && task.due === today);
  if (todayOpen.length) {
    return say("coach.today", { n: todayOpen.length, unit: unit(todayOpen.length, "units.task", ["задание", "задания", "заданий"]) });
  }
  if (state.tasks.some((task) => task.due === today && task.done)) return say("coach.done");
  const streak = streakCount(state.activity, today);
  if (streak >= 2) return say("coach.streak", { n: streak, unit: unit(streak, "units.day", ["день", "дня", "дней"]) });
  return say("coach.start");
}

export function hamsterMood(state, nowDate = new Date()) {
  const today = todayKey(nowDate);
  const hour = nowDate.getHours();
  if (state.timer?.running && state.timer.mode === "focus") return "focus";
  if (state.timer?.running) return "sleepy";
  if (state.tasks.some((task) => !task.done && task.due < today)) return "worry";
  const todayTasks = state.tasks.filter((task) => task.due === today);
  if (todayTasks.length > 0 && todayTasks.every((task) => task.done)) return "proud";
  if (hour >= 23 || hour < 6) return "sleepy";
  return "happy";
}

export function focusHint(timer, remaining = timer.remaining, total = remaining, t) {
  const say = (key) => (typeof t === "function" ? t(key) : key);
  if (!timer.running && timer.mode === "focus" && remaining < total - 1) return say("hint.paused");
  if (timer.running && timer.mode === "focus") return say("hint.running");
  if (timer.running) return say("hint.break");
  if (timer.mode === "long") return say("hint.long");
  if (timer.mode === "short" && timer.cycle > 0) return say("hint.short");
  return say("hint.idle");
}

export function sortTasks(tasks) {
  const rank = { high: 0, mid: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
  });
}

let chimeArmed = false;
let lastChime = 0;
let audioCtx;

export function rememberChime(chime) {
  chimeArmed = true;
  lastChime = chime || 0;
}

export function takeChime(chime, sound) {
  if (!chimeArmed) {
    rememberChime(chime);
    return;
  }
  if (chime === lastChime) return;
  lastChime = chime;
  if (!sound) return;
  try {
    audioCtx = audioCtx || new AudioContext();
    const start = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const at = start + index * 0.11;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.05, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      osc.start(at);
      osc.stop(at + 0.3);
    });
  } catch {
    /* без звука тоже можно учиться */
  }
}
