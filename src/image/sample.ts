// Diseños de muestra propios, empaquetados como SVG de un solo color en public/assets/samples.
// Elegir uno lo rasteriza y lo manda por la misma ruta que una imagen subida.
import type { RgbaImage } from './decode';

const SAMPLE_DIR = import.meta.env.BASE_URL + 'assets/samples/';
const RASTER_SIZE = 512;

export interface SampleInfo {
  name: string;
  /** URL de la miniatura / vista previa (el propio SVG). */
  src: string;
  /** Rasteriza el SVG a un RgbaImage para el pipeline. */
  load: () => Promise<RgbaImage>;
}

// createImageBitmap no decodifica SVG de forma fiable, así que se dibuja en un canvas con fondo blanco.
async function rasterizeSvg(src: string): Promise<RgbaImage> {
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`No se pudo cargar la muestra: ${src}`));
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = RASTER_SIZE;
  canvas.height = RASTER_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo crear el lienzo para la muestra');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, RASTER_SIZE, RASTER_SIZE);
  ctx.drawImage(img, 0, 0, RASTER_SIZE, RASTER_SIZE);
  const { data, width, height } = ctx.getImageData(0, 0, RASTER_SIZE, RASTER_SIZE);
  return { data, width, height };
}

function sample(file: string, name: string): SampleInfo {
  const src = SAMPLE_DIR + file;
  return { name, src, load: () => rasterizeSvg(src) };
}

export const SAMPLES: SampleInfo[] = [
  sample('monograma-s.svg', 'Monograma S'),
  sample('llama.svg', 'Llama'),
  sample('rayo.svg', 'Rayo'),
  sample('engrane.svg', 'Engrane'),
  sample('flor.svg', 'Flor'),
];

export interface SvgSampleInfo {
  name: string;
  src: string;
}

// Los mismos cinco, como preajustes vectoriales en el panel SVG.
export const SVG_SAMPLES: SvgSampleInfo[] = SAMPLES.map(({ name, src }) => ({ name, src }));
