import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Preview3DProps {
  geometry: THREE.BufferGeometry
}

export function Preview3D({ geometry }: Preview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    try {
      // Get actual dimensions
      const rect = container.getBoundingClientRect()
      const width = rect.width || 600
      const height = rect.height || 600

      // Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a0a)
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.set(3, 3, 3)
      camera.lookAt(0, 0, 0)

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio || 1)
      rendererRef.current = renderer

      // Clear container and add renderer
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
      container.appendChild(renderer.domElement)

      // Lights
      const light1 = new THREE.DirectionalLight(0xffffff, 1)
      light1.position.set(5, 5, 5)
      scene.add(light1)

      const light2 = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(light2)

      // Material and mesh
      const material = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.4,
        metalness: 0.1,
      })

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // Animation loop
      let frameId: number
      const animate = () => {
        frameId = requestAnimationFrame(animate)
        mesh.rotation.x += 0.003
        mesh.rotation.y += 0.005
        renderer.render(scene, camera)
      }
      animate()

      return () => {
        cancelAnimationFrame(frameId)
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    } catch (error) {
      console.error('Preview3D Error:', error)
    }
  }, [geometry])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />
}
