import type { ViewMode } from '../types';

/** Desplazamiento de la tapa para una explosión parcial: t se acota a [0, 1] (NaN cuenta como 0). */
export function explosionOffset(t: number, fullOffset: number): number {
  if (!(t > 0)) return 0;
  return Math.min(t, 1) * fullOffset;
}

/**
 * Nueva explosión al cambiar de vista: 'assembled' la deja en 0; entrar a 'exploded' desde otra
 * vista la lleva a 1; permanecer en 'exploded' (o estar en 'section') conserva el valor previo.
 */
export function nextExplosion(prevMode: ViewMode, mode: ViewMode, prevT: number): number {
  if (mode === 'assembled') return 0;
  if (mode === 'exploded') return prevMode === 'exploded' ? prevT : 1;
  return prevT;
}
