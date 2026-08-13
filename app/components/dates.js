const DAY_MS = 24 * 60 * 60 * 1000;

export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d, n) {
  return new Date(d.getTime() + n * DAY_MS);
}

// Monday-start week, to match UK convention.
export function startOfWeek(d) {
  const copy = startOfDay(d);
  const dow = (copy.getDay() + 6) % 7; // 0 = Monday
  return addDays(copy, -dow);
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// 6 weeks x 7 days covering the full visible month grid.
export function monthMatrix(d) {
  const firstOfMonth = startOfMonth(d);
  const gridStart = startOfWeek(firstOfMonth);
  const weeks = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function isSameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatDayLabel(d) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function formatShortDay(d) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function formatMonthLabel(d) {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function formatTime(d) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
