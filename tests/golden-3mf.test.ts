import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';
import { buildThreeMF } from '../src/export/threemfExport';
import { loadDefaultParts } from './helpers/loadDefaultParts';

/** Quita lo que cambia entre ejecuciones: fechas y UUID. */
function normalize(xml: string): string {
  return xml
    .replace(/<metadata name="(CreationDate|ModificationDate)">[^<]*<\/metadata>/g, '')
    .replace(/\s*(p:)?UUID="[^"]*"/gi, '')
    .replace(/Created: [\d-]+/g, 'Created: X');
}

function hashes(): Record<string, string> {
  const files = unzipSync(buildThreeMF(loadDefaultParts()));
  for (const required of ['[Content_Types].xml', '3D/3dmodel.model', 'Metadata/model_settings.config']) {
    expect(Object.keys(files), `falta ${required}`).toContain(required);
  }
  const out: Record<string, string> = {};
  for (const name of Object.keys(files).sort()) {
    if (!/\.(xml|model|config|rels)$/.test(name)) continue;
    out[name] = createHash('sha256').update(normalize(strFromU8(files[name]))).digest('hex');
  }
  return out;
}

describe('3MF dorado', () => {
  it('es determinista y coincide con el snapshot', () => {
    const a = hashes();
    const b = hashes();
    expect(a).toEqual(b);
    expect(a).toMatchSnapshot();
  });
});
