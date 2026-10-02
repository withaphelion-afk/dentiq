import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarPlus, Stethoscope, Pencil, X, MessageCircle, CheckCircle2 } from 'lucide-react'
import { Avatar } from '../components/Layout'
import { useStore } from '../data/store'
import { addDays, fmtLongDay, fmtTime, isoDay } from '../data/format'

const mondayOf = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }

export default function Calendar({ onBook, onReschedule, onVisit, onOpen }) {
  const { appointments, patientById, updateAppointment, flash, today } = useStore()
  const [day, setDay] = useState(today)
  const [confirm, setConfirm] = useState(null)
  const week = Array.from({ length: 7 }, (_, i) => isoDay(addDays(i, mondayOf(new Date(`${day}T12:00`)))))
  const list = appointments.filter((a) => a.date === day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const shift = (n) => setDay(isoDay(addDays(n, new Date(`${day}T12:00`))))

  const cancel = async (a) => {
    await updateAppointment(a.id, { status: 'cancelled' }).catch(() => {})
    setConfirm(null)
    flash('Appointment cancelled')
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="rise flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">Calendar</h1>
          <p className="text-sm text-muted">{new Date(`${day}T12:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => onBook(null, day)} className="flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700">
          <CalendarPlus size={18} /> Book
        </button>
      </div>

      <div className="rise rounded-3xl bg-card p-3 md:p-4" style={{ animationDelay: '60ms' }}>
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => shift(-7)} aria-label="Previous week" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-bg"><ChevronLeft size={18} /></button>
          <button onClick={() => setDay(today)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${day === today ? 'text-muted' : 'bg-bg'}`}>Today</button>
          <button onClick={() => shift(7)} aria-label="Next week" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-bg"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {week.map((d) => {
            const n = appointments.filter((a) => a.date === d && a.status !== 'done').length
            const sel = d === day
            return (
              <button key={d} onClick={() => setDay(d)} className={`rounded-2xl py-2 transition ${sel ? 'bg-teal-600 text-white' : d === today ? 'bg-teal-50 dark:bg-teal-500/10' : 'hover:bg-bg'}`}>
                <p className={`text-[10px] font-bold uppercase ${sel ? 'text-teal-100' : 'text-muted'}`}>{new Date(`${d}T12:00`).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}</p>
                <p className="text-base font-extrabold">{Number(d.slice(8))}</p>
                <p className={`text-[10px] font-bold ${n ? '' : 'opacity-0'} ${sel ? 'text-teal-100' : 'text-teal-600 dark:text-teal-400'}`}>{n || 0}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rise rounded-3xl bg-card p-4 md:p-5" style={{ animationDelay: '120ms' }}>
        <p className="mb-3 font-bold">{fmtLongDay(day)} <span className="font-medium text-muted">· {list.length} booked</span></p>
        {list.length ? (
          <div className="divide-y divide-line">
            {list.map((a) => {
              const p = patientById(a.patientId)
              if (!p) return null
              const done = a.status === 'done'
              return (
                <div key={a.id} className="flex items-center gap-3 py-3">
                  <span className={`w-[72px] shrink-0 whitespace-nowrap text-sm font-bold tabular-nums ${done ? 'text-muted' : ''}`}>{a.time ? fmtTime(a.time) : 'Any'}</span>
                  <button onClick={() => onOpen(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar name={p.name} />
                    <div className="min-w-0">
                      <p className={`truncate font-semibold ${done ? 'text-muted line-through decoration-1' : ''}`}>{p.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted">
                        {a.remind && !done && <MessageCircle size={11} className={a.reminderSentAt ? 'text-emerald-500' : ''} />}
                        {a.purpose}
                      </p>
                    </div>
                  </button>
                  {done ? <CheckCircle2 size={20} className="text-emerald-500" /> : confirm === a.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => cancel(a)} className="rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-bold text-white">Cancel it</button>
                      <button onClick={() => setConfirm(null)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-muted">Keep</button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {a.date === today && <button onClick={() => onVisit(p)} title="Start visit" className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white hover:bg-teal-700"><Stethoscope size={16} /></button>}
                      <button onClick={() => onReschedule(a)} title="Reschedule" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink"><Pencil size={16} /></button>
                      <button onClick={() => setConfirm(a.id)} title="Cancel appointment" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><X size={16} /></button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <button onClick={() => onBook(null, day)} className="w-full rounded-2xl border border-dashed border-line py-8 text-sm font-semibold text-muted hover:border-teal-400 hover:text-teal-600">
            Nothing booked. Tap to add an appointment.
          </button>
        )}
      </div>
    </div>
  )
}
