import { DAYS, levelInfo, todayKey } from "./model.js";

const PRIORITY = { high: "важно", mid: "обычно", low: "можно позже" };

export function studyBrief(state, now = Date.now(), lang = "ru") {
  const date = new Date(now);
  const today = todayKey(date);
  const dayId = date.getDay() === 0 ? 7 : date.getDay();
  const dayName = DAYS.find((day) => day.id === dayId)?.long || "воскресенье";
  const level = levelInfo(state.xp);
  const minutes = state.activity?.[today]?.minutes || 0;
  const replyLanguage = lang === "en" ? "английский" : "русский";
  const lines = [
    `Язык ответа ученику: ${replyLanguage}.`,
    `Ученик: ${state.name || "без имени"}`,
    `Сегодня: ${today}, ${dayName}`,
    `Уровень ${level.level}, опыт ${state.xp}`,
    `Фокус сегодня: ${minutes} из ${state.focusGoal} минут`,
    "Расписание:",
  ];
  const lessons = [...(state.lessons || [])].sort((a, b) => a.day - b.day || String(a.start).localeCompare(String(b.start)));
  if (!lessons.length) lines.push("уроков нет");
  for (const lesson of lessons) {
    const name = DAYS.find((day) => day.id === lesson.day)?.short || lesson.day;
    lines.push(`${name} ${lesson.start}–${lesson.end} ${lesson.subject}${lesson.room ? `, каб. ${lesson.room}` : ""}`);
  }
  lines.push("Задания:");
  if (!state.tasks?.length) lines.push("заданий нет");
  for (const task of state.tasks || []) {
    lines.push(`${task.done ? "сделано" : "открыто"} | ${task.due} | ${task.subject} | ${PRIORITY[task.priority] || "обычно"} | ${task.title}${task.note ? ` (${task.note})` : ""}`);
  }
  lines.push("Цели:");
  if (!state.goals?.length) lines.push("целей нет");
  for (const goal of state.goals || []) {
    lines.push(`${goal.done ? "закрыта" : `${goal.progress || 0}%`} до ${goal.deadline}: ${goal.title}. ${goal.specific || ""}`);
  }
  return lines.join("\n").slice(0, 8000);
}
