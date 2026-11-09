/** Desplazamiento de la tapa para una explosión parcial: t se acota a [0, 1] (NaN cuenta como 0). */
export function explosionOffset(t: number, fullOffset: number): number {
  if (!(t > 0)) return 0;
  return Math.min(t, 1) * fullOffset;
}
