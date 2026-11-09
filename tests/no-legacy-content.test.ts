// @vitest-environment happy-dom
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SAMPLES, SVG_SAMPLES } from '../src/image/sample';

const ROOT = resolve(__dirname, '..');
const BANNED = [
  'Últimas actualizaciones', 'Trazado ultra-fino', 'Módulo de Llavero',
  'Bienvenido a SHAMMAH Clicker Studio', 'Menú de Importación',
  'heart.png', 'paw.png', 'dog.png', 'cheese.png', 'radiation.png',
  'bambulab.svg', 'instagram.svg', 'youtube.svg',
];
const NAMES = ['Monograma S', 'Llama', 'Rayo', 'Engrane', 'Flor'];
const FILES = ['monograma-s', 'llama', 'rayo', 'engrane', 'flor'];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function toPublicPath(src: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const rel = src.startsWith(base) ? src.slice(base.length) : src.replace(/^\//, '');
  return join(ROOT, 'public', rel);
}

describe('contenido heredado', () => {
  it('src/ e index.html no contienen textos ni archivos heredados', () => {
    const files = [...walk(join(ROOT, 'src')), join(ROOT, 'index.html')];
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const b of BANNED) if (text.includes(b)) hits.push(`${f.replace(ROOT, '')}: ${b}`);
    }
    expect(hits).toEqual([]);
  });
});

describe('muestras propias', () => {
  it('SAMPLES y SVG_SAMPLES son los cinco diseños propios', () => {
    expect(SAMPLES.map((s) => s.name)).toEqual(NAMES);
    expect(SVG_SAMPLES.map((s) => s.name)).toEqual(NAMES);
  });

  it('cada src existe en public/', () => {
    for (const s of [...SAMPLES, ...SVG_SAMPLES]) expect(existsSync(toPublicPath(s.src)), s.src).toBe(true);
  });

  it.each(FILES)('%s.svg es un SVG limpio de un solo color', (f) => {
    const text = readFileSync(join(ROOT, 'public/assets/samples', `${f}.svg`), 'utf8');
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.tagName.toLowerCase()).toBe('svg');
    expect(text).toContain('viewBox="0 0 256 256"');
    expect(text).not.toMatch(/<text|<image|<script|<linearGradient|<radialGradient/i);
    expect(text).not.toMatch(/href\s*=\s*["'](https?:)?\/\//i);
    expect(text).not.toMatch(/stroke=/i);
  });
});
