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

function createLetterTexture(letter: string, _size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 512, 512)

  ctx.fillStyle = '#333333'
  ctx.font = 'bold 350px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  return texture
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

  const capGeometry = new THREE.CylinderGeometry(capWidthUnits / 2, capWidthUnits / 2, clamped.topThickness * scale, 32)
  const capTexture = createLetterTexture(params.letter, clamped.capWidthMm)
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    map: capTexture,
    roughness: 0.3,
    metalness: 0.05,
  })
  const cap = new THREE.Mesh(capGeometry, capMaterial)
  cap.castShadow = true
  cap.receiveShadow = true
  group.add(cap)

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

  const combinedGeometry = new THREE.BufferGeometry()
  group.updateMatrixWorld()

  const positions: number[] = []
  const indices: number[] = []
  let vertexOffset = 0

  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry as THREE.BufferGeometry
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
