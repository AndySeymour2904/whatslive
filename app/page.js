import fs from "node:fs";
import path from "node:path";
import CalendarApp from "./components/CalendarApp";

function loadEvents() {
  const file = path.join(process.cwd(), "data", "events.json");
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return { events: parsed.events || [], generatedAt: parsed.generatedAt || null };
  } catch {
    return { events: [], generatedAt: null };
  }
}

export default function Home() {
  const { events, generatedAt } = loadEvents();
  return <CalendarApp events={events} generatedAt={generatedAt} />;
}
