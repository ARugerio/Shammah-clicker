import { describe, it, expect } from 'vitest';
import {
  msgSvgSelected, msgIconSelected, msgTextChanged, msgFontChanged, msgFontImported,
} from '../../src/ui/statusMessages';

describe('mensajes que indican dónde está Generar', () => {
  const all = [
    msgSvgSelected('Llama'), msgIconSelected('heart'), msgTextChanged(), msgFontChanged(), msgFontImported('Mi Fuente'),
  ];
  it('todos nombran «Generar geometría» y el panel Diseño', () => {
    for (const m of all) {
      expect(m).toContain('«Generar geometría»');
      expect(m).toContain('panel Diseño');
      expect(m).not.toContain('Haz clic en Generar');
    }
  });
  it('conservan su contexto', () => {
    expect(msgSvgSelected('Llama')).toBe('SVG seleccionado: Llama. Pulsa «Generar geometría» en el panel Diseño para ver el cambio.');
    expect(msgTextChanged()).toBe('Texto actualizado. Pulsa «Generar geometría» en el panel Diseño para ver el cambio.');
    expect(msgFontImported('Mi Fuente')).toContain('Mi Fuente');
  });
});
