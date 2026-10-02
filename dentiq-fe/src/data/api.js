// Thin fetch wrapper for the Dentiq API. Token is kept on this device only.
const BASE = import.meta.env.VITE_API_URL || '/api'
const KEY = 'dentiq-token'

export const tokenStore = {
  get: () => { try { return localStorage.getItem(KEY) } catch { return null } },
  set: (t) => { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY) } catch { /* storage unavailable */ } },
}

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

async function request(method, path, body) {
  const token = tokenStore.get()
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your internet.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error || `Error ${res.status}`)
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
}
