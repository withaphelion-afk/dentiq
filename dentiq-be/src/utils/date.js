import { config } from '../config.js'

// All dates are stored as clinic-local 'YYYY-MM-DD' strings to avoid timezone drift.
export const today = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: config.tz })

export const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const prettyDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

export const prettyTime = (hhmm) => {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const isoDate = /^\d{4}-\d{2}-\d{2}$/
export const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/
