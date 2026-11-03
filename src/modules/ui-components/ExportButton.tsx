import React, { useState } from 'react'
import * as THREE from 'three'
import { export3MF } from '../export-engine/to3MF'

interface ExportButtonProps {
  geometry: THREE.BufferGeometry
  letter: string
}

export function ExportButton({ geometry, letter }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const blob = await export3MF(geometry, letter)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${letter}_35mm_${new Date().toISOString().split('T')[0]}.3mf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="export-button"
    >
      {loading ? '⏳ Generando...' : '📥 Descargar .3mf'}
    </button>
  )
}
