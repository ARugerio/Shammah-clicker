import { describe, it, expect } from 'vitest'
import { loadFont, getFontList } from '../../src/modules/font-manager/loadFont'

describe('FontManager', () => {
  it('debería retornar lista de fuentes disponibles', () => {
    const fonts = getFontList()
    expect(fonts.length).toBeGreaterThan(10)
    expect(fonts.some(f => f.id === 'arial')).toBe(true)
    expect(fonts.some(f => f.id === 'roboto')).toBe(true)
  })

  it('debería encontrar fuente arial en registry', () => {
    const fonts = getFontList()
    const arial = fonts.find(f => f.id === 'arial')
    expect(arial).toBeDefined()
    expect(arial?.name).toBe('Arial')
    expect(arial?.category).toBe('classic')
  })

  it('debería lanzar error si fontId no existe', async () => {
    await expect(loadFont('font-inexistente')).rejects.toThrow('Font not found')
  })

  it('debería cargar fuente arial (básico)', async () => {
    const font = await loadFont('arial')
    expect(font).toBeDefined()
    expect(font).toBeInstanceOf(FontFace)
  })
})
