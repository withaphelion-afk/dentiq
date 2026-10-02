import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../data/store'
import { rupees, fmtDay } from '../data/format'
import { Sk } from '../components/Shimmer'

// Monochrome: ink vs mid-grey, always paired with direct labels and the legend
const MODE_COLOR = { Cash: 'var(--accent)', UPI: 'var(--mid)' }

const shiftMonth = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const monthLabel = (m) => new Date(`${m}-01T12:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
const compact = (n) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : `₹${n}`)

function Tile({ label, value, sub, tone = '' }) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums md:text-2xl ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}

// Single-series bar chart: one hue, rounded data-ends, 2px gaps, hover/tap tooltip
function DailyBars({ daily }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...daily.map((d) => d.amount), 1)
  const ticks = [max, max / 2].map((v) => Math.round(v))
  const h = hover !== null ? daily[hover] : null

  return (
    <div>
      <div className="mb-2 flex h-5 items-baseline justify-between text-xs">
        <span className="font-bold">{h ? fmtDay(h.date) : 'Daily collections'}</span>
        <span className="font-bold tabular-nums">{h ? rupees(h.amount) : ''}</span>
      </div>
      <div className="relative h-44" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -top-2 right-0 bg-card pl-1 text-[10px] text-muted tabular-nums">{compact(t)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px] pr-9">
          {daily.map((d, i) => (
            <button
              key={d.date}
              type="button"
              aria-label={`${fmtDay(d.date)}: ${rupees(d.amount)}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(i)}
              className="flex h-full flex-1 items-end"
            >
              <span
                className="block w-full rounded-t-[4px] transition-opacity"
                style={{ height: d.amount ? `max(${(d.amount / max) * 100}%, 3px)` : 0, background: MODE_COLOR.Cash, opacity: hover === null || hover === i ? 1 : 0.35 }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between pr-9 text-[10px] text-muted tabular-nums">
        <span>1</span><span>{Math.ceil(daily.length / 2)}</span><span>{daily.length}</span>
      </div>
    </div>
  )
}

function ModeSplit({ byMode, total }) {
  const modes = Object.keys(MODE_COLOR).filter((m) => byMode[m])
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-bg">
        {modes.map((m) => <div key={m} style={{ width: `${(byMode[m] / total) * 100}%`, background: MODE_COLOR[m] }} />)}
      </div>
      <div className="mt-3 flex gap-5 text-sm">
        {Object.keys(MODE_COLOR).map((m) => (
          <div key={m} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MODE_COLOR[m] }} />
            <span className="font-semibold">{m}</span>
            <span className="tabular-nums text-muted">{rupees(byMode[m] || 0)} · {total ? Math.round(((byMode[m] || 0) / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Reports() {
  const { report, today } = useStore()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [data, setData] = useState(null)

  useEffect(() => {
    let live = true
    setData(null)
    report(month).then((d) => live && setData(d)).catch(() => {})
    return () => { live = false }
  }, [month]) // eslint-disable-line react-hooks/exhaustive-deps

  const isCurrent = month === today.slice(0, 7)

  return (
    <div className="space-y-4 pb-8">
      <div className="rise flex items-end justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">Reports</h1>
        <div className="flex items-center gap-1 rounded-xl bg-card p-1">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-bg"><ChevronLeft size={18} /></button>
          <span className="min-w-32 text-center text-sm font-bold">{monthLabel(month)}</span>
          <button onClick={() => setMonth(shiftMonth(month, 1))} disabled={isCurrent} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-bg disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      </div>

      {!data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-24 rounded-2xl" />)}</div>
          <Sk className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="rise grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Collected" value={rupees(data.collected)} sub={`Billed ${rupees(data.billed)}`} />
            <Tile label="Visits" value={data.visits} sub={`${data.patientsSeen} patients`} />
            <Tile label="New patients" value={data.newPatients} />
            <Tile label="Dues outstanding" value={rupees(data.duesOutstanding)} sub={`${data.patientsWithDues} patients · all time`} tone={data.duesOutstanding ? 'text-rose-600 dark:text-rose-300' : ''} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <div className="rise space-y-6 rounded-3xl bg-card p-5" style={{ animationDelay: '60ms' }}>
              <DailyBars daily={data.daily} />
              <div>
                <p className="mb-3 text-xs font-bold">Payment mode</p>
                <ModeSplit byMode={data.byMode} total={data.collected} />
              </div>
            </div>

            <div className="rise rounded-3xl bg-card p-5" style={{ animationDelay: '120ms' }}>
              <p className="mb-3 font-bold">Top treatments</p>
              {data.topTreatments.length ? (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted"><th className="pb-2 font-semibold">Treatment</th><th className="pb-2 text-right font-semibold">Done</th><th className="pb-2 text-right font-semibold">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {data.topTreatments.map((t) => (
                      <tr key={t.name}>
                        <td className="py-2.5 font-semibold">{t.name}</td>
                        <td className="py-2.5 text-right tabular-nums">{t.count}</td>
                        <td className="py-2.5 text-right tabular-nums text-muted">{rupees(t.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-muted">No visits this month.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
