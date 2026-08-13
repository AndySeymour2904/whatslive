"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SPORTS, sportFor } from "./sports";
import {
  addDays,
  dateKey,
  formatDayLabel,
  formatMonthLabel,
  formatShortDay,
  formatTime,
  isSameDay,
  isSameMonth,
  monthMatrix,
  startOfDay,
  startOfWeek,
} from "./dates";

const SOON_WINDOW_HOURS = 3;
const VIEWS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function leagueKey(sport, league) {
  return `${sport}||${league}`;
}

function SportCheckbox({ checked, indeterminate, onChange, label, color, count }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className="filter-row filter-row-sport">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} />
      <span className="dot" style={{ background: color }} />
      <span className="filter-label">{label}</span>
      <span className="filter-count">{count}</span>
    </label>
  );
}

export default function CalendarApp({ events, generatedAt }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [view, setView] = useState("day");
  const [disabledLeagues, setDisabledLeagues] = useState(() => new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    setAnchor(startOfDay(new Date()));
    setMounted(true);
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const parsedEvents = useMemo(
    () => events.map((e) => ({ ...e, startDate: new Date(e.start) })),
    [events]
  );

  const leaguesBySport = useMemo(() => {
    const map = new Map();
    for (const e of parsedEvents) {
      if (!map.has(e.sport)) map.set(e.sport, new Set());
      map.get(e.sport).add(e.league);
    }
    return map;
  }, [parsedEvents]);

  const filteredEvents = useMemo(
    () => parsedEvents.filter((e) => !disabledLeagues.has(leagueKey(e.sport, e.league))),
    [parsedEvents, disabledLeagues]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of filteredEvents) {
      const key = dateKey(e.startDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.startDate - b.startDate);
    return map;
  }, [filteredEvents]);

  function toggleLeague(sport, league) {
    setDisabledLeagues((prev) => {
      const next = new Set(prev);
      const key = leagueKey(sport, league);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSport(sport, leagues) {
    setDisabledLeagues((prev) => {
      const next = new Set(prev);
      const allDisabled = leagues.every((l) => next.has(leagueKey(sport, l)));
      for (const l of leagues) {
        const key = leagueKey(sport, l);
        if (allDisabled) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  if (!mounted || !anchor) {
    return (
      <div className="app-shell">
        <p className="loading">Loading what&rsquo;s on&hellip;</p>
      </div>
    );
  }

  const liveNow = [];
  const startingSoon = [];
  for (const e of filteredEvents) {
    const durationMs = sportFor(e.sport).assumedHours * 60 * 60 * 1000;
    const endsAt = new Date(e.startDate.getTime() + durationMs);
    if (e.startDate <= now && now < endsAt) liveNow.push(e);
    else if (e.startDate > now && e.startDate - now <= SOON_WINDOW_HOURS * 60 * 60 * 1000) {
      startingSoon.push(e);
    }
  }
  liveNow.sort((a, b) => a.startDate - b.startDate);
  startingSoon.sort((a, b) => a.startDate - b.startDate);

  function goToday() {
    setAnchor(startOfDay(now));
  }
  function goPrev() {
    if (view === "day") setAnchor((a) => addDays(a, -1));
    else if (view === "week") setAnchor((a) => addDays(a, -7));
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1));
  }
  function goNext() {
    if (view === "day") setAnchor((a) => addDays(a, 1));
    else if (view === "week") setAnchor((a) => addDays(a, 7));
    else setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1));
  }
  function goToDay(d) {
    setAnchor(startOfDay(d));
    setView("day");
  }

  let title;
  if (view === "day") title = formatDayLabel(anchor);
  else if (view === "week") {
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    title = `${formatShortDay(start)} – ${formatShortDay(end)}`;
  } else title = formatMonthLabel(anchor);

  return (
    <div className="app-shell">
      <aside className={`sidebar${sidebarOpen ? "" : " collapsed"}`}>
        <div className="sidebar-head">
          <span>Sports</span>
          <button className="icon-btn" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle filters">
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>
        {sidebarOpen && (
          <div className="filter-list">
            {SPORTS.map((sport) => {
              const leagues = Array.from(leaguesBySport.get(sport.key) || []).sort();
              const enabledCount = leagues.filter((l) => !disabledLeagues.has(leagueKey(sport.key, l))).length;
              return (
                <div className="filter-group" key={sport.key}>
                  <SportCheckbox
                    checked={leagues.length > 0 && enabledCount === leagues.length}
                    indeterminate={enabledCount > 0 && enabledCount < leagues.length}
                    onChange={() => toggleSport(sport.key, leagues)}
                    label={sport.label}
                    color={sport.color}
                    count={leagues.length ? "" : "—"}
                  />
                  {leagues.length > 0 && (
                    <div className="filter-sublist">
                      {leagues.map((league) => (
                        <label className="filter-row filter-row-league" key={league}>
                          <input
                            type="checkbox"
                            checked={!disabledLeagues.has(leagueKey(sport.key, league))}
                            onChange={() => toggleLeague(sport.key, league)}
                          />
                          <span className="filter-label">{league}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>What&rsquo;s Live</h1>
            {generatedAt && (
              <span className="refreshed">
                Updated {new Date(generatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="topbar-controls">
            <div className="view-toggle">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  className={view === v.key ? "active" : ""}
                  onClick={() => setView(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="date-nav">
              <button className="icon-btn" onClick={goPrev} aria-label="Previous">
                ‹
              </button>
              <button className="today-btn" onClick={goToday}>
                Today
              </button>
              <button className="icon-btn" onClick={goNext} aria-label="Next">
                ›
              </button>
            </div>
          </div>
        </header>

        <div className="date-title">{title}</div>

        {(liveNow.length > 0 || startingSoon.length > 0) && (
          <section className="now-strip">
            {liveNow.map((e) => (
              <EventChip key={e.id} event={e} status="live" />
            ))}
            {startingSoon.map((e) => (
              <EventChip key={e.id} event={e} status="soon" />
            ))}
          </section>
        )}

        {view === "day" && (
          <DayView day={anchor} events={eventsByDay.get(dateKey(anchor)) || []} now={now} />
        )}
        {view === "week" && (
          <WeekView anchor={anchor} eventsByDay={eventsByDay} now={now} onSelectDay={goToDay} />
        )}
        {view === "month" && (
          <MonthView anchor={anchor} eventsByDay={eventsByDay} now={now} onSelectDay={goToDay} />
        )}
      </main>
    </div>
  );
}

function EventChip({ event, status }) {
  const sport = sportFor(event.sport);
  return (
    <div className={`chip chip-${status}`}>
      <span className="chip-badge">{status === "live" ? "LIVE" : "SOON"}</span>
      <span className="dot" style={{ background: sport.color }} />
      <span className="chip-title">{event.title}</span>
      <span className="chip-time">{formatTime(event.startDate)}</span>
    </div>
  );
}

function EventRow({ event }) {
  const sport = sportFor(event.sport);
  return (
    <div className="event-row">
      <span className="event-time">{formatTime(event.startDate)}</span>
      <span className="dot" style={{ background: sport.color }} />
      <span className="event-sport">{sport.label}</span>
      <span className="event-title">{event.title}</span>
      {event.venue && <span className="event-venue">{event.venue}</span>}
    </div>
  );
}

function DayView({ day, events, now }) {
  return (
    <section className="day-view">
      {events.length === 0 && <p className="empty">Nothing on for {formatDayLabel(day)} with the current filters.</p>}
      {events.map((e) => (
        <EventRow key={e.id} event={e} />
      ))}
    </section>
  );
}

function WeekView({ anchor, eventsByDay, now, onSelectDay }) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <section className="week-view">
      {days.map((day) => {
        const list = eventsByDay.get(dateKey(day)) || [];
        const today = isSameDay(day, now);
        return (
          <div className={`week-col${today ? " is-today" : ""}`} key={dateKey(day)}>
            <button className="week-col-head" onClick={() => onSelectDay(day)}>
              {formatShortDay(day)}
            </button>
            <div className="week-col-body">
              {list.length === 0 && <p className="empty small">&ndash;</p>}
              {list.map((e) => {
                const sport = sportFor(e.sport);
                return (
                  <div className="week-event" key={e.id}>
                    <span className="dot" style={{ background: sport.color }} />
                    <span className="week-event-time">{formatTime(e.startDate)}</span>
                    <span className="week-event-title">{e.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function MonthView({ anchor, eventsByDay, now, onSelectDay }) {
  const weeks = monthMatrix(anchor);
  return (
    <section className="month-view">
      <div className="month-grid month-grid-head">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div className="month-head-cell" key={d}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div className="month-grid" key={wi}>
          {week.map((day) => {
            const list = eventsByDay.get(dateKey(day)) || [];
            const inMonth = isSameMonth(day, anchor);
            const today = isSameDay(day, now);
            const shown = list.slice(0, 3);
            const extra = list.length - shown.length;
            return (
              <button
                key={dateKey(day)}
                className={`month-cell${inMonth ? "" : " outside"}${today ? " is-today" : ""}`}
                onClick={() => onSelectDay(day)}
              >
                <span className="month-cell-date">{day.getDate()}</span>
                <span className="month-cell-events">
                  {shown.map((e) => {
                    const sport = sportFor(e.sport);
                    return <span className="dot" style={{ background: sport.color }} key={e.id} />;
                  })}
                  {extra > 0 && <span className="month-cell-more">+{extra}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}
