import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import Sheet, { Label, Chip, inputCls, PrimaryBtn } from '../components/Sheet'
import { Avatar } from '../components/Layout'
import { PatientPicker } from './NewVisit'
import { useStore } from '../data/store'
import { addDays, fmtLongDay, fmtTime, isoDay } from '../data/format'

// 10:00–20:00 every 30 minutes
const SLOTS = Array.from({ length: 21 }, (_, i) => `${String(10 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const QUICK_DAYS = [['Today', 0], ['Tomorrow', 1], ['+3 days', 3], ['+1 week', 7], ['+2 weeks', 14]]

// Book a new appointment, or reschedule an existing one (pass `appointment`)
export default function BookAppointment({ patient: initial, appointment, date: initialDate, onClose, onNewPatient, onSaved }) {
  const { appointments, treatments, bookAppointment, updateAppointment, patientById } = useStore()
  const [patient, setPatient] = useState(initial || (appointment && patientById(appointment.patientId)) || null)
  const [date, setDate] = useState(appointment?.date || initialDate || isoDay(addDays(1)))
  const [time, setTime] = useState(appointment?.time || '')
  const [purpose, setPurpose] = useState(appointment?.purpose || '')
  const [remind, setRemind] = useState(appointment?.remind ?? true)
  const [saving, setSaving] = useState(false)

  const taken = new Set(appointments.filter((a) => a.date === date && a.id !== appointment?.id && a.status !== 'done').map((a) => a.time))
  const now = new Date().toTimeString().slice(0, 5)
  const isToday = date === isoDay()

  const save = async () => {
    setSaving(true)
    const data = { date, time, purpose: purpose.trim() || 'Check-up', remind }
    try {
      if (appointment) await updateAppointment(appointment.id, data)
      else await bookAppointment({ ...data, patientId: patient.id })
      onSaved({ patient, date, time })
    } catch { setSaving(false) }
  }

  if (!patient) {
    return (
      <Sheet title="Book appointment" subtitle="For whom?" onClose={onClose}>
        <PatientPicker onPick={setPatient} onNewPatient={onNewPatient} />
      </Sheet>
    )
  }

  return (
    <Sheet
      title={appointment ? 'Reschedule' : 'Book appointment'}
      onClose={onClose}
      footer={<PrimaryBtn disabled={saving} onClick={save}>{appointment ? 'Save changes' : 'Book'} · {fmtLongDay(date).split(',')[0]}{time && `, ${fmtTime(time)}`}</PrimaryBtn>}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-bg p-3">
        <Avatar name={patient.name} size="h-11 w-11 text-sm" />
        <p className="flex-1 truncate font-bold">{patient.name}</p>
        {!initial && !appointment && <button type="button" onClick={() => setPatient(null)} className="text-sm font-bold text-teal-600 dark:text-teal-400">Change</button>}
      </div>

      <div>
        <Label hint={fmtLongDay(date)}>Date</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_DAYS.map(([l, n]) => <Chip key={l} active={date === isoDay(addDays(n))} onClick={() => setDate(isoDay(addDays(n)))}>{l}</Chip>)}
          <input type="date" value={date} min={isoDay()} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 rounded-full border border-line bg-card px-3 text-sm font-semibold outline-none focus:border-teal-500" aria-label="Pick a date" />
        </div>
      </div>

      <div>
        <Label hint="Greyed = already booked">Time</Label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          <button type="button" onClick={() => setTime('')} className={`col-span-2 rounded-lg border py-2 text-sm font-semibold sm:col-span-1 ${!time ? 'border-teal-600 bg-teal-600 text-white' : 'border-line'}`}>Any</button>
          {SLOTS.map((s) => {
            const busy = taken.has(s), past = isToday && s < now
            return (
              <button key={s} type="button" disabled={busy || past} onClick={() => setTime(s)} className={`rounded-lg border py-2 text-sm font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-30 ${time === s ? 'border-teal-600 bg-teal-600 text-white' : 'border-line hover:border-teal-400'} ${busy ? 'line-through' : ''}`}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label>Purpose</Label>
        <div className="mb-2 flex flex-wrap gap-2">
          {['Check-up', ...treatments.slice(0, 5).map((t) => t.name)].map((t) => <Chip key={t} active={purpose === t} onClick={() => setPurpose(t)}>{t}</Chip>)}
        </div>
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. RCT sitting 2/3" className={inputCls} />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
        <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="h-5 w-5 accent-emerald-500" />
        <MessageCircle size={16} className="text-emerald-500" /> WhatsApp reminder a day before
      </label>
    </Sheet>
  )
}
