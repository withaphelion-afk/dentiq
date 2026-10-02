import { useEffect, useRef, useState } from 'react'

const DURATION = 3400

// Startup screen: a 3D jaw whose teeth rise into place, then fades into the app.
export default function Splash({ onDone }) {
  const mount = useRef(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let raf, renderer, ro, disposed = false
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const finish = () => { setLeaving(true); setTimeout(onDone, 450) }
    const timer = setTimeout(finish, reduced ? 900 : DURATION)

    import('three').then((THREE) => {
      if (disposed) return
      const el = mount.current
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      } catch { return } // no WebGL: the logo text still shows
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
      const fit = () => {
        const w = el.clientWidth || 1, h = el.clientHeight || 1
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.fov = w < h ? 70 : 32 // pull back a little on narrow phones
        camera.updateProjectionMatrix()
      }
      fit()
      ro = new ResizeObserver(fit)
      ro.observe(el)
      camera.position.set(0, 3.2, 10)
      camera.lookAt(0, 0, 0)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x5eead4, 1.4))
      const key = new THREE.DirectionalLight(0xffffff, 2.4)
      key.position.set(3, 6, 6)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x99f6e4, 1.2)
      rim.position.set(-4, 2, -5)
      scene.add(rim)

      const jaw = new THREE.Group()
      scene.add(jaw)
      const toothMat = new THREE.MeshPhysicalMaterial({ color: 0xfdfcf7, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 })
      const gumMat = new THREE.MeshStandardMaterial({ color: 0xf0a0ab, roughness: 0.55, transparent: true, opacity: 0 })

      // Arch shape: front faces the camera (+z)
      const arch = (t, y) => new THREE.Vector3(Math.sin(t) * 2.5, y, Math.cos(t) * 1.7 - 0.6)
      // Per side, centre → back: incisor, lateral, canine, premolar ×2, molar ×2
      const shape = [[0.9, 1.15], [0.78, 1.05], [0.85, 1.25], [0.95, 0.95], [0.95, 0.95], [1.3, 0.85], [1.3, 0.8]]
      const geo = new THREE.CapsuleGeometry(0.21, 0.3, 6, 14)
      const teeth = []

      for (const upper of [true, false]) {
        const y = upper ? 0.38 : -0.38
        for (let side = -1; side <= 1; side += 2) {
          shape.forEach(([wid, len], i) => {
            const t = side * (0.11 + i * 0.205)
            const m = new THREE.Mesh(geo, toothMat)
            m.position.copy(arch(t, y))
            m.rotation.y = t
            m.scale.set(wid, len, wid * 0.95)
            m.userData = { restY: y, delay: i * 0.09 + (upper ? 0 : 0.18), from: upper ? 2.6 : -2.6 }
            m.visible = false
            jaw.add(m)
            teeth.push(m)
          })
        }
        const pts = []
        for (let k = -1.55; k <= 1.55; k += 0.1) pts.push(arch(k, upper ? 0.74 : -0.74))
        const gum = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.22, 12), gumMat)
        jaw.add(gum)
      }

      const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2)
      const start = performance.now()
      const tick = (now) => {
        const s = (now - start) / 1000
        for (const m of teeth) {
          const p = Math.min(Math.max((s - m.userData.delay) / 0.55, 0), 1)
          m.visible = p > 0
          const e = reduced ? 1 : easeOutBack(p)
          m.position.y = m.userData.restY + m.userData.from * (1 - e)
        }
        gumMat.opacity = Math.min(Math.max((s - 0.8) / 0.6, 0), 1)
        jaw.rotation.y = reduced ? 0 : Math.sin(s * 0.9) * 0.45
        jaw.rotation.x = 0.15 + Math.sin(s * 0.6) * 0.05
        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })

    return () => {
      disposed = true
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      ro?.disconnect()
      if (renderer) { renderer.dispose(); renderer.domElement.remove() }
    }
  }, [onDone])

  return (
    <div
      onClick={() => { setLeaving(true); setTimeout(onDone, 300) }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white dark:from-[#06201d] dark:to-[#0a1110] transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <div ref={mount} className="h-[46vh] w-full max-w-xl" />
      <div className="rise text-center" style={{ animationDelay: '1.1s' }}>
        <h1 className="text-4xl font-extrabold tracking-tight text-teal-700 dark:text-teal-300">Dentiq</h1>
        <p className="mt-1 text-sm font-medium text-muted">Gagneja Dental Clinic</p>
      </div>
      <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-950">
        <div className="h-full rounded-full bg-teal-500" style={{ animation: `grow ${DURATION}ms linear forwards` }} />
      </div>
      <p className="absolute bottom-6 text-xs text-muted">Tap to skip</p>
      <style>{'@keyframes grow{from{width:0}to{width:100%}}'}</style>
    </div>
  )
}
