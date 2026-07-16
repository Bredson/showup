// Shared weekday chip picker (onboarding StepDays + Settings session-days section).
// Owns the Monday-first display order and the chip a11y contract (aria-pressed state);
// selection state and validation MESSAGING stay with the caller — each screen keeps its
// own always-rendered status region (count hint / adjacency error / save outcome).
import type { Weekday } from '../../domain/types';
import { useT } from '../LangContext';

/** Monday-first display order for the weekday chips (Weekday: 0 = Sunday). */
const WEEK_MON_FIRST: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export default function DayPicker({
  value,
  onToggle,
  disabled = false,
  label,
}: {
  value: readonly Weekday[];
  onToggle: (day: Weekday) => void;
  /** Disable every chip (e.g. while a data operation is in flight, code-style F9). */
  disabled?: boolean;
  /** Accessible name of the group — screens pass their own i18n'd heading. */
  label: string;
}) {
  const t = useT();
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {WEEK_MON_FIRST.map((d) => (
        <button
          key={d}
          type="button"
          className={`chip ${value.includes(d) ? 'chip--selected' : ''}`}
          aria-pressed={value.includes(d)}
          disabled={disabled}
          onClick={() => onToggle(d)}
        >
          {t(`weekday.${d}`)}
        </button>
      ))}
    </div>
  );
}
