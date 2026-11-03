import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Preview3DProps {
  geometry: THREE.BufferGeometry
}

export function Preview3D({ geometry }: Preview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 800

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(2, 2, 2)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    container.appendChild(renderer.domElement)

    // Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(gridHelper)

    // Lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
    keyLight.position.set(2, 2, 2)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x6666ff, 0.3)
    rimLight.position.set(-2, 1, -2)
    scene.add(rimLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // Material realista para el clicker
    const material = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.4,
      metalness: 0.1,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      mesh.rotation.x += 0.003
      mesh.rotation.y += 0.005
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [geometry])

  return <div ref={containerRef} className="preview-3d" style={{ width: '100%', height: '100%' }} />
}
