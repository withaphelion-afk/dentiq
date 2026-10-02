import { useEffect, useState } from 'react'
import { Logo } from './Layout'
import './splash.css'

const DURATION = 3700

// Natural tooth (crown + two roots) and implant crown, in local 64-wide coordinates
// Two cusps with a central groove on the biting surface
const TOOTH = 'M4 22C4 8 12 2 20 4c5 1 8 5 12 5s7-4 12-5c8-2 16 4 16 18l-2 56c0 6-4 10-8 14l-4 78c-1 8-8 8-9 0l-5-66c-1-6-3-6-4 0l-5 66c-1 8-8 8-9 0l-4-78c-4-4-8-8-8-14z'
const CROWN = 'M4 22C4 8 12 2 20 4c5 1 8 5 12 5s7-4 12-5c8-2 16 4 16 18l-2 48c0 10-8 14-26 14S6 80 6 70z'

// Implant body: tapered, with thread tips on both edges (x centre 200, top 158, apex ~274)
const TOP = 158, BOTTOM = 262, PITCH = 9
const half = (y) => 17 - ((y - TOP) / (BOTTOM - TOP)) * 6
const IMPLANT = (() => {
  const left = [], right = []
  for (let y = TOP; y <= BOTTOM; y += PITCH) {
    left.push(`${200 - half(y)},${y}`, `${200 - half(y) - 4},${y + PITCH / 2}`)
    right.unshift(`${200 + half(y) + 4},${y + PITCH / 2}`, `${200 + half(y)},${y}`)
  }
  return `M${left.join(' L')} L200,${BOTTOM + 12} L${right.join(' L')} Z`
})()
const THREADS = Array.from({ length: 16 }, (_, i) => TOP - 2 * PITCH + i * PITCH)

// Startup: implant site appears, threaded implant screws into the bone, abutment clicks on, crown seats, shine, logo.
export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const end = reduced ? 700 : DURATION
    const t1 = setTimeout(() => setLeaving(true), end)
    const t2 = setTimeout(onDone, end + 450)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  const skip = () => { setLeaving(true); setTimeout(onDone, 300) }

  return (
    <div onClick={skip} className={`splash fixed inset-0 z-50 grid place-items-center overflow-hidden transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative grid place-items-center">
        <svg viewBox="0 0 400 300" className="sp-scene w-[min(88vw,460px)]" aria-hidden="true">
          <defs>
            <linearGradient id="im-metal" x1="0" x2="1">
              <stop offset="0" stopColor="#6e6e6e" /><stop offset=".38" stopColor="#f5f5f5" /><stop offset=".62" stopColor="#c4c4c4" /><stop offset="1" stopColor="#5c5c5c" />
            </linearGradient>
            <linearGradient id="im-enamel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset=".75" stopColor="#f4f4f4" /><stop offset="1" stopColor="#dedede" />
            </linearGradient>
            <linearGradient id="im-shine" x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="im-spark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--sp-spark-a)' }} /><stop offset="1" style={{ stopColor: 'var(--sp-spark-b)' }} />
            </linearGradient>
            {/* Trabecular (spongy) bone texture */}
            <pattern id="im-trab" width="14" height="12" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.6" className="im-pore" /><circle cx="10" cy="8" r="2.1" className="im-pore" /><circle cx="6" cy="10.5" r="1" className="im-pore" />
            </pattern>
            <clipPath id="im-body"><path d={IMPLANT} /></clipPath>
            <clipPath id="im-crown-clip"><path d={CROWN} transform="translate(168 66)" /></clipPath>
          </defs>

          {/* Jaw cross-section: bone, neighbouring teeth */}
          <g className="im-base">
            <path d="M14 170 Q200 150 386 170 L386 286 Q200 300 14 286 Z" className="im-bone" />
            <path d="M14 170 Q200 150 386 170 L386 286 Q200 300 14 286 Z" fill="url(#im-trab)" />
            <path d="M14 170 Q200 150 386 170" className="im-cortex" />
            <path d={TOOTH} transform="translate(70 66) scale(.95 1)" className="im-tooth" />
            <path d={TOOTH} transform="translate(272 66) scale(.95 1)" className="im-tooth" />
          </g>

          {/* Prepared site in the bone */}
          <path d={`M184 160 L188 ${BOTTOM + 6} Q200 ${BOTTOM + 16} 212 ${BOTTOM + 6} L216 160`} className="im-osteo" pathLength="1" />

          {/* Implant + driver screw down together */}
          <g className="im-drop">
            <g className="im-driver">
              <rect x="195" y="30" width="10" height="128" rx="3" fill="url(#im-metal)" />
              <rect x="186" y="18" width="28" height="18" rx="5" className="im-handle" />
            </g>
            <path d={IMPLANT} fill="url(#im-metal)" className="im-implant" />
            <g clipPath="url(#im-body)">
              <g className="im-threads">
                {THREADS.map((y) => <line key={y} x1="176" y1={y} x2="224" y2={y + 5} className="im-thread" />)}
              </g>
            </g>
          </g>
          <ellipse cx="200" cy="212" rx="34" ry="62" className="im-ring" />

          {/* Gum over the bone, open at the implant site */}
          <g className="im-base">
            <path d="M10 160 C40 148 70 146 92 150 C120 154 150 154 176 162 L176 182 L10 182 Z" className="im-gum" />
            <path d="M390 160 C360 148 330 146 308 150 C280 154 250 154 224 162 L224 182 L390 182 Z" className="im-gum" />
          </g>

          {/* Abutment clicks on, crown seats */}
          <path d="M189 160 L192 134 L208 134 L211 160 Z" fill="url(#im-metal)" className="im-abut" />
          <g className="im-crown">
            <path d={CROWN} transform="translate(168 66)" fill="url(#im-enamel)" className="im-crown-shape" />
          </g>
          <g clipPath="url(#im-crown-clip)">
            <rect x="120" y="50" width="34" height="120" fill="url(#im-shine)" className="im-shine" />
          </g>

          {/* Sparkle */}
          <g transform="translate(246 58)">
            <path d="M0 -16 L3.6 -3.6 L16 0 L3.6 3.6 L0 16 L-3.6 3.6 L-16 0 L-3.6 -3.6 Z" fill="url(#im-spark)" className="im-spark" />
            {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} r="2" className="im-ray" style={{ '--a': `${a}deg` }} />)}
          </g>
        </svg>

        <div className="sp-brand absolute flex flex-col items-center">
          <Logo className="h-20 w-20" />
          <h1 className="sp-word mt-4 text-4xl font-extrabold tracking-tight" style={{ color: 'var(--splash-ink)' }}>Dentiq</h1>
          <p className="sp-sub mt-1 text-sm font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--splash-sub)' }}>Gagneja Dental Clinic</p>
        </div>
      </div>
      <p className="absolute bottom-6 text-xs text-muted">Tap to skip</p>
    </div>
  )
}
