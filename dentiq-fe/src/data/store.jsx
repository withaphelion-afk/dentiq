import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, tokenStore } from './api'
import { addDays, isoDay } from './format'

// App state backed by the Dentiq API. Every mutation calls the server, then refreshes what it touched.
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

const digitsOf = (s = '') => s.replace(/\D/g, '')

export function StoreProvider({ children }) {
  const [token, setToken] = useState(tokenStore.get)
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState(null)
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [payments, setPayments] = useState([])
  const [reminders, setReminders] = useState({ items: [], auto: false })
  const [toast, setToast] = useState('')
  const toastTimer = useRef()

  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }, [])

  const logout = useCallback(() => { tokenStore.set(null); setToken(null); setReady(false) }, [])

  // Wrap API calls: show errors as a toast, log out on 401
  const call = useCallback(async (fn) => {
    try { return await fn() } catch (e) {
      if (e.status === 401) logout()
      flash(e.message)
      throw e
    }
  }, [flash, logout])

  const load = {
    patients: async () => setPatients(await api.get('/patients')),
    appointments: async () => setAppointments(await api.get(`/appointments?from=${isoDay(addDays(-31))}&to=${isoDay(addDays(120))}`)),
    payments: async () => setPayments(await api.get('/payments')),
    reminders: async () => setReminders(await api.get('/reminders')),
    settings: async () => setSettings(await api.get('/settings')),
  }
  const refresh = (...keys) => Promise.all((keys.length ? keys : Object.keys(load)).map((k) => load[k]()))

  useEffect(() => {
    if (!token) return
    let live = true
    call(() => refresh()).then(() => live && setReady(true)).catch(() => {})
    return () => { live = false }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (password) => {
    const { token: t } = await api.post('/auth/login', { password })
    tokenStore.set(t)
    setToken(t)
  }

  const today = isoDay()
  const byId = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients])
  const patientById = (id) => byId.get(id)
  const queue = appointments.filter((a) => a.date === today).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const collected = payments.reduce((s, p) => s + p.amount, 0)
  const treatments = [...(settings?.treatments || [])].sort((a, b) => b.uses - a.uses)

  const searchPatients = (q, limit = 6) => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const d = digitsOf(term)
    return patients.filter((p) => p.name.toLowerCase().includes(term) || (d && p.phone.includes(d))).slice(0, limit)
  }
  const findByPhone = (phone) => {
    const d = digitsOf(phone)
    return d.length >= 10 ? patients.find((p) => p.phone === d.slice(-10)) : undefined
  }

  const actions = {
    addPatient: (data) => call(async () => {
      const p = await api.post('/patients', data)
      await refresh('patients')
      return p
    }),
    updatePatient: (id, data) => call(async () => { const p = await api.patch(`/patients/${id}`, data); await refresh('patients'); return p }),
    loadPatient: (id) => call(() => api.get(`/patients/${id}`)),
    addVisit: (data) => call(async () => {
      const r = await api.post('/visits', data)
      await refresh('patients', 'appointments', 'payments', 'settings', 'reminders')
      return r
    }),
    collectDue: (id, mode) => call(async () => {
      const p = await api.post(`/patients/${id}/collect`, { mode })
      await refresh('patients', 'payments')
      return p
    }),
    bookAppointment: (data) => call(async () => {
      const a = await api.post('/appointments', data)
      await refresh('appointments', 'patients', 'reminders')
      return a
    }),
    updateAppointment: (id, data) => call(async () => {
      const a = await api.patch(`/appointments/${id}`, data)
      await refresh('appointments', 'patients', 'reminders')
      return a
    }),
    cycleStatus: (id) => {
      const next = { upcoming: 'now', now: 'done', done: 'upcoming' }
      const a = appointments.find((x) => x.id === id)
      setAppointments((xs) => xs.map((x) => (x.id === id ? { ...x, status: next[x.status] } : x))) // instant feedback
      return call(() => api.patch(`/appointments/${id}`, { status: next[a.status] })).catch(() => refresh('appointments'))
    },
    saveSettings: (data) => call(async () => { const s = await api.put('/settings', data); setSettings(s); return s }),
    markReminder: (kind, id, via = 'manual') => call(async () => { const r = await api.post(`/reminders/${kind}/${id}`, { via }); await refresh('reminders'); return r }),
    report: (month) => call(() => api.get(`/reports?month=${month}`)),
  }

  const value = {
    token, ready, login, logout, flash, toast,
    settings, patients, appointments, queue, payments, collected, reminders, treatments, today,
    patientById, searchPatients, findByPhone, ...actions,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
