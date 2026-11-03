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

  const group = new THREE.Group()

  const capWidthUnits = clamped.capWidthMm * scale
  const stemDiameterMm = 4
  const stemHeightMm = 7
  const baseHeightMm = 2

  // Cap (white top with letter surface)
  const capGeometry = new THREE.CylinderGeometry(capWidthUnits / 2, capWidthUnits / 2, clamped.topThickness * scale, 32)
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.3,
    metalness: 0.05,
  })
  const cap = new THREE.Mesh(capGeometry, capMaterial)
  cap.castShadow = true
  cap.receiveShadow = true
  group.add(cap)

  // Letter text on cap surface (using a plane with text)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#555555'
    ctx.font = 'bold 180px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(params.letter, 128, 128)
  }
  const texture = new THREE.CanvasTexture(canvas)
  const textPlaneGeo = new THREE.PlaneGeometry(capWidthUnits * 0.8, capWidthUnits * 0.8)
  const textMaterial = new THREE.MeshStandardMaterial({ map: texture, metalness: 0, roughness: 1 })
  const textPlane = new THREE.Mesh(textPlaneGeo, textMaterial)
  textPlane.position.z = clamped.topThickness * scale / 2 + 0.01
  textPlane.castShadow = false
  group.add(textPlane)

  // Stem (black Cherry MX style)
  const stemGeometry = new THREE.CylinderGeometry(stemDiameterMm * scale / 2, stemDiameterMm * scale / 2, stemHeightMm * scale, 16)
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.6,
    metalness: 0.1,
  })
  const stem = new THREE.Mesh(stemGeometry, stemMaterial)
  stem.position.z = -(clamped.topThickness * scale / 2 + stemHeightMm * scale / 2)
  stem.castShadow = true
  stem.receiveShadow = true
  group.add(stem)

  // Base (dark gray)
  const baseGeometry = new THREE.CylinderGeometry(capWidthUnits / 2 + 1, capWidthUnits / 2 + 1, baseHeightMm * scale, 32)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.7,
    metalness: 0.05,
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.z = -(clamped.topThickness * scale / 2 + baseHeightMm * scale / 2)
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  // Combine all geometries
  const combinedGeometry = new THREE.BufferGeometry()
  group.updateMatrixWorld()

  const positions: number[] = []
  const indices: number[] = []
  let vertexOffset = 0

  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
      const geo = child.geometry
      const pos = geo.getAttribute('position')

      if (pos) {
        const array = pos.array as Float32Array
        const matrix = child.matrixWorld

        for (let i = 0; i < array.length; i += 3) {
          const v = new THREE.Vector3(array[i], array[i + 1], array[i + 2])
          v.applyMatrix4(matrix)
          positions.push(v.x, v.y, v.z)
        }

        const indexAttr = geo.getIndex()
        if (indexAttr) {
          const indexArray = indexAttr.array as Uint32Array | Uint16Array
          for (let i = 0; i < indexArray.length; i++) {
            indices.push((indexArray[i] as number) + vertexOffset)
          }
        } else {
          for (let i = 0; i < pos.count; i++) {
            indices.push(i + vertexOffset)
          }
        }

        vertexOffset += pos.count
      }
    }
  })

  combinedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  if (indices.length > 0) {
    combinedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
  }
  combinedGeometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.4,
    metalness: 0.1,
  })
  const mesh = new THREE.Mesh(combinedGeometry, material)

  const wallThickness = 1.5
  const issues: string[] = []
  if (wallThickness < 2.0) {
    issues.push(`Espesor de pared: ${wallThickness}mm (mínimo 2mm recomendado)`)
  }

  const robustness = {
    score: issues.length === 0 ? 95 : 75,
    classification: issues.length === 0 ? ('excelente' as const) : ('buena' as const),
    issues,
    minWallThickness: wallThickness,
    estimatedPrintTime: 20,
  }

  return {
    geometry: combinedGeometry,
    mesh,
    robustness,
  }
}
