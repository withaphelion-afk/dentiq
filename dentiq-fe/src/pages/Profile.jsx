import { useEffect, useState } from 'react'
import { ArrowLeft, Phone, MessageCircle, Stethoscope, AlertTriangle, Wallet, CalendarClock, FileText, CalendarPlus } from 'lucide-react'
import { Avatar } from '../components/Layout'
import ToothChart from '../components/ToothChart'
import { useStore } from '../data/store'
import { rupees, fmtDay, fmtLongDay, fmtTime, fmtPhone, waLink } from '../data/format'
import { Sk } from '../components/Shimmer'

export default function Profile({ id, onBack, onVisit, onBook }) {
  const { patientById, loadPatient, collectDue, flash } = useStore()
  const p = patientById(id)
  const [detail, setDetail] = useState(null)
  const [tooth, setTooth] = useState([])
  const [collecting, setCollecting] = useState(false)

  // Reload history whenever the patient changes (new visit, dues collected, booking)
  useEffect(() => { loadPatient(id).then(setDetail).catch(() => {}) }, [id, p?.updatedAt, p?.nextVisit]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null
  const history = detail?.visits || []
  const upcoming = detail?.appointments || []
  const treated = [...new Set(history.flatMap((v) => v.teeth))]
  const shown = tooth.length ? history.filter((v) => v.teeth.includes(tooth[0])) : history
  const billed = history.reduce((s, v) => s + v.items.reduce((a, i) => a + i.fee, 0), 0)
  const genderLabel = { M: 'Male', F: 'Female', O: 'Other' }[p.gender]

  const collect = async (mode) => {
    const amount = p.due
    await collectDue(p.id, mode).catch(() => {})
    setCollecting(false)
    flash(`${rupees(amount)} collected from ${p.name.split(' ')[0]} (${mode})`)
  }

  return (
    <div className="space-y-5 pb-8">
      <button onClick={onBack} className="rise flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Patients</button>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          {/* Header */}
          <div className="rise rounded-3xl bg-card p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={p.name} size="h-16 w-16 text-xl" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-extrabold">{p.name}</h1>
                <p className="text-sm text-muted">{[p.age && `${p.age} yrs`, genderLabel, fmtPhone(p.phone)].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <a href={`tel:+91${p.phone}`} className="grid h-12 w-12 place-items-center rounded-xl border border-line hover:bg-bg" title="Call"><Phone size={18} /></a>
                <a href={waLink(p.phone)} target="_blank" rel="noreferrer" className="grid h-12 w-12 place-items-center rounded-xl border border-line text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" title="WhatsApp"><MessageCircle size={18} /></a>
                <button onClick={() => onVisit(p)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 font-bold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 sm:flex-none">
                  <Stethoscope size={18} /> Start visit
                </button>
              </div>
            </div>
            {(p.alerts?.length > 0 || p.note) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.alerts?.map((a) => (
                  <span key={a} className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><AlertTriangle size={12} />{a}</span>
                ))}
                {p.note && <span className="flex items-center gap-1 rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold"><FileText size={12} />{p.note}</span>}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: '60ms' }}>
            <div className="rounded-2xl bg-card p-3 md:p-4">
              <p className="text-lg font-extrabold md:text-2xl">{history.length}</p>
              <p className="text-xs text-muted">Visits</p>
            </div>
            <div className="rounded-2xl bg-card p-3 md:p-4">
              <p className="text-lg font-extrabold tabular-nums md:text-2xl">{rupees(billed)}</p>
              <p className="text-xs text-muted">Total billed</p>
            </div>
            <div className={`rounded-2xl p-3 md:p-4 ${p.due ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-card'}`}>
              <p className={`text-lg font-extrabold tabular-nums md:text-2xl ${p.due ? 'text-rose-600 dark:text-rose-300' : ''}`}>{rupees(p.due)}</p>
              {p.due > 0 ? (
                collecting ? (
                  <div className="mt-1 flex gap-1.5">
                    <button onClick={() => collect('Cash')} className="rounded-lg bg-rose-500 px-2 py-1 text-xs font-bold text-white">Cash</button>
                    <button onClick={() => collect('UPI')} className="rounded-lg bg-rose-500 px-2 py-1 text-xs font-bold text-white">UPI</button>
                    <button onClick={() => setCollecting(false)} aria-label="Cancel" className="rounded-lg px-1.5 py-1 text-xs font-bold text-muted">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setCollecting(true)} className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-300"><Wallet size={12} /> Collect</button>
                )
              ) : <p className="text-xs text-muted">No dues</p>}
            </div>
          </div>

          <div className="rise rounded-2xl bg-mint p-4" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <CalendarClock size={20} />
              <p className="flex-1 text-sm font-bold">{upcoming.length ? 'Upcoming' : 'No upcoming visit'}</p>
              <button onClick={() => onBook(p)} className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-bold"><CalendarPlus size={14} /> Book</button>
            </div>
            {upcoming.map((a) => (
              <p key={a.id} className="mt-2 pl-8 text-sm">{fmtLongDay(a.date)} · {fmtTime(a.time)} · <span className="text-muted">{a.purpose}</span></p>
            ))}
          </div>

          {/* Visit history */}
          <div className="rise rounded-3xl bg-card p-5" style={{ animationDelay: '140ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Visit history</p>
              {tooth.length > 0 && (
                <button onClick={() => setTooth([])} className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">Tooth {tooth[0]} ✕</button>
              )}
            </div>
            {!detail ? (
              <div className="space-y-3"><Sk className="h-12" /><Sk className="h-12" /></div>
            ) : shown.length ? (
              <ol className="relative space-y-5 border-l-2 border-line pl-5">
                {shown.map((v) => {
                  const total = v.items.reduce((a, i) => a + i.fee, 0)
                  return (
                    <li key={v.id} className="relative">
                      <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card bg-teal-500" />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="font-semibold">{v.items.map((i) => i.name).join(' + ')}</p>
                        <p className="text-xs font-semibold text-muted">{fmtDay(v.date)}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                        {v.teeth.map((t) => <span key={t} className="rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">#{t}</span>)}
                        <span className="rounded-md bg-bg px-1.5 py-0.5 font-semibold">{rupees(total)}</span>
                        <span className={`rounded-md px-1.5 py-0.5 font-semibold ${v.paid < total ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                          {v.paid < total ? `Paid ${rupees(v.paid)}` : 'Paid'} · {v.mode}
                        </span>
                      </div>
                      {v.notes && <p className="mt-1.5 text-sm text-muted">{v.notes}</p>}
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted">{tooth.length ? `No treatment on tooth ${tooth[0]} yet.` : 'No visits yet. Start the first one.'}</p>
            )}
          </div>
        </div>

        {/* Tooth map */}
        <aside className="rise space-y-3" style={{ animationDelay: '80ms' }}>
          <div className="rounded-3xl bg-card p-5 xl:sticky xl:top-24">
            <p className="font-bold">Tooth map</p>
            <p className="mb-3 text-xs text-muted">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-300" />Treated · tap a tooth to see its history
            </p>
            <ToothChart value={tooth} onChange={setTooth} marked={treated} single hint={treated.length ? `${treated.length} treated` : 'No treatments'} />
          </div>
        </aside>
      </div>
    </div>
  )
}
