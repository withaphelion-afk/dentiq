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
import { rupees, fmtDay, fmtTime } from './data/format'

const prefs = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage unavailable */ } },
}

export default function App() {
  const { token, ready, toast, flash } = useStore()
  const [booting, setBooting] = useState(true)
  const endSplash = useCallback(() => setBooting(false), [])
  const [page, setPage] = useState('today')
  const [profileId, setProfileId] = useState(null)
  // { type: 'visit', patient? } | { type: 'patient', prefill? } | { type: 'book', patient?, appointment?, date? }
  const [sheet, setSheet] = useState(null)
  const closeSheet = useCallback(() => setSheet(null), [])
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
  const openProfile = (p) => { setProfileId(p.id); setPage('patients'); scrollTo(0, 0) }
  const go = (id) => { setPage(id); setProfileId(null); scrollTo(0, 0) }

  if (booting) return <Splash onDone={endSplash} />
  if (!token) return <><Login />{toast && <Toast msg={toast} />}</>

  const content = !ready ? <DashboardSkeleton />
    : page === 'today' ? <Dashboard onNewVisit={newVisit} onNewPatient={newPatient} />
    : page === 'patients' && profileId ? <Profile id={profileId} onBack={() => setProfileId(null)} onVisit={newVisit} onBook={book} />
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
          onSaved={({ patient, paid, due, followUp }) => {
            setSheet(null)
            flash(`Saved ${patient.name.split(' ')[0]} · ${rupees(paid)} paid${due > 0 ? ` · ${rupees(due)} due` : ''}${followUp ? ` · next visit ${fmtDay(followUp.date)}` : ''}`)
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
