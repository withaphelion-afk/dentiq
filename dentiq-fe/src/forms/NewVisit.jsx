import { useRef, useState } from 'react'
import { Search, X, Plus, AlertTriangle, MessageCircle, UserPlus } from 'lucide-react'
import Sheet, { Label, Chip, inputCls, PrimaryBtn } from '../components/Sheet'
import ToothChart from '../components/ToothChart'
import { Avatar } from '../components/Layout'
import { useStore } from '../data/store'
import { rupees, isoDay, fmtPhone } from '../data/format'

const FOLLOW_UPS = [['None', 0], ['3 days', 3], ['7 days', 7], ['15 days', 15], ['1 month', 30], ['6 months', 182]]
const MODES = ['Cash', 'UPI']

const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

export function PatientPicker({ onPick, onNewPatient }) {
  const { searchPatients, queue, patientById } = useStore()
  const [q, setQ] = useState('')
  const hits = searchPatients(q)
  // Before typing, suggest who's waiting in today's queue
  const waiting = queue.filter((a) => a.status !== 'done').map((a) => patientById(a.patientId)).filter((p, i, xs) => p && xs.indexOf(p) === i)
  const list = q.trim() ? hits : waiting

  return (
    <div>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && hits[0] && onPick(hits[0])} placeholder="Name or phone…" className={`${inputCls} pl-10`} />
      </div>
      <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-muted">{q.trim() ? 'Matches' : 'Waiting today'}</p>
      <div className="divide-y divide-line">
        {list.map((p) => (
          <button key={p.id} type="button" onClick={() => onPick(p)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-bg">
            <Avatar name={p.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted">{fmtPhone(p.phone)} · {p.lastTreatment}</p>
            </div>
            {p.due > 0 && <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">Due {rupees(p.due)}</span>}
          </button>
        ))}
        {q.trim() && !hits.length && <p className="py-3 text-sm text-muted">No patient found.</p>}
      </div>
      <button type="button" onClick={() => onNewPatient(q)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-teal-400 py-3 text-sm font-bold text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10">
        <UserPlus size={16} /> New patient{q.trim() && ` “${q.trim()}”`}
      </button>
    </div>
  )
}

function TreatmentPicker({ items, setItems }) {
  const { treatments } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const inputRef = useRef(null)

  const term = q.trim().toLowerCase()
  const chosen = new Set(items.map((i) => i.name))
  const matches = treatments.filter((t) => !chosen.has(t.name) && (!term || t.name.toLowerCase().includes(term))).slice(0, 6)
  const exact = treatments.some((t) => t.name.toLowerCase() === term)
  const options = term && !exact ? [...matches, { name: q.trim(), fee: 0, custom: true }] : matches

  const add = (t) => {
    setItems((xs) => [...xs, { name: t.name, fee: t.fee }])
    setQ(''); setHi(0); setOpen(false)
    inputRef.current?.focus()
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, options.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && term && options[hi]) { e.preventDefault(); add(options[hi]) }
    if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false) }
    if (e.key === 'Backspace' && !q && items.length) setItems((xs) => xs.slice(0, -1))
  }

  return (
    <div>
      {/* One-tap chips for the most used treatments */}
      <div className="mb-2 flex flex-wrap gap-2">
        {treatments.filter((t) => !chosen.has(t.name)).slice(0, 5).map((t) => (
          <Chip key={t.name} onClick={() => add(t)}>+ {t.name}</Chip>
        ))}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setHi(0); setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
          placeholder="Type to search: ext, rct, scal…"
          className={inputCls}
        />
        {open && term && options.length > 0 && (
          <div className="absolute inset-x-0 top-13 z-10 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
            {options.map((t, i) => (
              <button key={t.name} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(t)} onMouseEnter={() => setHi(i)} className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm ${i === hi ? 'bg-teal-50 dark:bg-teal-500/10' : ''}`}>
                <span className="font-semibold">{t.custom ? <>Add “{t.name}”</> : t.name}</span>
                <span className="text-muted">{t.custom ? 'custom' : rupees(t.fee)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <div key={it.name} className="rise flex items-center gap-2 rounded-xl bg-bg p-2 pl-3.5">
              <span className="flex-1 truncate font-semibold">{it.name}</span>
              <div className="flex items-center rounded-lg border border-line bg-card pl-2.5 focus-within:border-teal-500">
                <span className="text-sm text-muted">₹</span>
                <input
                  value={it.fee || ''}
                  onChange={(e) => { const fee = Number(e.target.value.replace(/\D/g, '')); setItems((xs) => xs.map((x, j) => (j === idx ? { ...x, fee } : x))) }}
                  inputMode="numeric"
                  placeholder="0"
                  aria-label={`${it.name} fee`}
                  className="h-9 w-20 bg-transparent px-1.5 text-right font-bold tabular-nums outline-none"
                />
              </div>
              <button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== idx))} aria-label={`Remove ${it.name}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-card hover:text-rose-500"><X size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewVisit({ patient: initial, onClose, onNewPatient, onSaved }) {
  const { addVisit, settings } = useStore()
  const [saving, setSaving] = useState(false)
  const [patient, setPatient] = useState(initial || null)
  const [items, setItems] = useState([])
  const [teeth, setTeeth] = useState([])
  const [notes, setNotes] = useState('')
  const [paidRaw, setPaidRaw] = useState(null) // null = full amount
  const [mode, setMode] = useState('Cash')
  const [followDays, setFollowDays] = useState(0)
  const [remind, setRemind] = useState(true)
  const today = isoDay()
  const [visitDate, setVisitDate] = useState(today) // past date = back-entry of old history
  const past = visitDate < today

  const total = items.reduce((s, i) => s + i.fee, 0)
  const paid = paidRaw === null ? total : Math.min(paidRaw, total + (patient?.due || 0))
  const due = total - paid
  const addNote = (t) => setNotes((n) => (n ? `${n}, ${t}` : t))

  const save = async () => {
    if (saving) return
    setSaving(true)
    const followUp = followDays && !past ? { date: isoDay(addDays(followDays)), remind } : null
    try {
      await addVisit({ patientId: patient.id, date: visitDate, items, teeth, notes, paid, mode, followUp })
      onSaved({ patient, paid, due, followUp, date: past ? visitDate : null })
    } catch { setSaving(false) }
  }

  if (!patient) {
    return (
      <Sheet title="New Visit" subtitle="Who's in the chair?" onClose={onClose}>
        <PatientPicker onPick={setPatient} onNewPatient={onNewPatient} />
      </Sheet>
    )
  }

  return (
    <Sheet
      title="New Visit"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">Total</p>
            <p className="text-xl font-extrabold tabular-nums">{rupees(total)}</p>
          </div>
          <PrimaryBtn disabled={!items.length || saving} onClick={save}>
            {items.length ? `Save visit${due > 0 ? ` · ${rupees(due)} due` : ''}` : 'Add a treatment'}
          </PrimaryBtn>
        </div>
      }
    >
      {/* Patient */}
      <div className="flex items-center gap-3 rounded-2xl bg-bg p-3">
        <Avatar name={patient.name} size="h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{patient.name}{patient.age ? <span className="font-medium text-muted"> · {patient.age}{patient.gender}</span> : null}</p>
          <p className="truncate text-xs text-muted">Last: {patient.lastTreatment}{patient.due > 0 && <span className="font-bold text-rose-500"> · Due {rupees(patient.due)}</span>}</p>
        </div>
        {!initial && <button type="button" onClick={() => setPatient(null)} className="text-sm font-bold text-teal-600 dark:text-teal-400">Change</button>}
      </div>
      {patient.alerts?.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
          <AlertTriangle size={16} /> {patient.alerts.join(' · ')}
        </div>
      )}

      <div>
        <Label hint={past ? 'Old record: today’s queue and bookings are not touched' : ''}>Visit date</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={visitDate === today} onClick={() => setVisitDate(today)}>Today</Chip>
          <Chip active={visitDate === isoDay(addDays(-1))} onClick={() => setVisitDate(isoDay(addDays(-1)))}>Yesterday</Chip>
          <input type="date" value={visitDate} max={today} onChange={(e) => e.target.value && e.target.value <= today && setVisitDate(e.target.value)}
            aria-label="Pick an earlier date" className={`h-10 rounded-full border px-3 text-sm font-semibold outline-none ${past && visitDate !== isoDay(addDays(-1)) ? 'border-teal-600 bg-teal-600 text-white' : 'border-line bg-card'}`} />
        </div>
      </div>

      <div>
        <Label>Treatment</Label>
        <TreatmentPicker items={items} setItems={setItems} />
      </div>

      <div>
        <Label hint="Optional">Teeth</Label>
        <ToothChart value={teeth} onChange={setTeeth} />
      </div>

      <div>
        <Label hint="Tap to add">Notes</Label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(settings?.noteTemplates || []).map((t) => (
            <button key={t} type="button" onClick={() => addNote(t)} className="rounded-lg bg-bg px-2.5 py-1.5 text-xs font-semibold hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-500/10 dark:hover:text-teal-300">
              <Plus size={11} className="-mt-0.5 mr-0.5 inline" />{t}
            </button>
          ))}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything else…" className={`${inputCls} h-auto py-3`} />
      </div>

      <div>
        <Label hint={due > 0 ? `${rupees(due)} will be added to dues` : ''}>Payment</Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-12 items-center rounded-xl border border-line bg-bg pl-3.5 focus-within:border-teal-500 focus-within:bg-card">
            <span className="text-muted">₹</span>
            <input
              value={paidRaw === null ? (total || '') : paidRaw || ''}
              onChange={(e) => setPaidRaw(Number(e.target.value.replace(/\D/g, '')))}
              inputMode="numeric"
              placeholder="0"
              aria-label="Amount paid"
              className="h-full w-24 bg-transparent px-2 text-lg font-bold tabular-nums outline-none"
            />
          </div>
          <Chip active={paidRaw === null} onClick={() => setPaidRaw(null)}>Full</Chip>
          <Chip active={paidRaw === 0} onClick={() => setPaidRaw(0)}>Unpaid</Chip>
          <div className="mx-1 h-6 w-px bg-line" />
          {MODES.map((m) => <Chip key={m} active={mode === m} onClick={() => setMode(m)}>{m}</Chip>)}
        </div>
      </div>

      {!past && <div>
        <Label hint={followDays ? fmtDate(addDays(followDays)) : ''}>Next visit</Label>
        <div className="flex flex-wrap gap-2">
          {FOLLOW_UPS.map(([l, d]) => <Chip key={l} active={followDays === d} onClick={() => setFollowDays(d)}>{l}</Chip>)}
        </div>
        {followDays > 0 && (
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
            <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="h-5 w-5 accent-emerald-500" />
            <MessageCircle size={16} className="text-emerald-500" /> Send WhatsApp reminder a day before
          </label>
        )}
      </div>}
    </Sheet>
  )
}
