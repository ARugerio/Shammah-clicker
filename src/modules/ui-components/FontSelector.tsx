import { getFontList } from '../font-manager/loadFont'

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

  const selectedFont = fonts.find(f => f.id === value)

  return (
    <div className="font-selector">
      <label htmlFor="font-select">🔤 Selecciona tu Tipografía</label>
      <select
        id="font-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input"
      >
        <optgroup label="📌 Clásicas">
          {grouped.classic.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
        <optgroup label="✨ Cursivas">
          {grouped.cursive.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
        <optgroup label="🎨 Display">
          {grouped.display.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </optgroup>
      </select>
      {selectedFont && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          {selectedFont.category === 'classic' && '📌 Tipografía Clásica'}
          {selectedFont.category === 'cursive' && '✨ Tipografía Cursiva'}
          {selectedFont.category === 'display' && '🎨 Tipografía Display'}
        </div>
      )}
    </div>
  )
}
