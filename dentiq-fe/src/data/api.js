// Thin fetch wrapper for the Dentiq API. Token is kept on this device only.
const BASE = import.meta.env.VITE_API_URL || '/api'
const KEY = 'dentiq-token'

// Expiry time (ms) encoded in the JWT; 0 if unreadable
export const tokenExpiry = (t) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000 } catch { return 0 } }

export const tokenStore = {
  get: () => {
    try {
      const t = localStorage.getItem(KEY)
      if (t && tokenExpiry(t) > Date.now()) return t
      localStorage.removeItem(KEY) // expired session
    } catch { /* storage unavailable */ }
    return null
  },
  set: (t) => { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY) } catch { /* storage unavailable */ } },
}

// Guest sessions are read-only (the server enforces it; the UI uses this to skip write forms)
export const isGuestToken = (t) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'guest' } catch { return false } }

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

async function send(method, path, { body, type = 'application/json' } = {}) {
  const token = tokenStore.get()
  try {
    return await fetch(BASE + path, { method, headers: { 'Content-Type': type, ...(token && { Authorization: `Bearer ${token}` }) }, body })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your internet.')
  }
}

async function request(method, path, body) {
  const res = await send(method, path, { body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error || `Error ${res.status}`)
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
  // Raw JPEG upload (intra-oral photos)
  upload: async (p, blob) => {
    const res = await send('POST', p, { body: blob, type: 'image/jpeg' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(res.status, data.error || `Error ${res.status}`)
    return data
  },
  // Authenticated image download (an <img> tag can't send the login header)
  blob: async (p) => {
    const res = await send('GET', p)
    if (!res.ok) throw new ApiError(res.status, 'Photo not available')
    return res.blob()
  },
}
