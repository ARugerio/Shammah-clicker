export interface GoogleFont {
  id: string
  name: string
  category: 'classic' | 'cursive' | 'display'
  url: string
  variants: string[]
}

export type FontFamily = FontFace
