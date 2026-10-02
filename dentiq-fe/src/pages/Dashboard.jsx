import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, UserPlus, Stethoscope, CheckCircle2, Clock, CircleDot, MessageCircle, Wallet, Users, AlertCircle, Check, Zap } from 'lucide-react'
import { rupees, fmtTime, fmtDay } from '../data/format'
import { useStore } from '../data/store'
import { Avatar } from '../components/Layout'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const STATUS = {
  done: { icon: CheckCircle2, cls: 'text-emerald-500', label: 'Done' },
  now: { icon: CircleDot, cls: 'text-amber-500 animate-pulse', label: 'In chair' },
  upcoming: { icon: Clock, cls: 'text-muted', label: 'Upcoming' },
}

function WeekStrip() {
  const { appointments } = useStore()
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  return (
    <div>
      <p className="mb-3 text-sm font-bold">{today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => {
          const isToday = d.toDateString() === today.toDateString()
          const n = appointments.filter((a) => a.date === d.toLocaleDateString('en-CA')).length
          return (
            <div key={d} className={`rounded-xl py-2 ${isToday ? 'bg-teal-600 text-white' : ''}`}>
              <p className={`text-[10px] font-semibold uppercase ${isToday ? 'text-teal-100' : 'text-muted'}`}>{d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}</p>
              <p className="text-sm font-bold">{d.getDate()}</p>
              <span className={`mx-auto mt-0.5 block h-1 w-1 rounded-full ${n ? (isToday ? 'bg-white' : 'bg-teal-500') : 'bg-transparent'}`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Queue({ onOpen }) {
  const { queue, patientById, cycleStatus } = useStore()
  if (!queue.length) return <p className="px-1 py-4 text-sm text-muted">No appointments today. Walk-ins: tap New Visit.</p>
  return (
    <div className="space-y-2">
      {queue.map((a, i) => {
        const p = patientById(a.patientId)
        if (!p) return null
        const s = STATUS[a.status] || STATUS.upcoming
        return (
          <div key={a.id} className={`rise flex items-center gap-3 rounded-2xl p-2.5 ${a.status === 'now' ? 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30' : 'hover:bg-bg'}`} style={{ animationDelay: `${i * 50}ms` }}>
            <button onClick={() => onOpen(p)} title="Start visit" className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <Avatar name={p.name} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${a.status === 'done' ? 'text-muted line-through decoration-1' : ''}`}>{p.name}</p>
                <p className="truncate text-xs text-muted">{a.purpose}</p>
              </div>
            </button>
            <span className="rounded-lg border border-line px-2 py-1 text-xs font-semibold tabular-nums">{a.time || '—'}</span>
            <button onClick={() => cycleStatus(a.id)} title={`${s.label}: tap to change`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-card">
              <s.icon size={20} className={s.cls} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Tomorrow's appointment reminders + recalls. Auto-sent if WhatsApp Cloud API is set up, otherwise one tap each.
function Reminders() {
  const { reminders, markReminder, flash } = useStore()
  const { items, auto, sendAt } = reminders
  const send = (r) => {
    window.open(r.link, '_blank', 'noopener')
    markReminder(r.kind, r.id).then(() => flash(`Reminder sent to ${r.patient.name.split(' ')[0]}`)).catch(() => {})
  }
  return (
    <div className="rise rounded-3xl bg-card p-5" style={{ animationDelay: '220ms' }}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-bold">WhatsApp reminders</p>
        {auto ? (
          <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Zap size={12} /> Auto at {fmtTime(sendAt)}</span>
        ) : (
          <span className="text-xs text-muted">Tap to send</span>
        )}
      </div>
      {items.length ? (
        <div className="divide-y divide-line">
          {items.map((r) => (
            <div key={r.kind + r.id} className="flex items-center gap-3 py-3">
              <Avatar name={r.patient.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.patient.name}</p>
                <p className="truncate text-xs text-muted">
                  {r.kind === 'appointment' ? `Tomorrow ${r.time ? fmtTime(r.time) : ''} · ${r.reason}` : `Recall · last seen ${fmtDay(r.patient.lastVisit)}`}
                </p>
              </div>
              <button onClick={() => send(r)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600">
                <MessageCircle size={14} /> Send
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 py-3 text-sm text-muted"><Check size={16} className="text-emerald-500" /> All reminders sent</p>
      )}
    </div>
  )
}

function Stat({ icon: Icon, value, label, tone, hidden }) {
  return (
    <div className="rounded-2xl bg-card p-3 md:p-4">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={18} /></div>
      <p className="text-lg font-extrabold tabular-nums md:text-2xl" aria-label={hidden ? `${label} hidden` : undefined}>{hidden ? '••••' : value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  )
}

export default function Dashboard({ onNewVisit, onNewPatient }) {
  const { queue, patients, collected, settings } = useStore()
  const done = queue.filter((a) => a.status === 'done').length
  const dues = patients.reduce((s, p) => s + p.due, 0)
  const card = 'rise group relative overflow-hidden rounded-3xl p-4 text-left transition hover:-translate-y-0.5 md:p-5'
  // Hide money and patient counts when someone else can see the screen; remembered on this device
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('dentiq-hide-stats') === '1' } catch { return false } })
  const toggleHidden = () => setHidden((h) => { try { localStorage.setItem('dentiq-hide-stats', h ? '0' : '1') } catch { /* storage unavailable */ } return !h })
  const arrow = 'absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-ink text-card transition group-hover:translate-x-1 md:bottom-5 md:right-5 md:top-auto md:h-11 md:w-11'

  return (
    <div className="grid gap-6 pb-8 xl:grid-cols-[1fr_360px]">
      <section className="min-w-0 space-y-6">
        <div className="rise">
          <h1 className="text-2xl font-medium md:text-3xl">{greeting()}, <span className="font-extrabold">{settings?.doctorName}</span></h1>
          <p className="mt-1 text-sm text-muted">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}{!hidden && ` · ${queue.length - done} patients left today`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <button onClick={() => onNewVisit()} className={`${card} bg-mint`}>
            <div className="mb-8 grid h-11 w-11 place-items-center rounded-full bg-card md:mb-10"><Stethoscope size={20} /></div>
            <p className="text-lg font-bold">New Visit</p>
            <p className="text-xs text-muted md:text-sm">Log treatment in 30 seconds</p>
            <span className={arrow}><ArrowRight size={18} /></span>
          </button>
          <button onClick={() => onNewPatient()} className={`${card} bg-lav`} style={{ animationDelay: '60ms' }}>
            <div className="mb-8 grid h-11 w-11 place-items-center rounded-full bg-card md:mb-10"><UserPlus size={20} /></div>
            <p className="text-lg font-bold">New Patient</p>
            <p className="text-xs text-muted md:text-sm">Name and phone is enough</p>
            <span className={arrow}><ArrowRight size={18} /></span>
          </button>
        </div>

        <div className="rise" style={{ animationDelay: '120ms' }}>
        {/* Eye toggle sits right above the Dues pending tile */}
        <div className="mb-2 flex justify-end">
          <button onClick={toggleHidden} aria-pressed={hidden} title={hidden ? 'Show numbers' : 'Hide numbers'} className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 text-xs font-semibold text-muted hover:text-ink">
            {hidden ? <EyeOff size={15} /> : <Eye size={15} />} {hidden ? 'Show' : 'Hide'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Stat icon={Users} value={`${done}/${queue.length}`} label="Seen today" hidden={hidden} tone="bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" />
          <Stat icon={Wallet} value={rupees(collected)} label="Collected" hidden={hidden} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
          <Stat icon={AlertCircle} value={rupees(dues)} label="Dues pending" hidden={hidden} tone="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" />
        </div>
        </div>

        {/* On mobile the queue sits here; on wide screens it moves to the right column */}
        <div className="rise rounded-3xl bg-card p-4 xl:hidden" style={{ animationDelay: '180ms' }}>
          <p className="mb-3 font-bold">Today’s queue</p>
          <Queue onOpen={onNewVisit} />
        </div>

        <Reminders />
      </section>

      <aside className="hidden space-y-6 xl:block">
        <div className="rise rounded-3xl bg-card p-5"><WeekStrip /></div>
        <div className="rise rounded-3xl bg-card p-4" style={{ animationDelay: '80ms' }}>
          <p className="mb-3 px-1 font-bold">Today’s queue</p>
          <Queue onOpen={onNewVisit} />
        </div>
      </aside>
    </div>
  )
}
