import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.ts') && !full.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/**
 * IDs que src/**\/*.ts busca en el DOM con getElementById('x'), $('x') / $<T>('x')
 * o querySelector('#x'). Solo literales simples; devuelve la lista ordenada y sin repetir.
 */
export function collectReferencedIds(): string[] {
  const root = resolve(__dirname, '../../src');
  const patterns = [
    /getElementById\(\s*['"]([\w-]+)['"]\s*\)/g,
    /(?<![\w.])\$(?:<[^>()]*>)?\(\s*['"]([\w-]+)['"]\s*\)/g,
    /querySelector\(\s*['"]#([\w-]+)['"]\s*\)/g,
  ];
  const ids = new Set<string>();
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8');
    for (const re of patterns) {
      for (const m of text.matchAll(re)) ids.add(m[1]);
    }
  }
  return [...ids].sort();
}
