import { describe, it, expect, vi, afterEach } from 'vitest';
import { SAMPLES, SampleLoadError, describeLoadError } from '../../src/image/sample';

class FailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  decoding = '';
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('carga de muestras', () => {
  it('rechaza con un mensaje claro que nombra el diseño y no muestra la ruta', async () => {
    vi.stubGlobal('Image', FailingImage);
    const engrane = SAMPLES.find((n) => n.name === 'Engrane')!;
    const err = await engrane.load().then(
      () => null,
      (e) => e,
    );
    expect(err).toBeInstanceOf(SampleLoadError);
    expect(err.message).toContain('"Engrane"');
    expect(err.message).not.toContain('/assets/');
    expect(err.message).not.toContain('Error:');
    expect(describeLoadError(err)).toBe(err.message);
  });
});

describe('describeLoadError', () => {
  it('muestra solo el mensaje de una muestra, sin prefijo', () => {
    expect(describeLoadError(new SampleLoadError('Engrane'))).not.toMatch(/leer la imagen|Error:/);
  });
  it('mantiene el prefijo para fallos de decodificación de archivos subidos', () => {
    expect(describeLoadError(new Error('formato raro'))).toBe(
      'No se pudo leer la imagen: formato raro',
    );
    expect(describeLoadError('texto')).toBe('No se pudo leer la imagen: texto');
  });
});
