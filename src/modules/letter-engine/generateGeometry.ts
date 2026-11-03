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
  const scale = 0.1

  // Create combined geometry using BufferGeometry directly
  const geometry = new THREE.BufferGeometry()

  // Clicker cap (white cylinder)
  const capRadius = clamped.capWidthMm * scale / 2
  const capHeight = clamped.topThickness * scale
  const segments = 32

  const positions: number[] = []
  const indices: number[] = []
  let vertexIndex = 0

  // Cap vertices
  const capVertices: number[][] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * capRadius
    const z = Math.sin(angle) * capRadius
    const y = capHeight / 2
    capVertices.push([x, y, z])
    positions.push(x, y, z)
  }

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * capRadius
    const z = Math.sin(angle) * capRadius
    const y = -capHeight / 2
    capVertices.push([x, y, z])
    positions.push(x, y, z)
  }

  // Cap top center
  positions.push(0, capHeight / 2, 0)
  const capTopCenter = vertexIndex + segments * 2

  // Cap bottom center
  positions.push(0, -capHeight / 2, 0)
  const capBottomCenter = vertexIndex + segments * 2 + 1

  // Cap top faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    indices.push(i, capTopCenter, next)
  }

  // Cap bottom faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    indices.push(segments + i, next + segments, capBottomCenter)
  }

  // Cap side faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    indices.push(i, next, segments + i)
    indices.push(next, segments + next, segments + i)
  }

  vertexIndex += segments * 2 + 2

  // Stem (black cylinder, smaller)
  const stemRadius = 4 * scale / 2
  const stemHeight = 7 * scale
  const stemStartIndex = vertexIndex

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * stemRadius
    const z = Math.sin(angle) * stemRadius
    const y = -capHeight / 2 - stemHeight / 2
    positions.push(x, y, z)
  }

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * stemRadius
    const z = Math.sin(angle) * stemRadius
    const y = -capHeight / 2 + stemHeight / 2
    positions.push(x, y, z)
  }

  // Stem top center
  positions.push(0, -capHeight / 2 + stemHeight / 2, 0)
  const stemTopCenter = stemStartIndex + segments * 2

  // Stem bottom center
  positions.push(0, -capHeight / 2 - stemHeight / 2, 0)
  const stemBottomCenter = stemStartIndex + segments * 2 + 1

  // Stem faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    indices.push(
      stemStartIndex + i,
      stemStartIndex + next,
      stemStartIndex + segments + i
    )
    indices.push(
      stemStartIndex + next,
      stemStartIndex + segments + next,
      stemStartIndex + segments + i
    )
  }

  // Stem top faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    indices.push(
      stemStartIndex + segments + i,
      stemTopCenter,
      stemStartIndex + segments + next
    )
  }

  // Stem bottom faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    indices.push(
      stemStartIndex + i,
      stemStartIndex + next,
      stemBottomCenter
    )
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
  geometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.4,
    metalness: 0.1,
  })

  const mesh = new THREE.Mesh(geometry, material)

  const robustness = {
    score: 90,
    classification: 'buena' as const,
    issues: [],
    minWallThickness: 1.5,
    estimatedPrintTime: 20,
  }

  return {
    geometry,
    mesh,
    robustness,
  }
}
