import React, { useState, useEffect } from 'react'
import { FontSelector } from './modules/ui-components/FontSelector'
import { ParameterControls } from './modules/ui-components/ParameterControls'
import { Preview3D } from './modules/ui-components/Preview3D'
import { RobustnessIndicator } from './modules/ui-components/RobustnessIndicator'
import { ExportButton } from './modules/ui-components/ExportButton'
import { generateGeometry } from './modules/letter-engine/generateGeometry'
import type { LetterGeometryParams, GeometryResult } from './modules/letter-engine/types'

export function App() {
  const [letter, setLetter] = useState('A')
  const [fontId, setFontId] = useState('roboto')
  const [params, setParams] = useState<Partial<LetterGeometryParams>>({
    capWidthMm: 35,
    topThickness: 1.5,
    imageDepth: 0.8,
    tolerance: 0.4,
    stemTolerance: 0,
  })
  const [geometry, setGeometry] = useState<GeometryResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const generate = async () => {
      setLoading(true)
      try {
        const result = await generateGeometry({
          letter,
          fontId,
          capWidthMm: params.capWidthMm || 35,
          topThickness: params.topThickness || 1.5,
          imageDepth: params.imageDepth || 0.8,
          tolerance: params.tolerance || 0.4,
          stemTolerance: params.stemTolerance || 0,
        })
        setGeometry(result)
      } catch (error) {
        console.error('Error generando geometría:', error)
      } finally {
        setLoading(false)
      }
    }

    generate()
  }, [letter, fontId, params])

  const handleParamChange = (key: keyof LetterGeometryParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="app-container">
      <header>
        <h1>🖨️ SHAMMAH Letter Clicker Studio</h1>
        <p>Generador 3D de clickers Cherry MX para Bambu Lab P2S</p>
      </header>

      <main>
        <section className="controls">
          <div className="input-group">
            <label htmlFor="letter-input">📝 Letra:</label>
            <input
              id="letter-input"
              type="text"
              value={letter}
              onChange={(e) => setLetter(e.target.value.toUpperCase().slice(0, 1) || 'A')}
              maxLength={1}
              style={{ width: 50, fontSize: 24, textAlign: 'center' }}
            />
          </div>

          <FontSelector value={fontId} onChange={setFontId} />
          <ParameterControls params={params} onChange={handleParamChange} />
        </section>

        <section className="preview">
          {loading ? (
            <div className="loading">Generando geometría...</div>
          ) : geometry ? (
            <>
              <Preview3D geometry={geometry.geometry} />
              <RobustnessIndicator score={geometry.robustness} />
              <ExportButton geometry={geometry.geometry} letter={letter} />
            </>
          ) : (
            <div className="error">Error generando geometría</div>
          )}
        </section>
      </main>

      <footer>
        <p>© 2026 SHAMMAH Studio - Generador de clickers Cherry MX</p>
      </footer>
    </div>
  )
}
