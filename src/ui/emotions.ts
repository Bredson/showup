// Shared emotion emoji map — used by the loop's emotion step and entry previews (Progress/Journal).
import type { Emotion } from '../domain/types';

export const EMOTION_EMOJI: Record<Emotion, string> = {
  anxiety: '😰',
  boredom: '😑',
  overwhelm: '🌊',
  aversion: '😤',
  confusion: '🌫',
};
