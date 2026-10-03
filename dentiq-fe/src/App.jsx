import { useCallback, useEffect, useRef, useState } from 'react'
import Splash from './components/Splash'
import Layout from './components/Layout'
import { DashboardSkeleton } from './components/Shimmer'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Profile from './pages/Profile'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import NewVisit from './forms/NewVisit'
import NewPatient from './forms/NewPatient'
import BookAppointment from './forms/BookAppointment'
import { useStore } from './data/store'
import { justUpdated, startAutoUpdate } from './data/autoUpdate'
import { openSheetStore, parseRoute, routePath, splashSeen } from './data/persist'
import { rupees, fmtDay, fmtTime } from './data/format'

const prefs = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage unavailable */ } },
}

export default function App() {
  const { token, ready, toast, flash, patientById, appointments } = useStore()
  const [booting, setBooting] = useState(() => !splashSeen.get())
  const endSplash = useCallback(() => { splashSeen.set(); setBooting(false) }, [])
  // The page lives in the address bar, so refresh and the back button keep you where you were
  const [{ page, profileId }, setRoute] = useState(() => parseRoute())
  const navigate = useCallback((p, id = null) => {
    const path = routePath(p, id)
    if (path !== location.pathname) history.pushState(null, '', path)
    setRoute({ page: p, profileId: id })
    scrollTo(0, 0)
  }, [])
  useEffect(() => {
    const onPop = () => setRoute(parseRoute())
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])
  // { type: 'visit', patient? } | { type: 'patient', prefill? } | { type: 'book', patient?, appointment?, date? }
  const [sheet, setSheet] = useState(null)
  const closeSheet = useCallback(() => setSheet(null), [])
  // Remember the open form (by id) so a refresh reopens it with its draft
  const restored = useRef(false)
  useEffect(() => {
    if (!restored.current) return // don't wipe the saved form before it has been restored
    openSheetStore.set(sheet && { type: sheet.type, patientId: sheet.patient?.id, appointmentId: sheet.appointment?.id, date: sheet.date, prefill: sheet.prefill })
  }, [sheet])
  useEffect(() => {
    if (!ready || restored.current) return
    restored.current = true
    const s = openSheetStore.get()
    if (s && (!s.patientId || patientById(s.patientId))) setSheet({ type: s.type, patient: s.patientId && patientById(s.patientId), appointment: s.appointmentId && appointments.find((a) => a.id === s.appointmentId), date: s.date, prefill: s.prefill })
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps
  const [dark, setDark] = useState(() => prefs.get('theme') === 'dark' || (!prefs.get('theme') && matchMedia('(prefers-color-scheme: dark)').matches))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    prefs.set('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Auto-update: only reload when no form is open and Settings (unsaved edits) isn't showing
  const safe = useRef(true)
  useEffect(() => { safe.current = !sheet && page !== 'settings' }, [sheet, page])
  useEffect(() => startAutoUpdate(() => safe.current), [])
  useEffect(() => { if (justUpdated()) flash('Dentiq updated to the latest version') }, [flash])

  const newVisit = (patient) => setSheet({ type: 'visit', patient })
  const newPatient = (prefill = '') => setSheet({ type: 'patient', prefill })
  const book = (patient, date) => setSheet({ type: 'book', patient, date })
  const reschedule = (appointment) => setSheet({ type: 'book', appointment })
  const openProfile = (p) => navigate('patients', p.id)
  const go = (id) => navigate(id)

  if (booting) return <Splash onDone={endSplash} />
  if (!token) return <><Login />{toast && <Toast msg={toast} />}</>

  const content = !ready ? <DashboardSkeleton />
    : page === 'today' ? <Dashboard onNewVisit={newVisit} onNewPatient={newPatient} />
    : page === 'patients' && profileId ? <Profile id={profileId} onBack={() => navigate('patients')} onVisit={newVisit} onBook={book} />
    : page === 'patients' ? <Patients onOpen={openProfile} onVisit={newVisit} onNewPatient={newPatient} />
    : page === 'calendar' ? <Calendar onBook={book} onReschedule={reschedule} onVisit={newVisit} onOpen={openProfile} />
    : page === 'reports' ? <Reports />
    : <Settings dark={dark} toggleDark={() => setDark((d) => !d)} />

  return (
    <>
      <Layout page={page} setPage={go} dark={dark} toggleDark={() => setDark((d) => !d)} onPickPatient={openProfile} onAddPatient={newPatient} onNewVisit={() => newVisit()}>
        {content}
      </Layout>
      {sheet?.type === 'visit' && (
        <NewVisit
          patient={sheet.patient}
          onClose={closeSheet}
          onNewPatient={newPatient}
          onSaved={({ patient, paid, due, followUp, date }) => {
            setSheet(null)
            flash(`Saved ${patient.name.split(' ')[0]}${date ? ` (visit of ${fmtDay(date)})` : ''} · ${rupees(paid)} paid${due > 0 ? ` · ${rupees(due)} due` : ''}${followUp ? ` · next visit ${fmtDay(followUp.date)}` : ''}`)
          }}
        />
      )}
      {sheet?.type === 'patient' && (
        <NewPatient
          prefill={sheet.prefill}
          onClose={closeSheet}
          onSaved={(p, startVisit) => { if (startVisit) newVisit(p); else { setSheet(null); openProfile(p); flash(`${p.name} added`) } }}
        />
      )}
      {sheet?.type === 'book' && (
        <BookAppointment
          patient={sheet.patient}
          appointment={sheet.appointment}
          date={sheet.date}
          onClose={closeSheet}
          onNewPatient={newPatient}
          onSaved={({ patient, date, time }) => { setSheet(null); flash(`${patient.name.split(' ')[0]} booked · ${fmtDay(date)}${time ? `, ${fmtTime(time)}` : ''}`) }}
        />
      )}
      {toast && <Toast msg={toast} />}
    </>
  )
}

const Toast = ({ msg }) => (
  <div role="status" className="rise fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-center text-sm font-semibold text-card shadow-xl md:bottom-8">{msg}</div>
)
