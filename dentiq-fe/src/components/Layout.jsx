import { useId, useState } from 'react'
import { Home, Users, CalendarDays, BarChart3, Settings, Plus, Search, Moon, Sun } from 'lucide-react'
import { fmtPhone } from '../data/format'
import { useStore } from '../data/store'

export const NAV = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const TOOTH = 'M20 14c-6 0-9 5-9 11 0 7 3 10 5 17 1 5 2 9 5 9s3-5 4-10c1-3 2-5 7-5s6 2 7 5c1 5 1 10 4 10s4-4 5-9c2-7 5-10 5-17 0-6-3-11-9-11-5 0-7 3-12 3s-7-3-12-3z'

// Brand mark: jewel-toned badge, glossy enamel tooth with a smile, gold sparkle
export function Logo({ className = 'h-9 w-9' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 drop-shadow-[0_6px_14px_rgba(13,148,136,0.35)] ${className}`} role="img" aria-label="Dentiq">
      <defs>
        <linearGradient id={`${id}bg`} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" /><stop offset=".45" stopColor="#0d9488" /><stop offset="1" stopColor="#134e4a" />
        </linearGradient>
        <linearGradient id={`${id}en`} x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" /><stop offset=".6" stopColor="#f0fdfa" /><stop offset="1" stopColor="#99f6e4" />
        </linearGradient>
        <linearGradient id={`${id}au`} x1="44" y1="8" x2="54" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" /><stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id={`${id}gl`} cx="22" cy="10" r="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".45" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id}bg)`} />
      <rect width="64" height="64" rx="18" fill={`url(#${id}gl)`} />
      <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.5" />
      <g transform="translate(9.6 10.4) scale(.7)">
        <path d={TOOTH} fill="#042f2e" opacity=".28" transform="translate(1.5 3)" />
        <path d={TOOTH} fill={`url(#${id}en)`} />
        <path d="M22 18c-3.5.6-5.4 3.4-5.6 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".9" />
        <path d="M23 30c3 4.2 6.2 6 9 6s6-1.8 9-6" fill="none" stroke="#0d9488" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <path d="M49 7.5l1.6 4.4 4.4 1.6-4.4 1.6L49 19.5l-1.6-4.4-4.4-1.6 4.4-1.6z" fill={`url(#${id}au)`} />
      <circle cx="55.5" cy="22" r="1.4" fill="#fde68a" />
    </svg>
  )
}

// Collapsed rail that expands over the content on hover (or keyboard focus)
function Sidebar({ page, setPage }) {
  const clinic = useStore().settings?.clinicName || 'Dental Clinic'
  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-20 shrink-0 md:block">
      <nav className="group absolute inset-y-0 left-0 flex w-20 flex-col gap-1.5 overflow-hidden border-r border-line bg-card px-3.5 py-5 transition-[width,box-shadow] duration-300 ease-out hover:w-60 hover:shadow-2xl hover:shadow-black/10 focus-within:w-60">
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-[52px] w-[52px]" />
          <div className="min-w-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <p className="text-lg font-extrabold leading-tight tracking-tight text-teal-700 dark:text-teal-300">Dentiq</p>
            <p className="truncate text-[11px] font-medium text-muted">{clinic}</p>
          </div>
        </div>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            title={label}
            onClick={() => setPage(id)}
            className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition ${page === id ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25' : 'text-muted hover:bg-bg hover:text-ink'}`}
          >
            <Icon size={20} className="shrink-0" />
            <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function BottomNav({ page, setPage, onNewVisit }) {
  const items = [NAV[0], NAV[1], null, NAV[2], NAV[4]]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-line bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur md:hidden">
      {items.map((item) =>
        item ? (
          <button key={item.id} onClick={() => setPage(item.id)} className={`flex w-16 flex-col items-center gap-0.5 text-[11px] font-medium ${page === item.id ? 'text-teal-600 dark:text-teal-400' : 'text-muted'}`}>
            <item.icon size={22} />
            {item.label}
          </button>
        ) : (
          <button key="new" onClick={onNewVisit} aria-label="New visit" className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-600/30 active:scale-95">
            <Plus size={28} />
          </button>
        ),
      )}
    </nav>
  )
}

// Instant patient search by name or phone
function SearchBox({ onPick, onAdd }) {
  const { searchPatients } = useStore()
  const [q, setQ] = useState('')
  const term = q.trim()
  const hits = searchPatients(q)

  return (
    <div className="relative flex-1">
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { onPick(hits[0]); setQ('') } if (e.key === 'Escape') setQ('') }}
        placeholder="Search patient by name or phone…"
        className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
      />
      {term && (
        <div className="absolute inset-x-0 top-12 z-40 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
          {hits.length ? hits.map((p) => (
            <button key={p.id} onClick={() => { onPick(p); setQ('') }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg">
              <Avatar name={p.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{fmtPhone(p.phone)} · {p.lastTreatment}</p>
              </div>
            </button>
          )) : (
            <button onClick={() => { onAdd(term); setQ('') }} className="w-full px-3 py-3 text-left text-sm text-muted hover:bg-bg">No patient found. <span className="font-semibold text-teal-600 dark:text-teal-400">+ Add “{term}”</span></button>
          )}
        </div>
      )}
    </div>
  )
}

const tints = ['bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300', 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300']

export function Avatar({ name, size = 'h-9 w-9 text-xs' }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('')
  const tint = tints[name.length % tints.length]
  return <div className={`grid shrink-0 place-items-center rounded-full font-bold ${tint} ${size}`}>{initials}</div>
}

export default function Layout({ page, setPage, dark, toggleDark, onPickPatient, onAddPatient, onNewVisit, children }) {
  const doctor = useStore().settings?.doctorName || 'Doctor'
  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} />
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-bg/90 px-4 py-3 backdrop-blur md:px-8 md:py-5">
          <Logo className="h-11 w-11 md:hidden" />
          <SearchBox onPick={onPickPatient} onAdd={onAddPatient} />
          <button onClick={toggleDark} aria-label="Toggle dark mode" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-card text-muted hover:text-ink">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-card py-1.5 pl-1.5 pr-3 lg:flex">
            <Avatar name={doctor.replace('Dr. ', 'D ')} size="h-8 w-8 text-xs" />
            <span className="text-sm font-semibold">{doctor}</span>
          </div>
        </header>
        <main className="px-4 md:px-8">{children}</main>
      </div>
      <BottomNav page={page} setPage={setPage} onNewVisit={onNewVisit} />
    </div>
  )
}
