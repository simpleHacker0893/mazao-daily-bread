import type { Day, IsoTime } from "./types";

// Nairobi is UTC+3 all year (no daylight saving), so day maths is plain offset arithmetic.
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DayRange = [start: IsoTime, end: IsoTime];

/** Due-date rules offered as chips. Code ids, not display text; labels come from i18n. */
export type DueRule = "kesho" | "ijumaa" | "wiki_ijayo" | "mwisho_wa_mwezi";

function dayStartUtcMs(day: Day): number {
  return Date.parse(`${day}T00:00:00.000Z`) - EAT_OFFSET_MS;
}

function toDay(utcMs: number): Day {
  return new Date(utcMs + EAT_OFFSET_MS).toISOString().slice(0, 10);
}

/** [midnight EAT, next midnight EAT) as UTC instants. */
export function nairobiDayRange(day: Day): DayRange {
  const start = dayStartUtcMs(day);
  return [
    new Date(start).toISOString(),
    new Date(start + DAY_MS).toISOString(),
  ];
}

export function isInRange(at: IsoTime, [start, end]: DayRange): boolean {
  const ms = Date.parse(at);
  return ms >= Date.parse(start) && ms < Date.parse(end);
}

/** The EAT calendar day of `now`. Callers pass the clock in; nothing here reads it. */
export function todayInNairobi(now: Date): Day {
  return toDay(now.getTime());
}

/** The EAT calendar day that an instant falls in. */
export function nairobiDayOf(at: IsoTime): Day {
  return toDay(Date.parse(at));
}

/** "14:05" in Nairobi time (24-hour). */
export function formatNairobiTime(at: IsoTime): string {
  return new Date(Date.parse(at) + EAT_OFFSET_MS).toISOString().slice(11, 16);
}

/**
 * "Mon 26 Oct 2026" in English; Kiswahili day and month names come from the platform's
 * `sw-KE` locale data. A day is a plain calendar date, so the formatter runs in UTC.
 */
export function formatNairobiDate(day: Day, locale: "en" | "sw"): string {
  const parts = new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${day}T00:00:00.000Z`));
  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")} ${pick("year")}`;
}

function addDays(day: Day, n: number): Day {
  return toDay(dayStartUtcMs(day) + n * DAY_MS);
}

export function resolveDueRule(rule: DueRule, today: Day): Day {
  switch (rule) {
    case "kesho":
      return addDays(today, 1);
    case "wiki_ijayo":
      return addDays(today, 7);
    case "ijumaa": {
      const weekday = new Date(`${today}T00:00:00.000Z`).getUTCDay(); // 5 = Friday
      const ahead = (5 - weekday + 7) % 7 || 7;
      return addDays(today, ahead);
    }
    case "mwisho_wa_mwezi": {
      const [year, month] = today.split("-").map(Number) as [number, number];
      const last = new Date(Date.UTC(year, month, 0)); // day 0 of next month
      return last.toISOString().slice(0, 10);
    }
  }
}
