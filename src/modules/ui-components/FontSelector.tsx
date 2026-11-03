import React from 'react'
import { getFontList } from '../font-manager/loadFont'
import type { GoogleFont } from '../font-manager/types'

interface FontSelectorProps {
  value: string
  onChange: (fontId: string) => void
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
  const fonts = getFontList()
  const grouped = {
    classic: fonts.filter(f => f.category === 'classic'),
    cursive: fonts.filter(f => f.category === 'cursive'),
    display: fonts.filter(f => f.category === 'display'),
  }

  return (
    <div className="font-selector">
      <label htmlFor="font-select">🔤 Fuente:</label>
      <select
        id="font-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <optgroup label="Clásicas">
          {grouped.classic.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
        <optgroup label="Cursivas">
          {grouped.cursive.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
        <optgroup label="Display">
          {grouped.display.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
