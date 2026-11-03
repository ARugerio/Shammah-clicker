import React from 'react'
import type { LetterGeometryParams } from '../letter-engine/types'

interface ParameterControlsProps {
  params: Partial<LetterGeometryParams>
  onChange: (key: keyof LetterGeometryParams, value: number) => void
}

export function ParameterControls({ params, onChange }: ParameterControlsProps) {
  return (
    <div className="parameter-controls">
      <div className="slider-group">
        <label>📏 Tamaño: <span>{params.capWidthMm || 35}mm</span></label>
        <input
          type="range"
          min="15"
          max="60"
          step="1"
          value={params.capWidthMm || 35}
          onChange={(e) => onChange('capWidthMm', parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <label>📊 Profundidad: <span>{params.imageDepth || 0.8}mm</span></label>
        <input
          type="range"
          min="0.4"
          max="2"
          step="0.1"
          value={params.imageDepth || 0.8}
          onChange={(e) => onChange('imageDepth', parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <label>🔨 Grosor paredes: <span>{params.topThickness || 1.5}mm</span></label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={params.topThickness || 1.5}
          onChange={(e) => onChange('topThickness', parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <label>⚙️ Tolerancia: <span>{params.tolerance || 0.4}mm</span></label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={params.tolerance || 0.4}
          onChange={(e) => onChange('tolerance', parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}
