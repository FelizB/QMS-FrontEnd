// color-picker.ts
import { GRADIENTS, type GradientClass } from './colors';

// Simple string hash to seed a pseudo-random selection
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // Convert to 32-bit integer
  }
  return Math.abs(h);
}

function getBucket(level: number): keyof typeof GRADIENTS {
  const pct = Math.max(0, Math.min(100, level));
  if (pct < 25) return 'low';
  if (pct < 50) return 'mid';
  if (pct < 80) return 'high';
  return 'elite';
}

/**
 * Deterministic random gradient for a given skill name + level.
 * Same (name, level) -> same gradient every time.
 */
export function pickGradientForLevel(name: string, level: number): GradientClass {
  const bucket = getBucket(level);
  const palette = GRADIENTS[bucket];
  if ((palette as readonly string[]).length === 1) return palette[0];

  // Mix name + level to get a stable seed
  const seed = hashString(`${name}:${level}`);
  const idx = seed % palette.length;
  return palette[idx];
}