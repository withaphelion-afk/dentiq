import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import PhotoImage from './PhotoImage'
import { ToothSelect } from './CameraPanel'
import { fmtLongDay } from '../data/format'

const bar = 'bg-black/60 text-[#ffffff] backdrop-blur'

// Full-screen viewer: prev/next by buttons or arrow keys
export function Lightbox({ photos, index, onIndex, onClose, onTooth, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const p = photos[index]
  const go = (n) => { setConfirm(false); onIndex((index + n + photos.length) % photos.length) }

  useEffect(() => {
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })
  if (!p) return null

  return (
    <div className="fade fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Photo">
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1 text-[#ffffff]">
          <p className="truncate text-sm font-bold">{fmtLongDay(p.date)}</p>
          <p className="text-xs opacity-60">{index + 1} of {photos.length}</p>
        </div>
        <ToothSelect value={p.tooth} onChange={(t) => onTooth(p, t)} className="h-9 border-[#ffffff]/30 bg-black/60 text-[#ffffff]" />
        {confirm ? (
          <>
            <button onClick={() => { onDelete(p); setConfirm(false) }} className="h-9 rounded-lg bg-[#ffffff] px-3 text-sm font-bold text-[#000000]">Delete</button>
            <button onClick={() => setConfirm(false)} className={`h-9 rounded-lg px-3 text-sm font-bold ${bar}`}>Keep</button>
          </>
        ) : <button onClick={() => setConfirm(true)} aria-label="Delete photo" className={`grid h-9 w-9 place-items-center rounded-lg ${bar}`}><Trash2 size={16} /></button>}
        <button onClick={onClose} aria-label="Close" className={`grid h-9 w-9 place-items-center rounded-lg ${bar}`}><X size={18} /></button>
      </div>
      <div className="relative min-h-0 flex-1">
        <PhotoImage id={p.id} className="h-full w-full object-contain" />
        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" className={`absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full ${bar}`}><ChevronLeft size={22} /></button>
            <button onClick={() => go(1)} aria-label="Next" className={`absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full ${bar}`}><ChevronRight size={22} /></button>
          </>
        )}
      </div>
    </div>
  )
}

// Before / after: drag the slider to reveal the older photo over the newer one
export function CompareView({ a, b, onClose }) {
  const [older, newer] = [a, b].sort((x, y) => x.date.localeCompare(y.date) || x.createdAt.localeCompare(y.createdAt))
  const [pos, setPos] = useState(50)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fade fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Compare photos">
      <div className="flex items-center justify-between p-3 text-[#ffffff]">
        <p className="text-sm font-bold">Before / after</p>
        <button onClick={onClose} aria-label="Close" className={`grid h-9 w-9 place-items-center rounded-lg ${bar}`}><X size={18} /></button>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center px-3">
        <div className="relative aspect-[4/3] max-h-full w-full max-w-4xl select-none overflow-hidden rounded-xl bg-black">
          <PhotoImage id={newer.id} className="absolute inset-0 h-full w-full object-contain" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <PhotoImage id={older.id} className="h-full w-full object-contain" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#ffffff]" style={{ left: `${pos}%` }} />
          <span className={`absolute left-2 top-2 rounded-lg px-2 py-1 text-xs font-bold ${bar}`}>{fmtLongDay(older.date)}</span>
          <span className={`absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-bold ${bar}`}>{fmtLongDay(newer.date)}</span>
        </div>
      </div>
      <div className="p-4">
        <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Slide to compare" className="mx-auto block w-full max-w-4xl accent-[#ffffff]" />
      </div>
    </div>
  )
}
