import { useEffect, useState } from 'react'
import { clearDraft, loadDraft, saveDraft } from '../data/persist'
import { AlertTriangle } from 'lucide-react'
import Sheet, { Label, Chip, inputCls, PrimaryBtn, GhostBtn } from '../components/Sheet'
import { useStore } from '../data/store'

// Only name + phone are required; everything else is one tap.
export default function NewPatient({ prefill = '', onClose, onSaved }) {
  const { addPatient, findByPhone, settings } = useStore()
  const [saving, setSaving] = useState(false)
  const startsWithDigit = /^\d/.test(prefill.trim())
  const [d] = useState(() => (prefill ? null : loadDraft('patient')) || {})
  const [name, setName] = useState(d.name ?? (startsWithDigit ? '' : prefill))
  const [phone, setPhone] = useState(d.phone ?? (startsWithDigit ? prefill : ''))
  const [age, setAge] = useState(d.age || '')
  const [gender, setGender] = useState(d.gender || '')
  const [alerts, setAlerts] = useState(d.alerts || [])
  const [note, setNote] = useState(d.note || '')
  useEffect(() => {
    if (name || phone || note) saveDraft('patient', { name, phone, age, gender, alerts, note })
  }, [name, phone, age, gender, alerts, note])
  const close = () => { clearDraft('patient'); onClose() }

  const digits = phone.replace(/\D/g, '')
  const existing = findByPhone(phone)
  const valid = name.trim().length > 1 && digits.length === 10 && !existing
  const toggleAlert = (a) => setAlerts((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]))

  const save = async (startVisit) => {
    if (!valid || saving) return
    setSaving(true)
    try {
      const p = await addPatient({ name: name.trim().replace(/\b\w/g, (c) => c.toUpperCase()), phone: digits, age: Number(age) || undefined, gender, alerts, note })
      clearDraft('patient')
      onSaved(p, startVisit)
    } catch { setSaving(false) }
  }

  return (
    <Sheet
      title="New Patient"
      subtitle="Name and phone are enough. Add the rest later."
      onClose={close}
      footer={<>
        <GhostBtn disabled={!valid || saving} onClick={() => save(false)}>Save</GhostBtn>
        <PrimaryBtn disabled={!valid || saving} onClick={() => save(true)}>Save &amp; start visit</PrimaryBtn>
      </>}
    >
      <form onSubmit={(e) => { e.preventDefault(); save(true) }} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Name *</Label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohit Sharma" autoComplete="off" className={inputCls} />
          </div>
          <div>
            <Label hint={digits.length ? `${digits.length}/10` : ''}>Phone *</Label>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 11))} inputMode="numeric" placeholder="98140 22311" className={inputCls} />
          </div>
        </div>

        {existing && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
            <AlertTriangle size={18} className="shrink-0 text-amber-500" />
            <p className="flex-1"><b>{existing.name}</b> already has this number.</p>
            <button type="button" onClick={() => onSaved(existing, true)} className="font-bold text-teal-600 dark:text-teal-400">Start visit</button>
          </div>
        )}

        <div className="grid grid-cols-[76px_1fr] gap-3 sm:grid-cols-[110px_1fr] sm:gap-4">
          <div>
            <Label>Age</Label>
            <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder="34" className={inputCls} />
          </div>
          <div>
            <Label>Gender</Label>
            <div className="flex h-12 items-center gap-1.5 [&>button]:px-3">
              {[['M', 'Male'], ['F', 'Female'], ['O', 'Other']].map(([v, l]) => (
                <Chip key={v} active={gender === v} onClick={() => setGender(gender === v ? '' : v)}>{l}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label hint="Shown as a warning on every visit">Medical alerts</Label>
          <div className="flex flex-wrap gap-2">
            {(settings?.medicalAlerts || []).map((a) => <Chip key={a} tone="rose" active={alerts.includes(a)} onClick={() => toggleAlert(a)}>{a}</Chip>)}
          </div>
        </div>

        <div>
          <Label>Note</Label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Referred by, preferences…" className={inputCls} />
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
