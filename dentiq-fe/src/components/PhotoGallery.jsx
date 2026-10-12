import { useState } from 'react'
import { Images, Check, Columns2, Camera } from 'lucide-react'
import PhotoImage from './PhotoImage'
import CameraPanel from './CameraPanel'
import { CompareView } from './PhotoViewer'
import { fmtLongDay } from '../data/format'

// Photos grouped by day. Tap one to open it; "Compare" picks two for a before/after slider.
export default function PhotoGallery({ patient, photos, toothFilter, onClearTooth, onOpen, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [picked, setPicked] = useState([])

  const shown = toothFilter ? photos.filter((p) => p.tooth === toothFilter) : photos
  const days = [...new Set(shown.map((p) => p.date))]

  const tap = (p) => {
    if (!comparing) return onOpen(p, shown)
    setPicked((cur) => (cur.includes(p.id) ? cur.filter((id) => id !== p.id) : [...cur, p.id].slice(-2)))
  }
  const stop = () => { setComparing(false); setPicked([]) }
  const view = picked.length === 2 ? picked.map((id) => photos.find((x) => x.id === id)) : null

  return (
    <div className="rise rounded-3xl bg-card p-5" style={{ animationDelay: '120ms' }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="mr-auto flex items-center gap-2 font-bold"><Images size={18} /> Photos <span className="text-sm font-medium text-muted">{photos.length}</span></p>
        {toothFilter && <button onClick={onClearTooth} className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">Tooth {toothFilter} ✕</button>}
        {photos.length > 1 && (
          <button onClick={() => (comparing ? stop() : setComparing(true))} aria-pressed={comparing} className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${comparing ? 'border-teal-600 bg-teal-600 text-white' : 'border-line'}`}>
            <Columns2 size={14} /> {comparing ? 'Pick 2 photos' : 'Compare'}
          </button>
        )}
        <button onClick={() => setAdding((a) => !a)} className="flex h-9 items-center gap-1.5 rounded-lg bg-teal-600 px-3 text-xs font-bold text-white"><Camera size={14} /> {adding ? 'Hide camera' : 'Add photos'}</button>
      </div>

      {adding && <div className="mb-4"><CameraPanel patient={patient} onAdd={onAdd} /></div>}

      {days.length ? days.map((d) => (
        <div key={d} className="mb-4 last:mb-0">
          <p className="mb-2 text-xs font-bold text-muted">{fmtLongDay(d)}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {shown.filter((p) => p.date === d).map((p) => (
              <button key={p.id} onClick={() => tap(p)} className={`relative overflow-hidden rounded-xl ${picked.includes(p.id) ? 'ring-4 ring-teal-600' : ''}`}>
                <PhotoImage id={p.id} className="aspect-[4/3] w-full object-cover" />
                {p.tooth && <span className="absolute bottom-1 left-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-[#ffffff]">#{p.tooth}</span>}
                {picked.includes(p.id) && <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-teal-600 text-white"><Check size={14} /></span>}
              </button>
            ))}
          </div>
        </div>
      )) : <p className="text-sm text-muted">{toothFilter ? `No photos of tooth ${toothFilter} yet.` : 'No photos yet. Tap “Add photos” to use the camera.'}</p>}

      {view && view[0] && view[1] && <CompareView a={view[0]} b={view[1]} onClose={stop} />}
    </div>
  )
}
