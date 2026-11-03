import { useState, useEffect } from 'react'
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
        <h1>🎛️ SHAMMAH <span>CLICKER</span></h1>
        <p>Generador 3D de clickers Cherry MX para Bambu Lab P2S</p>
      </header>

      <main>
        <section className="controls">
          {/* INPUT LETRA */}
          <div className="control-section">
            <div className="input-group">
              <label htmlFor="letter-input">📝 Ingresa tu Letra</label>
              <input
                id="letter-input"
                type="text"
                value={letter}
                onChange={(e) => setLetter(e.target.value.toUpperCase().slice(0, 1) || 'A')}
                maxLength={1}
                className="glass-input"
                style={{ fontSize: '2.5em', textAlign: 'center', fontWeight: 900, letterSpacing: '-0.05em' }}
              />
            </div>
          </div>

          {/* SELECTOR DE FUENTE */}
          <div className="control-section">
            <FontSelector value={fontId} onChange={setFontId} />
          </div>

          {/* CONTROLES DE PARÁMETROS */}
          <div className="control-section">
            <ParameterControls params={params} onChange={handleParamChange} />
          </div>

          {/* EXPORT BUTTON */}
          {geometry && !loading && (
            <ExportButton geometry={geometry.geometry} letter={letter} />
          )}
        </section>

        {/* PREVIEW Y SIDEBAR */}
        <section className="preview">
          {loading ? (
            <div className="loading">⚙️ Generando geometría 3D...</div>
          ) : geometry ? (
            <>
              <Preview3D geometry={geometry.geometry} />

              {/* SIDEBAR STICKY */}
              <div className="sidebar">
                <div className="sidebar-title">📊 Características del Clicker</div>

                <div className="sidebar-stat">
                  <div className="stat-value">{letter}</div>
                  <div className="stat-label">Letra Seleccionada</div>
                </div>

                <div className="sidebar-stat">
                  <div className="stat-value">{params.capWidthMm}mm</div>
                  <div className="stat-label">Tamaño Total</div>
                </div>

                <div className="sidebar-stat">
                  <div className="stat-value">{geometry.robustness.score}/100</div>
                  <div className="stat-label">Robustez FDM</div>
                </div>

                {/* ROBUSTNESS INDICATOR */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <RobustnessIndicator score={geometry.robustness} />
                </div>
              </div>
            </>
          ) : (
            <div className="error">❌ Error generando geometría</div>
          )}
        </section>
      </main>

      <footer>
        <p>© 2026 SHAMMAH Studio · Generador de clickers Cherry MX · Diseño abierto</p>
      </footer>
    </div>
  )
}
