import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, X, FlipHorizontal2, RotateCw, SwitchCamera, Loader2, RefreshCw, Trash2, VideoOff } from 'lucide-react'
import PhotoImage, { seedPhoto } from './PhotoImage'
import { useStore } from '../data/store'
import { ALL_TEETH, camKey, camName, camPrefs, cameraError, cameraSupported, captureFrame, listCameras, openCamera, pickIntraoral } from '../data/camera'

const onVideo = 'bg-black/60 text-[#ffffff] backdrop-blur hover:bg-black/80'
const typing = (t) => /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable

export function ToothSelect({ value, onChange, teeth = [], className = '', label = 'Tooth' }) {
  return (
    <select aria-label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={`rounded-lg border border-line bg-card px-2 text-xs font-semibold outline-none focus:border-teal-500 ${className}`}>
      <option value="">No tooth</option>
      {teeth.length > 0 && <optgroup label="This visit">{teeth.map((t) => <option key={`s${t}`} value={t}>Tooth {t}</option>)}</optgroup>}
      <optgroup label="All teeth">{ALL_TEETH.map((t) => <option key={t} value={t}>Tooth {t}</option>)}</optgroup>
    </select>
  )
}

// Live view of the wired intra-oral camera. Captures upload straight to private storage.
// `photos` (optional) renders this session's photos below; otherwise the parent shows them.
export default function CameraPanel({ patient, teeth = [], photos, onAdd, onUpdate, onRemove }) {
  const { uploadPhoto, updatePhoto, deletePhoto } = useStore()
  const videoRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('starting') // starting | live | missing | choose | error
  const [chooser, setChooser] = useState(false) // user asked to pick the camera
  const [error, setError] = useState('')
  const [devices, setDevices] = useState([])
  const [active, setActive] = useState(null)
  const [prefs, setPrefs] = useState(camPrefs.get)
  const [restart, setRestart] = useState(0)
  const [tag, setTag] = useState(null)
  const [pending, setPending] = useState([]) // uploads in flight or failed: { key, url, blob, tooth, failed }
  const [flashing, setFlashing] = useState(false)
  const [learning, setLearning] = useState(false)
  const [note, setNote] = useState('')

  const teethKey = teeth.join()
  useEffect(() => { if (teeth.length === 1) setTag(teeth[0]) }, [teethKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const updatePrefs = (patch) => { camPrefs.set(patch); setPrefs((p) => ({ ...p, ...patch })) }

  // Start / stop the camera while the panel is open. Only the camera chosen as "intra-oral" is ever opened.
  useEffect(() => {
    if (!open) return
    let cancelled = false, stream
    document.activeElement?.blur?.()
    ;(async () => {
      setStatus('starting'); setError('')
      try {
        const devs = await listCameras()
        if (cancelled) return
        setDevices(devs)
        const pick = chooser ? { device: null, reason: 'choose' } : pickIntraoral(devs, camPrefs.get().camKey)
        if (!pick.device) { setStatus(pick.reason); return }
        stream = await openCamera(pick.device.deviceId)
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        if (pick.reason === 'auto') camPrefs.set({ camKey: camKey(pick.device) })
        stream.getVideoTracks()[0].onended = () => setRestart((n) => n + 1) // unplugged
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        setPrefs(camPrefs.get()); setActive(pick.device); setStatus('live')
      } catch (e) { if (!cancelled) { setStatus('error'); setError(cameraError(e)) } }
    })()
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()) }
  }, [open, restart, chooser])

  // Plugging the camera in (or out) while the panel is open re-checks automatically
  useEffect(() => {
    if (!open) return
    const onChange = () => { if (status !== 'live') setRestart((n) => n + 1) }
    navigator.mediaDevices.addEventListener('devicechange', onChange)
    return () => navigator.mediaDevices.removeEventListener('devicechange', onChange)
  }, [open, status])

  const choose = (d) => { camPrefs.set({ camKey: camKey(d) }); setChooser(false); setRestart((n) => n + 1) }

  const send = useCallback(async (item) => {
    try {
      const photo = await uploadPhoto(patient.id, item.blob, item.tooth)
      seedPhoto(photo.id, item.url)
      setPending((p) => p.filter((x) => x.key !== item.key))
      onAdd?.(photo)
    } catch { setPending((p) => p.map((x) => (x.key === item.key ? { ...x, failed: true } : x))) }
  }, [patient.id, uploadPhoto, onAdd])

  const shoot = useCallback(async () => {
    const v = videoRef.current
    if (!v || status !== 'live' || !v.videoWidth) return
    setFlashing(true); setTimeout(() => setFlashing(false), 140)
    const blob = await captureFrame(v, prefs)
    const item = { key: `${Date.now()}${Math.random()}`, url: URL.createObjectURL(blob), blob, tooth: tag || undefined, failed: false }
    setPending((p) => [...p, item])
    send(item)
  }, [status, prefs, tag, send])

  // Space, or the camera's own button if the browser can see it, takes the photo
  useEffect(() => {
    if (!open || status !== 'live') return
    const onKey = (e) => {
      if (e.repeat || typing(e.target)) return
      if (learning) {
        if (e.code === 'Escape') { setLearning(false); return }
        e.preventDefault(); updatePrefs({ key: e.code }); setLearning(false); setNote(`Camera button saved: “${e.code}”`)
        return
      }
      if (e.code === 'Space' || (prefs.key && e.code === prefs.key)) { e.preventDefault(); shoot() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, status, learning, prefs.key, shoot])

  const label = active ? camName(active) : 'Intra-oral camera'
  const transform = `${prefs.rotate ? 'rotate(180deg) ' : ''}${prefs.flip ? 'scaleX(-1)' : ''}`

  const changeTooth = async (photo, tooth) => { const p = await updatePhoto(photo.id, { tooth }).catch(() => null); if (p) onUpdate?.(p) }
  const remove = async (photo) => { try { await deletePhoto(photo.id); onRemove?.(photo.id) } catch { /* toast already shown */ } }

  if (!cameraSupported()) return <p className="rounded-xl bg-bg p-3 text-sm text-muted">This browser can’t use a camera. Open Dentiq in Chrome.</p>

  return (
    <div className="space-y-3">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-sm font-bold hover:border-teal-400">
          <Camera size={18} /> Open camera
        </button>
      ) : (
        <div className="space-y-2">
          <div className="relative aspect-[4/3] max-h-[58vh] w-full overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-contain" style={{ transform }} />
            <div className={`pointer-events-none absolute inset-0 bg-[#ffffff] transition-opacity duration-150 ${flashing ? 'opacity-70' : 'opacity-0'}`} />
            {status === 'starting' && <div className="absolute inset-0 grid place-items-center text-sm text-[#ffffff]"><span><Loader2 className="mr-2 inline animate-spin" size={18} />Starting camera…</span></div>}
            {status === 'error' && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-[#ffffff]">
                <div>
                  <p className="mb-3">{error}</p>
                  <button type="button" onClick={() => setRestart((n) => n + 1)} className="rounded-lg bg-[#ffffff] px-3 py-2 font-bold text-[#000000]"><RefreshCw size={14} className="mr-1 inline" />Try again</button>
                </div>
              </div>
            )}
            {status === 'missing' && (
              <div className="absolute inset-0 grid place-items-center overflow-y-auto p-6 text-center text-sm text-[#ffffff]">
                <div className="max-w-sm">
                  <VideoOff className="mx-auto mb-2" size={28} />
                  <p className="font-bold">Intra-oral camera not found</p>
                  <p className="mt-1 opacity-80">Plug it in and wait a few seconds. It connects automatically.</p>
                  {devices.length > 0 && <p className="mt-3 text-xs opacity-60">Cameras seen by this computer: {devices.map(camName).join(', ')}</p>}
                  <div className="mt-4 flex justify-center gap-2">
                    <button type="button" onClick={() => setRestart((n) => n + 1)} className="rounded-lg bg-[#ffffff] px-3 py-2 font-bold text-[#000000]"><RefreshCw size={14} className="mr-1 inline" />Check again</button>
                    {devices.length > 0 && <button type="button" onClick={() => setChooser(true)} className="rounded-lg border border-[#ffffff]/40 px-3 py-2 font-bold">Choose camera…</button>}
                  </div>
                </div>
              </div>
            )}
            {status === 'choose' && (
              <div className="absolute inset-0 overflow-y-auto p-5 text-sm text-[#ffffff]">
                <p className="font-bold">Which one is the intra-oral camera?</p>
                <p className="mb-3 text-xs opacity-70">Pick it once. Dentiq remembers it on this computer and never opens any other camera.</p>
                <div className="space-y-2">
                  {devices.map((d) => (
                    <button key={d.deviceId} type="button" onClick={() => choose(d)} className="flex w-full items-center gap-3 rounded-xl border border-[#ffffff]/30 px-3 py-3 text-left hover:bg-[#ffffff]/10">
                      <Camera size={18} /><span className="min-w-0 flex-1 truncate font-semibold">{camName(d)}</span>
                    </button>
                  ))}
                </div>
                {chooser && <button type="button" onClick={() => setChooser(false)} className="mt-3 text-xs font-bold underline">Cancel</button>}
              </div>
            )}
            <div className="absolute inset-x-2 top-2 flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-[#ffffff]">{label}</span>
              <button type="button" onClick={() => setChooser(true)} title="Choose which camera is the intra-oral one" className={`grid h-8 w-8 place-items-center rounded-lg ${onVideo}`}><SwitchCamera size={15} /></button>
              <button type="button" onClick={() => updatePrefs({ flip: !prefs.flip })} title="Mirror" aria-pressed={prefs.flip} className={`grid h-8 w-8 place-items-center rounded-lg ${onVideo} ${prefs.flip ? 'ring-2 ring-[#ffffff]' : ''}`}><FlipHorizontal2 size={15} /></button>
              <button type="button" onClick={() => updatePrefs({ rotate: !prefs.rotate })} title="Turn upside down" aria-pressed={prefs.rotate} className={`grid h-8 w-8 place-items-center rounded-lg ${onVideo} ${prefs.rotate ? 'ring-2 ring-[#ffffff]' : ''}`}><RotateCw size={15} /></button>
              <button type="button" onClick={() => { setOpen(false); setLearning(false) }} title="Close camera" className={`grid h-8 w-8 place-items-center rounded-lg ${onVideo}`}><X size={15} /></button>
            </div>
            <button type="button" onClick={shoot} disabled={status !== 'live'} aria-label="Take photo"
              className="absolute bottom-3 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full border-4 border-[#ffffff] bg-[#ffffff]/20 transition active:scale-90 disabled:opacity-30">
              <span className="h-11 w-11 rounded-full bg-[#ffffff]" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
            <label className="flex items-center gap-2 font-semibold text-ink">Tag tooth
              <ToothSelect value={tag} onChange={setTag} teeth={teeth} className="h-8" />
            </label>
            <span>Tap the shutter or press <b>Space</b></span>
            <button type="button" onClick={() => { setLearning((l) => !l); setNote('') }} className="font-bold underline underline-offset-2">
              {learning ? 'Now press the camera’s button… (Esc to cancel)' : prefs.key ? `Camera button: ${prefs.key} (change)` : 'Set camera button'}
            </button>
          </div>
          {note && <p className="text-xs font-semibold">{note}</p>}
        </div>
      )}

      {(pending.length > 0 || (photos && photos.length > 0)) && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {(photos || []).map((p) => (
            <div key={p.id} className="space-y-1">
              <div className="relative">
                <PhotoImage id={p.id} className="aspect-[4/3] w-full rounded-xl object-cover" />
                <button type="button" onClick={() => remove(p)} aria-label="Delete photo" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-[#ffffff] hover:bg-black/80"><Trash2 size={13} /></button>
              </div>
              <ToothSelect value={p.tooth} onChange={(t) => changeTooth(p, t)} teeth={teeth} className="h-7 w-full" />
            </div>
          ))}
          {pending.map((p) => (
            <div key={p.key} className="space-y-1">
              <div className="relative">
                <img src={p.url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover opacity-60" />
                <div className="absolute inset-0 grid place-items-center">
                  {p.failed
                    ? <button type="button" onClick={() => { setPending((x) => x.map((i) => (i.key === p.key ? { ...i, failed: false } : i))); send(p) }} className="rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-[#ffffff]"><RefreshCw size={12} className="mr-1 inline" />Retry</button>
                    : <Loader2 className="animate-spin text-[#ffffff] drop-shadow" size={20} />}
                </div>
              </div>
              <p className="text-center text-[11px] text-muted">{p.failed ? 'Upload failed' : 'Saving…'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
