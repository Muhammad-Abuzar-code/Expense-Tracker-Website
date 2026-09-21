import { useState } from 'react'
import { AlertCircle, BarChart3, Target, Wallet } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { errorText } from '../lib/useFinanceData'

const POINTS = [
  { icon: Wallet, text: 'Log income and expenses in seconds' },
  { icon: Target, text: 'Monthly budgets with live progress' },
  { icon: BarChart3, text: 'Six-month cash-flow insights' }
]

export default function AuthScreen() {
  const { login, register, sessionExpired, clearSessionExpired } = useAuth()

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError('')
    clearSessionExpired()
  }

  const submit = async event => {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')
    clearSessionExpired()

    try {
      if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password })
      } else {
        await login(email.trim(), password)
      }
    } catch (requestError) {
      setError(errorText(requestError, 'Something went wrong. Please try again.'))
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="/budget.png" alt="Expense Tracker" width={24} height={24} />
          </div>

          <div>
            <div className="brand-name">Expense Tracker</div>
          </div>
        </div>

        <div>
          <h2 className="auth-headline">Every dollar accounted for.</h2>

          <p className="auth-copy">
            Track what comes in, control what goes out, and see exactly where your money
            goes each month.
          </p>

          <div className="auth-points">
            {POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="auth-point">
                <i>
                  <Icon size={14} />
                </i>
                {text}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="auth-main">
        <div className="auth-card">
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>

          <p className="auth-sub">
            {isRegister
              ? 'Start tracking your spending in under a minute.'
              : 'Sign in to pick up where you left off.'}
          </p>

          {sessionExpired && (
            <p className="banner">
              <AlertCircle size={15} />
              <span>Your session expired. Please sign in again.</span>
            </p>
          )}

          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={8}
                required
              />
            </label>

            {error && (
              <p className="form-error">
                <AlertCircle size={14} />
                {error}
              </p>
            )}

            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy && <span className="spinner" />}
              {isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-note">
            {isRegister ? 'Already have an account? ' : 'New to Pocketwise? '}

            <button type="button" onClick={switchMode}>
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
