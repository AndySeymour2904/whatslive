#!/usr/bin/env node
// Prototype fetch against TheSportsDB free API. Pulls the next N days of
// events across several sports and keeps only ones relevant to a UK audience.
const fs = require('fs');
const path = require('path');

const API_KEY = '123'; // TheSportsDB's public test key
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const SPORTS = ['Soccer', 'Cricket', 'Rugby', 'Tennis', 'Golf', 'Motorsport', 'Fighting'];
const DAYS_AHEAD = 7;
const REQUEST_DELAY_MS = 2200; // free tier is rate-limited; stay well under it

const UK_COUNTRIES = new Set(['england', 'scotland', 'wales', 'northern ireland', 'united kingdom', 'great britain']);

// Competitions UK audiences follow regardless of which country hosts each fixture.
const GLOBAL_KEYWORDS = [
  'premier league', 'champions league', 'europa league', 'conference league',
  'formula 1', 'atp', 'wta', 'wimbledon', 'the open', 'pga tour', 'european tour',
  'ashes', 'test match', 'one day international', 't20 international', 'six nations',
  'grand slam',
];

function isUkRelevant(event) {
  const country = (event.strCountry || '').toLowerCase();
  const league = (event.strLeague || '').toLowerCase();
  const home = (event.strHomeTeam || '').toLowerCase();
  const away = (event.strAwayTeam || '').toLowerCase();
  if (UK_COUNTRIES.has(country)) return true;
  if (GLOBAL_KEYWORDS.some((k) => league.includes(k))) return true;
  if (home.includes('england') || away.includes('england')) return true;
  return false;
}

function dateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDay(date, sport) {
  const url = `${BASE}/eventsday.php?d=${date}&s=${encodeURIComponent(sport)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${sport} ${date}: HTTP ${res.status}`);
  const data = await res.json();
  return data.events || [];
}

async function main() {
  const events = [];
  const skippedBySport = {};

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const date = dateString(offset);
    for (const sport of SPORTS) {
      const dayEvents = await fetchDay(date, sport);
      for (const e of dayEvents) {
        if (!isUkRelevant(e)) {
          skippedBySport[sport] = (skippedBySport[sport] || 0) + 1;
          continue;
        }
        const time = e.strTime && e.strTime !== '' ? e.strTime : '00:00:00';
        const start = `${e.dateEvent}T${time}Z`; // TheSportsDB's strTime is UTC
        events.push({
          id: e.idEvent,
          sport: e.strSport,
          league: e.strLeague,
          title: e.strEvent,
          start,
          hasTime: Boolean(e.strTime),
          venue: e.strVenue || null,
          country: e.strCountry || null,
        });
      }
      await sleep(REQUEST_DELAY_MS);
    }
  }

  events.sort((a, b) => a.start.localeCompare(b.start));

  const outPath = path.join(__dirname, '..', 'data', 'events.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: events.length, events }, null, 2)
  );

  console.log(`Wrote ${events.length} UK-relevant events to ${outPath}`);
  console.log('Filtered out (non-UK-relevant) counts by sport:', skippedBySport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
