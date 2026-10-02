import { useEffect } from 'react'
import { X } from 'lucide-react'

// Bottom sheet on phones, centred dialog on desktop
export default function Sheet({ title, subtitle, onClose, footer, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center md:p-6">
      <div className="fade absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet relative flex max-h-[94vh] w-full flex-col rounded-t-3xl bg-card shadow-2xl md:max-w-2xl md:rounded-3xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line md:hidden" />
        <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 md:px-6 md:pt-5">
          <div>
            <h2 className="text-xl font-extrabold">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg text-muted hover:text-ink"><X size={18} /></button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5 md:px-6">{children}</div>
        {footer && <footer className="flex gap-2 border-t border-line px-5 py-3 pb-[max(env(safe-area-inset-bottom),12px)] md:px-6">{footer}</footer>}
      </div>
    </div>
  )
}

export const Label = ({ children, hint }) => (
  <p className="mb-1.5 flex items-baseline justify-between text-xs font-bold uppercase tracking-wide text-muted">
    {children}{hint && <span className="font-medium normal-case tracking-normal">{hint}</span>}
  </p>
)

export const inputCls = 'h-12 w-full rounded-xl border border-line bg-bg px-3.5 text-[15px] outline-none placeholder:text-muted focus:border-teal-500 focus:bg-card focus:ring-4 focus:ring-teal-500/15'

export function Chip({ active, onClick, children, tone = 'teal' }) {
  const on = tone === 'rose' ? 'border-rose-500 bg-rose-500 text-white' : 'border-teal-600 bg-teal-600 text-white'
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${active ? on : 'border-line bg-card hover:border-teal-400'}`}>
      {children}
    </button>
  )
}

export const PrimaryBtn = ({ className = '', ...p }) => (
  <button {...p} className={`h-12 flex-1 rounded-xl bg-teal-600 px-4 text-[15px] font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-[.98] disabled:opacity-40 disabled:shadow-none ${className}`} />
)
export const GhostBtn = ({ className = '', ...p }) => (
  <button {...p} className={`h-12 rounded-xl border border-line px-4 text-[15px] font-bold transition hover:bg-bg active:scale-[.98] disabled:opacity-40 ${className}`} />
)
