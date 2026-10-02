import { useState } from 'react'
import { Phone, MessageCircle, Stethoscope, UserPlus, Search } from 'lucide-react'
import { Avatar } from '../components/Layout'
import { useStore } from '../data/store'
import { rupees, isoDay, fmtDay, fmtPhone, waLink } from '../data/format'

const todayISO = () => isoDay()

const FILTERS = [
  ['all', 'All', () => true],
  ['due', 'Dues pending', (p) => p.due > 0],
  ['follow', 'Follow-up due', (p) => p.nextVisit && p.nextVisit <= todayISO()],
  ['recall', 'Not seen 6m+', (p) => p.lastVisit && (Date.now() - new Date(p.lastVisit)) / 864e5 > 180],
]

function QuickActions({ p, onVisit }) {
  const stop = (e) => e.stopPropagation()
  return (
    <div className="flex items-center gap-1" onClick={stop}>
      <a href={`tel:+91${p.phone}`} title="Call" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink"><Phone size={16} /></a>
      <a href={waLink(p.phone)} target="_blank" rel="noreferrer" title="WhatsApp" className="grid h-9 w-9 place-items-center rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><MessageCircle size={16} /></a>
      <button onClick={() => onVisit(p)} title="Start visit" className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white hover:bg-teal-700"><Stethoscope size={16} /></button>
    </div>
  )
}

export default function Patients({ onOpen, onVisit, onNewPatient }) {
  const { patients, searchPatients } = useStore()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const test = FILTERS.find((f) => f[0] === filter)[2]
  const base = q.trim() ? searchPatients(q, 999) : patients
  const list = base.filter(test).sort((a, b) => (b.lastVisit || '9').localeCompare(a.lastVisit || '9'))

  return (
    <div className="space-y-4 pb-8">
      <div className="rise flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">Patients</h1>
          <p className="text-sm text-muted">{patients.length} total</p>
        </div>
        <button onClick={() => onNewPatient()} className="flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700">
          <UserPlus size={18} /> <span className="hidden sm:inline">New patient</span><span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="rise flex flex-col gap-3 md:flex-row md:items-center" style={{ animationDelay: '60ms' }}>
        <div className="relative md:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter list…" className="h-10 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm outline-none focus:border-teal-500" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
          {FILTERS.map(([id, label, fn]) => {
            const n = patients.filter(fn).length
            return (
              <button key={id} onClick={() => setFilter(id)} className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold ${filter === id ? 'border-ink bg-ink text-card' : 'border-line bg-card hover:border-teal-400'}`}>
                {label} <span className="opacity-60">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop table */}
      <div className="rise hidden overflow-hidden rounded-3xl bg-card md:block" style={{ animationDelay: '120ms' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wide text-muted">
              <th className="px-5 py-3.5">Patient</th>
              <th className="px-3 py-3.5">Last visit</th>
              <th className="px-3 py-3.5">Last treatment</th>
              <th className="px-3 py-3.5">Next visit</th>
              <th className="px-3 py-3.5 text-right">Due</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const overdue = p.nextVisit && p.nextVisit <= todayISO()
              return (
                <tr key={p.id} onClick={() => onOpen(p)} className="cursor-pointer hover:bg-bg">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} />
                      <div className="min-w-0">
                        <p className="font-semibold">{p.name}{p.age && <span className="font-medium text-muted"> · {p.age}{p.gender}</span>}</p>
                        <p className="text-xs text-muted">{fmtPhone(p.phone)}</p>
                      </div>
                      {p.alerts?.length > 0 && <span title={p.alerts.join(', ')} className="h-2 w-2 rounded-full bg-rose-500" />}
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{fmtDay(p.lastVisit)}</td>
                  <td className="max-w-48 truncate px-3 py-3 text-muted">{p.lastTreatment}</td>
                  <td className="px-3 py-3">
                    {p.nextVisit ? <span className={`rounded-lg px-2 py-1 text-xs font-bold ${overdue ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-bg'}`}>{overdue ? 'Today' : fmtDay(p.nextVisit)}</span> : <span className="text-muted">—</span>}
                  </td>
                  <td className={`px-3 py-3 text-right font-bold tabular-nums ${p.due ? 'text-rose-500' : 'text-muted'}`}>{p.due ? rupees(p.due) : '—'}</td>
                  <td className="px-5 py-3"><div className="flex justify-end"><QuickActions p={p} onVisit={onVisit} /></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!list.length && <p className="p-8 text-center text-sm text-muted">No patients match.</p>}
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {list.map((p, i) => (
          <div key={p.id} onClick={() => onOpen(p)} className="rise flex items-center gap-3 rounded-2xl bg-card p-3 active:scale-[.99]" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <Avatar name={p.name} size="h-11 w-11 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted">{fmtDay(p.lastVisit)} · {p.lastTreatment}</p>
              {(p.due > 0 || p.nextVisit) && (
                <div className="mt-1 flex gap-1.5 whitespace-nowrap text-[11px] font-bold">
                  {p.due > 0 && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">Due {rupees(p.due)}</span>}
                  {p.nextVisit && <span className="rounded-md bg-bg px-1.5 py-0.5">Next {fmtDay(p.nextVisit)}</span>}
                </div>
              )}
            </div>
            <QuickActions p={p} onVisit={onVisit} />
          </div>
        ))}
        {!list.length && <p className="p-8 text-center text-sm text-muted">No patients match.</p>}
      </div>
    </div>
  )
}
