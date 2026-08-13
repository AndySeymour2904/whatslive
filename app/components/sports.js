// Fixed order: matches the validated categorical palette slots (globals.css --s1..--s7),
// so hue assignment never shifts as sports are added/removed.
export const SPORTS = [
  { key: "Soccer", label: "Football", color: "var(--s1)", assumedHours: 2 },
  { key: "Cricket", label: "Cricket", color: "var(--s2)", assumedHours: 6 },
  { key: "Rugby", label: "Rugby", color: "var(--s3)", assumedHours: 2 },
  { key: "Tennis", label: "Tennis", color: "var(--s4)", assumedHours: 3 },
  { key: "Golf", label: "Golf", color: "var(--s5)", assumedHours: 5 },
  { key: "Motorsport", label: "Motorsport", color: "var(--s6)", assumedHours: 2 },
  { key: "Fighting", label: "Combat Sports", color: "var(--s7)", assumedHours: 3 },
];

export const SPORT_BY_KEY = Object.fromEntries(SPORTS.map((s) => [s.key, s]));

export function sportFor(key) {
  return SPORT_BY_KEY[key] || { key, label: key, color: "var(--s8)", assumedHours: 3 };
}
