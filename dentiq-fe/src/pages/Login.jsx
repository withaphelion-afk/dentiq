import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Logo } from '../components/Layout'
import { inputCls, PrimaryBtn } from '../components/Sheet'
import { useStore } from '../data/store'

export default function Login() {
  const { login } = useStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await login(password) } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-card to-bg px-4">
      <form onSubmit={submit} className="rise w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl">
        <Logo className="mb-5 h-12 w-12" />
        <h1 className="text-2xl font-extrabold">Dentiq</h1>
        <p className="mb-6 text-sm text-muted">Gagneja Dental Clinic</p>
        <label className="relative block">
          <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className={`${inputCls} pl-10`} />
        </label>
        {error && <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
        <PrimaryBtn type="submit" disabled={!password || busy} className="mt-4 w-full">{busy ? 'Signing in…' : 'Sign in'}</PrimaryBtn>
      </form>
    </div>
  )
}
