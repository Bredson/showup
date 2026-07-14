// The ONLY place in the UI that reads the wall clock. Domain functions take these as inputs
// (rule: no new Date() inside src/domain/).
import type { ISODate, ISODateTime } from '../domain/types';

/** Local calendar date "YYYY-MM-DD" — day boundary is local midnight (data-model §1). */
export function localToday(d: Date = new Date()): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nowISO(): ISODateTime {
  return new Date().toISOString();
}

export function currentHour(): number {
  return new Date().getHours();
}

/** Milliseconds since epoch — for deadline math (background tabs throttle intervals). */
export function nowMs(): number {
  return Date.now();
}
