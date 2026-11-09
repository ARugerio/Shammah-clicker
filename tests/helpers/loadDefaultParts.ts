import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ClickerPart } from '../../src/types';

/** Lee public/assets/default-clicker.json igual que loadDefaultClicker en src/main.ts. */
export function loadDefaultParts(): ClickerPart[] {
  const file = resolve(__dirname, '../../public/assets/default-clicker.json');
  const serialized = JSON.parse(readFileSync(file, 'utf8'));
  return serialized.map((p: any) => ({
    kind: p.kind,
    group: p.group,
    colorRgb: p.colorRgb,
    name: p.name,
    numProp: p.numProp,
    vertProperties: new Float32Array(p.vertProperties),
    triVerts: new Uint32Array(p.triVerts),
  }));
}
