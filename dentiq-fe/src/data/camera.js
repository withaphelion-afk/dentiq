// Intra-oral camera helpers: strict device selection, capture-to-JPEG, and remembered preferences (per computer)
const KEY = 'dentiq-camera'
const MAX_EDGE = 1600
// Cameras that are part of the computer or software cameras: never chosen automatically
const NOT_INTRAORAL = /truevision|integrated|built-?in|facetime|front|rear|back camera|laptop|ir camera|infrared|windows hello|virtual|obs|droidcam|snap camera|iriun|epoccam/i

const defaults = { flip: false, turn: 0, camKey: '', key: '' } // turn: 0 | 90 | 180 | 270 degrees
export const camPrefs = {
  get: () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY)) || {}
      return { ...defaults, ...saved, turn: saved.turn ?? (saved.rotate ? 180 : 0) } // older versions stored rotate: true
    } catch { return { ...defaults } }
  },
  set: (patch) => { try { localStorage.setItem(KEY, JSON.stringify({ ...camPrefs.get(), ...patch })) } catch { /* storage unavailable */ } },
}

export const cameraSupported = () => Boolean(navigator.mediaDevices?.getUserMedia)

export const cameraError = (e) => {
  const n = e?.name
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'Camera access is blocked. Allow the camera for this site in Chrome (lock icon in the address bar) and in Windows → Settings → Privacy → Camera.'
  if (n === 'NotReadableError' || n === 'AbortError') return 'The camera is busy. Close other apps using it (Camera app, another tab), then try again.'
  return 'Could not start the camera.'
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const enumerate = async () => (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')

// Stable id for a camera across plugs/ports: Chrome puts the USB vendor:product id in the label, e.g. "USB2.0 PC CAMERA (1908:2311)"
export const camKey = (d) => d.label.match(/\(([0-9a-f]{4}:[0-9a-f]{4})\)/i)?.[1]?.toLowerCase() || d.label
export const camName = (d) => d.label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '') || 'Camera'

// All cameras with readable names. Names stay hidden until the site has camera permission once.
export async function listCameras() {
  let devs = await enumerate()
  if (!devs.length || devs.every((d) => !d.label)) {
    const probe = await navigator.mediaDevices.getUserMedia({ video: true })
    probe.getTracks().forEach((t) => t.stop())
    await sleep(400) // let Windows release the device
    devs = await enumerate()
  }
  return devs
}

// Strict choice: the camera saved as "intra-oral", else the only non-built-in camera. Never the laptop webcam by itself.
export function pickIntraoral(devs, savedKey) {
  const saved = savedKey && devs.find((d) => camKey(d) === savedKey)
  if (saved) return { device: saved, reason: 'saved' }
  const external = devs.filter((d) => !NOT_INTRAORAL.test(d.label))
  if (savedKey) return { device: null, reason: 'missing' } // chosen camera is not plugged in right now
  if (external.length === 1) return { device: external[0], reason: 'auto' }
  return { device: null, reason: external.length ? 'choose' : 'missing' }
}

export async function openCamera(deviceId) {
  let last
  for (let i = 0; i < 3; i++) {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
    } catch (e) {
      last = e
      if (e.name !== 'NotReadableError' && e.name !== 'AbortError') break
      await sleep(600)
    }
  }
  throw last
}

// Current video frame → compressed JPEG (≈50–400 KB), applying the mirror / 180° settings
export async function captureFrame(video, { flip, turn = 0 }) {
  const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
  const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale)
  const canvas = document.createElement('canvas')
  const sideways = turn % 180 !== 0
  canvas.width = sideways ? h : w; canvas.height = sideways ? w : h
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  if (turn) ctx.rotate((turn * Math.PI) / 180)
  if (flip) ctx.scale(-1, 1)
  ctx.drawImage(video, -w / 2, -h / 2, w, h)
  const toBlob = (q) => new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))
  let blob = await toBlob(0.82)
  if (blob.size > 900 * 1024) blob = await toBlob(0.68)
  return blob
}

// Adult teeth in chart order (FDI)
export const ALL_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
