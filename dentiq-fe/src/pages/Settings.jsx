import { useEffect, useState } from 'react'
import { Plus, X, LogOut, Zap, MessageCircle, Moon, Sun, Download, Share } from 'lucide-react'
import { useStore } from '../data/store'
import { inputCls, Label } from '../components/Sheet'

function Section({ title, hint, children, delay = 0 }) {
  return (
    <section className="rise rounded-3xl bg-card p-5" style={{ animationDelay: `${delay}ms` }}>
      <p className="font-bold">{title}</p>
      {hint && <p className="mb-4 text-xs text-muted">{hint}</p>}
      <div className={hint ? '' : 'mt-4'}>{children}</div>
    </section>
  )
}

function ChipList({ items, onChange, placeholder }) {
  const [v, setV] = useState('')
  const add = () => { const t = v.trim(); if (t && !items.includes(t)) onChange([...items, t]); setV('') }
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {items.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-bg py-1.5 pl-3 pr-1.5 text-sm font-semibold">
            {t}
            <button onClick={() => onChange(items.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-card hover:text-rose-500"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} className={`${inputCls} h-10`} />
        <button onClick={add} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg hover:bg-teal-50 hover:text-teal-700"><Plus size={18} /></button>
      </div>
    </div>
  )
}

function InstallApp() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const [prompt, setPrompt] = useState(() => window.__installPrompt)
  const [installed, setInstalled] = useState(standalone)
  useEffect(() => {
    const ready = () => setPrompt(window.__installPrompt)
    const done = () => setInstalled(true)
    addEventListener('installable', ready)
    addEventListener('appinstalled', done)
    return () => { removeEventListener('installable', ready); removeEventListener('appinstalled', done) }
  }, [])

  const install = async () => {
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    window.__installPrompt = null
    setPrompt(null)
  }

  if (installed) return <p className="mb-4 text-sm text-muted">✓ Dentiq is installed on this device.</p>
  if (prompt) return (
    <button onClick={install} className="mb-4 flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700">
      <Download size={16} /> Install Dentiq
    </button>
  )
  return (
    <p className="mb-4 flex items-start gap-2 text-sm text-muted">
      {ios ? <><Share size={16} className="mt-0.5 shrink-0" /> To install: tap Share, then “Add to Home Screen”.</> : <><Download size={16} className="mt-0.5 shrink-0" /> To install: open the browser menu and choose “Install Dentiq” or “Add to Home screen”.</>}
    </p>
  )
}

const Toggle = ({ on, onChange, label }) => (
  <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-3 py-1 text-left text-sm font-semibold">
    {label}
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-teal-600' : 'bg-line'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  </button>
)

export default function Settings({ dark, toggleDark }) {
  const { settings, saveSettings, logout, flash } = useStore()
  const [draft, setDraft] = useState(settings)
  const [saving, setSaving] = useState(false)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setRem = (patch) => setDraft((d) => ({ ...d, reminders: { ...d.reminders, ...patch } }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const save = async () => {
    setSaving(true)
    const { id: _id, createdAt: _c, updatedAt: _u, whatsappAuto: _w, ...data } = draft
    const treatments = data.treatments.filter((t) => t.name.trim()).map((t) => ({ ...t, name: t.name.trim(), fee: Number(t.fee) || 0 }))
    try {
      const s = await saveSettings({ ...data, treatments })
      setDraft(s)
      flash('Settings saved')
    } catch { /* toast shown by store */ }
    setSaving(false)
  }

  const r = draft.reminders
  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-28">
      <h1 className="rise text-2xl font-extrabold md:text-3xl">Settings</h1>

      <Section title="Clinic">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Clinic name</Label><input value={draft.clinicName} onChange={(e) => set({ clinicName: e.target.value })} className={inputCls} /></div>
          <div><Label>Doctor name</Label><input value={draft.doctorName} onChange={(e) => set({ doctorName: e.target.value })} className={inputCls} /></div>
        </div>
      </Section>

      <Section title="Price list" hint="Default fees auto-fill in New Visit. Edited fees are remembered automatically." delay={40}>
        <div className="space-y-2">
          {draft.treatments.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={t.name} onChange={(e) => set({ treatments: draft.treatments.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} aria-label="Treatment name" className={`${inputCls} h-10 flex-1`} />
              <div className="flex h-10 items-center rounded-xl border border-line bg-bg pl-3 focus-within:border-teal-500">
                <span className="text-sm text-muted">₹</span>
                <input value={t.fee || ''} inputMode="numeric" onChange={(e) => set({ treatments: draft.treatments.map((x, j) => (j === i ? { ...x, fee: Number(e.target.value.replace(/\D/g, '')) } : x)) })} aria-label={`${t.name} fee`} className="h-full w-20 bg-transparent px-2 text-right font-bold tabular-nums outline-none" />
              </div>
              <button onClick={() => set({ treatments: draft.treatments.filter((_, j) => j !== i) })} aria-label={`Remove ${t.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><X size={16} /></button>
            </div>
          ))}
          <button onClick={() => set({ treatments: [...draft.treatments, { name: '', fee: 0, uses: 0 }] })} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm font-bold text-teal-600 hover:border-teal-400 dark:text-teal-400">
            <Plus size={16} /> Add treatment
          </button>
        </div>
      </Section>

      <Section title="Note shortcuts" hint="One-tap phrases in New Visit" delay={80}>
        <ChipList items={draft.noteTemplates} onChange={(noteTemplates) => set({ noteTemplates })} placeholder="e.g. Ice pack advised" />
      </Section>

      <Section title="Medical alerts" hint="Options shown when adding a patient" delay={100}>
        <ChipList items={draft.medicalAlerts} onChange={(medicalAlerts) => set({ medicalAlerts })} placeholder="e.g. Epilepsy" />
      </Section>

      <Section title="WhatsApp reminders" delay={120}>
        <div className={`mb-4 flex items-start gap-3 rounded-2xl p-3 text-sm ${draft.whatsappAuto ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-bg'}`}>
          {draft.whatsappAuto ? <Zap size={18} className="mt-0.5 shrink-0 text-emerald-500" /> : <MessageCircle size={18} className="mt-0.5 shrink-0 text-emerald-500" />}
          <p>
            {draft.whatsappAuto
              ? <><b>Automatic.</b> WhatsApp Business API is connected; reminders go out daily at the time below.</>
              : <><b>Tap-to-send (free).</b> Reminders appear on the Today screen; one tap opens WhatsApp with the message ready. To send automatically, connect the WhatsApp Business API on the server.</>}
          </p>
        </div>
        <div className="space-y-3">
          <Toggle on={r.enabled} onChange={(enabled) => setRem({ enabled })} label="Appointment reminders (day before)" />
          <Toggle on={r.autoRecalls} onChange={(autoRecalls) => setRem({ autoRecalls })} label="Also auto-send recall messages" />
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div><Label>Send at</Label><input type="time" value={r.sendAt} onChange={(e) => setRem({ sendAt: e.target.value })} className={inputCls} /></div>
            <div><Label>Recall after</Label>
              <select value={r.recallMonths} onChange={(e) => setRem({ recallMonths: Number(e.target.value) })} className={inputCls}>
                {[3, 4, 6, 9, 12].map((m) => <option key={m} value={m}>{m} months</option>)}
              </select>
            </div>
          </div>
          <div><Label hint="{name} {date} {time} {clinic}">Appointment message</Label>
            <textarea rows={3} value={r.appointmentMessage} onChange={(e) => setRem({ appointmentMessage: e.target.value })} className={`${inputCls} h-auto py-3`} />
          </div>
          <div><Label hint="{name} {clinic}">Recall message</Label>
            <textarea rows={3} value={r.recallMessage} onChange={(e) => setRem({ recallMessage: e.target.value })} className={`${inputCls} h-auto py-3`} />
          </div>
        </div>
      </Section>

      <Section title="App" delay={140}>
        <InstallApp />
        <Toggle on={dark} onChange={toggleDark} label={<span className="flex items-center gap-2">{dark ? <Moon size={16} /> : <Sun size={16} />} Dark mode</span>} />
        <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-300"><LogOut size={16} /> Log out</button>
      </Section>

      {dirty && (
        <div className="rise fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6 md:pl-20">
          <div className="flex w-full max-w-3xl items-center gap-3 rounded-2xl bg-ink p-2 pl-4 text-card shadow-2xl">
            <p className="flex-1 text-sm font-semibold">Unsaved changes</p>
            <button onClick={() => setDraft(settings)} className="rounded-xl px-3 py-2 text-sm font-bold opacity-70 hover:opacity-100">Discard</button>
            <button onClick={save} disabled={saving} className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white hover:bg-teal-400 disabled:opacity-50">Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
