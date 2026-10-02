// FDI tooth chart. Tap to select/unselect teeth.
const Q = {
  ur: [18, 17, 16, 15, 14, 13, 12, 11], ul: [21, 22, 23, 24, 25, 26, 27, 28],
  lr: [48, 47, 46, 45, 44, 43, 42, 41], ll: [31, 32, 33, 34, 35, 36, 37, 38],
}
const isMolar = (n) => n % 10 >= 6

function Tooth({ n, on, marked, toggle, lower }) {
  return (
    <button
      type="button"
      onClick={() => toggle(n)}
      aria-pressed={on}
      aria-label={`Tooth ${n}`}
      className={`group flex flex-col items-center gap-0.5 ${lower ? 'flex-col-reverse' : ''}`}
    >
      <svg viewBox="0 0 64 64" className={`h-6 w-full transition sm:h-7 ${isMolar(n) ? '' : 'px-[2px]'} ${lower ? 'rotate-180' : ''} ${on ? 'scale-110 text-teal-500 dark:text-teal-400' : marked ? 'text-amber-300 dark:text-amber-500/70' : 'text-card group-hover:text-teal-100 dark:group-hover:text-teal-900'}`} fill="currentColor" stroke={on || marked ? 'none' : 'var(--muted)'} strokeOpacity=".45" strokeWidth="2.5">
        <path d="M20 14c-6 0-9 5-9 11 0 7 3 10 5 17 1 5 2 9 5 9s3-5 4-10c1-3 2-5 7-5s6 2 7 5c1 5 1 10 4 10s4-4 5-9c2-7 5-10 5-17 0-6-3-11-9-11-5 0-7 3-12 3s-7-3-12-3z" />
      </svg>
      <span className={`text-[10px] font-bold tabular-nums ${on ? 'text-teal-600 dark:text-teal-400' : 'text-muted'}`}>{n}</span>
    </button>
  )
}

export default function ToothChart({ value, onChange, marked = [], single, hint = 'Tap teeth' }) {
  const toggle = (n) => onChange(value.includes(n) ? value.filter((t) => t !== n) : single ? [n] : [...value, n].sort())
  const row = (a, b, lower) => (
    <div className="mx-auto grid max-w-lg grid-cols-2">
      <div className="grid grid-cols-8 gap-0.5 border-r border-dashed border-line pr-1">{a.map((n) => <Tooth key={n} n={n} on={value.includes(n)} marked={marked.includes(n)} toggle={toggle} lower={lower} />)}</div>
      <div className="grid grid-cols-8 gap-0.5 pl-1">{b.map((n) => <Tooth key={n} n={n} on={value.includes(n)} marked={marked.includes(n)} toggle={toggle} lower={lower} />)}</div>
    </div>
  )
  return (
    <div className="rounded-2xl border border-line bg-bg p-3">
      {row(Q.ur, Q.ul)}
      <div className="my-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        <span>R</span><div className="h-px flex-1 bg-line" /><span>{value.length ? value.join(', ') : hint}</span><div className="h-px flex-1 bg-line" /><span>L</span>
      </div>
      {row(Q.lr, Q.ll, true)}
    </div>
  )
}
