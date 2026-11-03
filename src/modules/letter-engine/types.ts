import * as THREE from 'three'

export interface LetterGeometryParams {
  letter: string
  fontId: string
  capWidthMm: number
  topThickness: number
  imageDepth: number
  tolerance: number
  stemTolerance: number
}

export interface RobustnessScore {
  score: number
  classification: 'excelente' | 'buena' | 'débil'
  issues: string[]
  minWallThickness: number
  estimatedPrintTime: number
}

export interface GeometryResult {
  geometry: THREE.BufferGeometry
  mesh: THREE.Mesh
  robustness: RobustnessScore
}
