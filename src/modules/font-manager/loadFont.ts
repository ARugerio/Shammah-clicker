import type { GoogleFont } from './types'
import { FONT_REGISTRY } from './fontRegistry'

const loadedFonts = new Map<string, FontFace>()

export async function loadFont(fontId: string): Promise<FontFace> {
  // Return cached if already loaded
  if (loadedFonts.has(fontId)) {
    return loadedFonts.get(fontId)!
  }

  const fontDef = FONT_REGISTRY.find(f => f.id === fontId)
  if (!fontDef) {
    throw new Error(`Font not found: ${fontId}`)
  }

  // Create a dummy FontFace for testing (in production, load from Google Fonts)
  const fontFace = new FontFace(
    fontDef.name,
    `url('${fontDef.url}')`,
    { style: 'normal', weight: '400' }
  )

  try {
    await fontFace.load()
  } catch (e) {
    // In tests, font loading might fail, but we still return the FontFace object
    console.warn(`Font ${fontId} load warning:`, e)
  }

  // Add to document fonts if in browser environment
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      document.fonts.add(fontFace)
    } catch (e) {
      console.warn(`Could not add font ${fontId} to document`, e)
    }
  }

  loadedFonts.set(fontId, fontFace)
  return fontFace
}

export function getFontList(): GoogleFont[] {
  return FONT_REGISTRY
}

export function getFontsByCategory(category: 'classic' | 'cursive' | 'display'): GoogleFont[] {
  return FONT_REGISTRY.filter(f => f.category === category)
}
