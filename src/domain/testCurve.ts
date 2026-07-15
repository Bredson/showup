// Showup — Progress-screen test curve (Max Test history segmented per variant).
// User decision (2026-07-15): the chart is drawn as one segment per consecutive
// variant run, each labelled with the variant name; real tests are solid dots,
// seeds/estimates (post-graduation carry-over) are hollow dots.
// RULE: pure functions only; no React/storage imports; order of testHistory is
// preserved (seed points share the date of the graduation test that produced
// them, so sorting by date would shuffle same-date pairs).

import type { ISODate, ProgramState, Variant } from './types';

export interface CurvePoint {
  date: ISODate;
  variant: Variant;
  result: number;
  /** true = estimate (onboarding seed or graduation carry-over), drawn hollow. */
  seed: boolean;
  /** Global x position across the whole history (points are evenly spaced). */
  index: number;
}

/** A consecutive run of tests on one variant — one polyline on the chart. */
export interface CurveSegment {
  variant: Variant;
  points: CurvePoint[];
}

export interface TestCurve {
  segments: CurveSegment[];
  /** Total number of points (= last index + 1); 0 or 1 → no line to draw. */
  pointCount: number;
  /** Highest result so far — the y-scale ceiling (0 when history is empty). */
  maxResult: number;
}

/**
 * Groups testHistory into consecutive same-variant segments.
 * A variant change always starts a new segment, even when the new variant's
 * first point is a seed dated the same day as the previous variant's last test.
 */
export function computeTestCurve(history: ProgramState['testHistory']): TestCurve {
  const segments: CurveSegment[] = [];
  let maxResult = 0;

  history.forEach((t, index) => {
    const point: CurvePoint = {
      date: t.date,
      variant: t.variant,
      result: t.result,
      seed: t.seed === true,
      index,
    };
    const current = segments[segments.length - 1];
    if (current !== undefined && current.variant === t.variant) {
      current.points.push(point);
    } else {
      segments.push({ variant: t.variant, points: [point] });
    }
    if (t.result > maxResult) maxResult = t.result;
  });

  return { segments, pointCount: history.length, maxResult };
}
