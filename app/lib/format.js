export const LANG_STORAGE_KEY = "tm-lang";
export const THEME_STORAGE_KEY = "tm-theme";

export const DATE_LOCALES = {
  ar: "ar-EG-u-nu-latn",
  en: "en-GB",
};

export const CLOCK_LOCALES = {
  ar: "ar-EG-u-nu-latn",
  en: "en-US",
};

export const formatDate = (value, lang, options = {}) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALES[lang] || DATE_LOCALES.ar, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
};

export const formatWeekdayDate = (value, lang) =>
  formatDate(value, lang, { weekday: "long" });

export const formatDateTime = (value, lang) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat(DATE_LOCALES[lang] || DATE_LOCALES.ar, {
    day: "numeric",
    month: "short",
  }).format(date);
  const time = new Intl.DateTimeFormat(CLOCK_LOCALES[lang] || CLOCK_LOCALES.en, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${day} · ${time}`;
};

export const formatClock = (hhmm, lang) => {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "";
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(CLOCK_LOCALES[lang] || CLOCK_LOCALES.en, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const formatDue = (dueDate, dueTime, lang) => {
  if (!dueDate) return "";
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat(DATE_LOCALES[lang] || DATE_LOCALES.ar, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  return dueTime ? `${day} · ${formatClock(dueTime, lang)}` : day;
};

// Due date/time are stored as local wall-clock values. A date without a time is
// considered due at the end of that local day.
export const dueTimestamp = (dueDate, dueTime) => {
  if (!dueDate) return null;
  const [year, month, day] = dueDate.split("-").map(Number);
  const [hours, minutes] = dueTime ? dueTime.split(":").map(Number) : [23, 59];
  const date = new Date(year, month - 1, day, hours, minutes, 59, 999);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

export const isOverdue = (task) => {
  if (!task?.dueDate || task.completed) return false;
  const stamp = dueTimestamp(task.dueDate, task.dueTime);
  return stamp !== null && stamp < Date.now();
};

export const isSubtaskOverdue = (subtask) => {
  if (!subtask?.dueDate || subtask.completed) return false;
  const stamp = dueTimestamp(subtask.dueDate, subtask.dueTime);
  return stamp !== null && stamp < Date.now();
};

export const todayInputValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};
