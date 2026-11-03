import * as THREE from 'three'
import type { LetterGeometryParams, GeometryResult } from './types'

function clampParams(params: LetterGeometryParams): LetterGeometryParams {
  return {
    ...params,
    capWidthMm: Math.max(15, Math.min(60, params.capWidthMm)),
    topThickness: Math.max(1, Math.min(3, params.topThickness)),
    imageDepth: Math.max(0.4, Math.min(2, params.imageDepth)),
    tolerance: Math.max(0.1, Math.min(1.0, params.tolerance)),
    stemTolerance: Math.max(-1.0, Math.min(1.0, params.stemTolerance)),
  }
}

export async function generateGeometry(params: LetterGeometryParams): Promise<GeometryResult> {
  if (!params.letter || params.letter.trim() === '') {
    throw new Error('Letter cannot be empty')
  }

  const clamped = clampParams(params)

  // Create simple box geometry as placeholder
  const geometry = new THREE.BoxGeometry(
    clamped.capWidthMm / 10,
    clamped.capWidthMm / 10,
    clamped.topThickness
  )

  const robustness = {
    score: 85,
    classification: 'buena' as const,
    issues: [],
    minWallThickness: 2.0,
    estimatedPrintTime: 15,
  }

  const material = new THREE.MeshPhongMaterial({ color: 0x0066cc })
  const mesh = new THREE.Mesh(geometry, material)

  return {
    geometry,
    mesh,
    robustness,
  }
}
