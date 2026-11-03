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
  const [baseType, setBaseType] = useState('flat')
  const [stemType, setStemType] = useState('cherry-mx')
  const [decoration, setDecoration] = useState('none')
  const [finish, setFinish] = useState('glossy')
  const [switchType, setSwitchType] = useState('cherry-mx')
  const [supportType, setSupportType] = useState('standard')
  const [materialType, setMaterialType] = useState('pla-standard')
  const [heightMm, setHeightMm] = useState(12)

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
    <div className="app-pro">
      {/* HEADER MINIMALISTA */}
      <header className="header-pro">
        <div className="header-left">
          <h1>🎛️ SHAMMAH CLICKER STUDIO</h1>
          <p>Generador Profesional 3D de Clickers Cherry MX · Versión 2.0</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">📁 Cargar</button>
          <button className="btn-secondary">💾 Guardar</button>
        </div>
      </header>

      <div className="workspace">
        {/* PANEL IZQUIERDO - LIBRARY & CONFIG */}
        <aside className="sidebar-left">
          {/* FORMA & TIPO */}
          <div>
            <div className="panel-header">FORMA & TIPO</div>

            <div className="shapes-library">
              <div className="lib-section">
                <h3>Tipo de Clicker</h3>
                <div className="shape-grid">
                  <button className="shape-btn active">📝 Letra</button>
                  <button className="shape-btn">🔢 Número</button>
                  <button className="shape-btn">✨ Símbolo</button>
                </div>
              </div>
            </div>

            {/* CONFIGURACIÓN BASE */}
            <div className="config-section">
              <label>Tipo de Base</label>
              <select value={baseType} onChange={(e) => setBaseType(e.target.value)} className="select-compact">
                <option value="flat">Plana (Flat)</option>
                <option value="bowl">Cóncava (Bowl)</option>
                <option value="textured">Texturizada</option>
                <option value="concentric">Concéntrica</option>
              </select>
            </div>

            {/* STEM */}
            <div className="config-section">
              <label>Tipo de Stem</label>
              <select value={stemType} onChange={(e) => setStemType(e.target.value)} className="select-compact">
                <option value="cherry-mx">Cherry MX Standard</option>
                <option value="hotswap">Hot Swap</option>
                <option value="integrated">Integrado</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* DECORACIÓN */}
            <div className="config-section">
              <label>Decoración</label>
              <select value={decoration} onChange={(e) => setDecoration(e.target.value)} className="select-compact">
                <option value="none">Sin patrón</option>
                <option value="circles">Ranuras circulares</option>
                <option value="squares">Ranuras cuadradas</option>
                <option value="lines">Líneas</option>
                <option value="waves">Ondas</option>
              </select>
            </div>

            {/* ACABADO */}
            <div className="config-section">
              <label>Acabado</label>
              <select value={finish} onChange={(e) => setFinish(e.target.value)} className="select-compact">
                <option value="glossy">Brillante (Glossy)</option>
                <option value="matte">Mate (Matte)</option>
                <option value="textured">Texturizado</option>
                <option value="satin">Satinado</option>
              </select>
            </div>
          </div>

          {/* LETRA & TIPOGRAFÍA */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '1rem' }}>
            <div className="panel-header">LETRA & TIPOGRAFÍA</div>

            <div className="config-section">
              <label>Letra</label>
              <input
                type="text"
                value={letter}
                onChange={(e) => setLetter(e.target.value.toUpperCase().slice(0, 1) || 'A')}
                maxLength={1}
                className="input-compact input-large"
              />
            </div>

            <div className="config-section">
              <label>Tipografía</label>
              <FontSelector value={fontId} onChange={setFontId} />
            </div>

            {/* ALTURA */}
            <div className="config-section">
              <label>Altura Total: <strong>{heightMm}mm</strong></label>
              <input
                type="range"
                min="8"
                max="16"
                step="0.5"
                value={heightMm}
                onChange={(e) => setHeightMm(parseFloat(e.target.value))}
              />
            </div>

            {/* TAMAÑO LETRA */}
            <div className="config-section">
              <label>Tamaño Letra: <strong>{params.capWidthMm}mm</strong></label>
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={params.capWidthMm || 35}
                onChange={(e) => handleParamChange('capWidthMm', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </aside>

        {/* PANEL CENTRAL - VIEWPORT 3D */}
        <main className="viewport-center">
          {loading ? (
            <div className="loading-overlay">⚙️ Generando geometría profesional...</div>
          ) : geometry ? (
            <Preview3D geometry={geometry.geometry} />
          ) : (
            <div className="error-overlay">Error cargando modelo</div>
          )}

          {/* CONTROLES 3D FLOTANTES */}
          <div className="viewport-controls">
            <button className="vp-btn" title="Rotar">🔄</button>
            <button className="vp-btn" title="Zoom Fit">📐</button>
            <button className="vp-btn" title="Sombras">💡</button>
            <button className="vp-btn" title="Wireframe">🔲</button>
          </div>
        </main>

        {/* PANEL DERECHO - PROPIEDADES */}
        <aside className="sidebar-right">
          {/* CONFIGURACIÓN TÉCNICA */}
          <div>
            <div className="panel-header">CONFIGURACIÓN</div>

            <div className="config-section">
              <label>Switch Type</label>
              <select value={switchType} onChange={(e) => setSwitchType(e.target.value)} className="select-compact">
                <option value="cherry-mx">Cherry MX</option>
                <option value="kailh-box">Kailh Box</option>
                <option value="gateron">Gateron</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="config-section">
              <label>Soportes de Impresión</label>
              <select value={supportType} onChange={(e) => setSupportType(e.target.value)} className="select-compact">
                <option value="none">Ninguno</option>
                <option value="minimal">Mínimo</option>
                <option value="standard">Estándar</option>
                <option value="full">Completo</option>
              </select>
            </div>

            <div className="config-section">
              <label>Material</label>
              <select value={materialType} onChange={(e) => setMaterialType(e.target.value)} className="select-compact">
                <option value="pla-standard">PLA Estándar</option>
                <option value="pla-matte">PLA Matte</option>
                <option value="pla-silk">PLA Silk</option>
                <option value="abs">ABS</option>
                <option value="petg">PETG</option>
                <option value="tpu">TPU</option>
              </select>
            </div>
          </div>

          {/* PARÁMETROS AVANZADOS */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '1rem' }}>
            <div className="panel-header">PARÁMETROS AVANZADOS</div>
            <div className="params-section">
              <ParameterControls params={params} onChange={handleParamChange} />
            </div>
          </div>

          {/* VALIDACIÓN FDM */}
          {geometry && (
            <div style={{ borderTop: '1px solid #333', paddingTop: '1rem' }}>
              <div className="panel-header">VALIDACIÓN FDM</div>
              <div className="robustness-section">
                <RobustnessIndicator score={geometry.robustness} />
              </div>
            </div>
          )}

          {/* EXPORT */}
          {geometry && !loading && (
            <div style={{ borderTop: '1px solid #333', paddingTop: '1rem' }}>
              <ExportButton geometry={geometry.geometry} letter={letter} />
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="quick-actions" style={{ borderTop: '1px solid #333', paddingTop: '1rem' }}>
            <button className="btn-tertiary">⭐ Guardar como Preset</button>
            <button className="btn-tertiary">🔗 Compartir Diseño</button>
          </div>
        </aside>
      </div>

      <footer className="footer-pro">
        <p>© 2026 SHAMMAH Studio | Clickers 3D Profesionales | v2.0</p>
      </footer>
    </div>
  )
}
