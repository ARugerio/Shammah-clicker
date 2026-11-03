import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Preview3DProps {
  geometry: THREE.BufferGeometry
}

export function Preview3D({ geometry }: Preview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })

    renderer.setSize(400, 400)
    containerRef.current.appendChild(renderer.domElement)

    camera.position.z = 2

    // Add lights
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(1, 1, 1)
    scene.add(light)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add mesh
    const material = new THREE.MeshPhongMaterial({ color: 0x0066cc })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate)
      mesh.rotation.x += 0.01
      mesh.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [geometry])

  return <div ref={containerRef} className="preview-3d" style={{ width: 400, height: 400 }} />
}
