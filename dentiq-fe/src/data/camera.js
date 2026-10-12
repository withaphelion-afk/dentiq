// Intra-oral camera helpers: device choice, capture-to-JPEG, and remembered preferences (per computer)
const KEY = 'dentiq-camera'
const MAX_EDGE = 1600
const BUILT_IN = /truevision|integrated|built-?in|facetime|front|laptop|hd camera|webcam/i

export const camPrefs = {
  get: () => { try { return { flip: false, rotate: false, deviceId: '', key: '', ...JSON.parse(localStorage.getItem(KEY)) } } catch { return { flip: false, rotate: false, deviceId: '', key: '' } } },
  set: (patch) => { try { localStorage.setItem(KEY, JSON.stringify({ ...camPrefs.get(), ...patch })) } catch { /* storage unavailable */ } },
}

export const cameraSupported = () => Boolean(navigator.mediaDevices?.getUserMedia)

export const cameraError = (e) => {
  const n = e?.name
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'Camera access is blocked. Allow the camera for this site in Chrome (lock icon in the address bar) and in Windows → Settings → Privacy → Camera.'
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No camera found. Plug in the intra-oral camera and try again.'
  if (n === 'NotReadableError' || n === 'AbortError') return 'The camera is busy. Close other apps using it (Camera app, another tab) and try again.'
  return 'Could not start the camera.'
}

// Start the preferred camera. Uses the saved device, else the first one that doesn't look like the laptop webcam.
export async function startCamera(preferredId) {
  const probe = await navigator.mediaDevices.getUserMedia({ video: true }) // grants permission so device names are readable
  probe.getTracks().forEach((t) => t.stop())
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')
  const chosen = devices.find((d) => d.deviceId === preferredId) || devices.find((d) => !BUILT_IN.test(d.label)) || devices[0]
  if (!chosen) throw Object.assign(new Error('none'), { name: 'NotFoundError' })
  const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: chosen.deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
  return { stream, devices, deviceId: chosen.deviceId }
}

// Current video frame → compressed JPEG (≈200–400 KB), applying the mirror / 180° settings
export async function captureFrame(video, { flip, rotate }) {
  const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
  const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.translate(w / 2, h / 2)
  if (rotate) ctx.rotate(Math.PI)
  if (flip) ctx.scale(-1, 1)
  ctx.drawImage(video, -w / 2, -h / 2, w, h)
  const toBlob = (q) => new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))
  let blob = await toBlob(0.82)
  if (blob.size > 900 * 1024) blob = await toBlob(0.68)
  return blob
}

// Adult teeth in chart order (FDI)
export const ALL_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
