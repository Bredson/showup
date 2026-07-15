// Feel → emoji, shared by the entry sheet and the journal rows (language-neutral
// data; labels come from i18n `today.feel.*`). Own module per code-style F6:
// shared maps get extracted, not side-exported from a component.
import type { Feel } from '../domain/types';

export const FEEL_EMOJI: Record<Feel, string> = {
  fresh: '😃',
  ok: '🙂',
  tired: '😮‍💨',
  pain: '🤕',
};
