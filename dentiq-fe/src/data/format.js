// Formatting helpers shared across the app

export const rupees = (n = 0) => '₹' + Number(n).toLocaleString('en-IN')

// Local (IST) date as YYYY-MM-DD
export const isoDay = (d = new Date()) => d.toLocaleDateString('en-CA')

export const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return d }

export const fmtDay = (iso) => (iso ? new Date(`${iso}T12:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—')

export const fmtLongDay = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

export const fmtTime = (hhmm) => {
  if (!hhmm) return 'Any time'
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const fmtPhone = (p = '') => (p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p)

export const waLink = (phone, text) => `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}${text ? `?text=${encodeURIComponent(text)}` : ''}`
