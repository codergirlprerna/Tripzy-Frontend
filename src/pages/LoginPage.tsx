import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  const { logIn, logInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await logIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    if (googleSubmitting) return // the popup itself can take a moment to open — block re-clicks until it resolves
    setError('')
    setGoogleSubmitting(true)
    try {
      await logInWithGoogle()
      navigate('/dashboard')
    } catch (err: any) {
      // A user closing the Google popup themselves isn't a real error worth alarming them with.
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Something went wrong. Try again.')
      }
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(150deg, #ff6ec7 0%, #ffb86b 45%, #6ee7ff 100%)' }}
    >
      <div className="sticker-card w-full max-w-[420px] p-8 shadow-hard sm:p-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-display text-[22px] font-extrabold">
          <span
            className="inline-block h-[26px] w-[26px] -rotate-[8deg] rounded-lg border-[2.5px] border-ink"
            style={{ background: 'linear-gradient(135deg, #ff6ec7, #ffb86b)' }}
          />
          tripzy
        </Link>

        <h1 className="mb-2 font-display text-[26px] font-extrabold leading-tight">
          Welcome back.
        </h1>
        <p className="mb-7 text-[14.5px] font-medium text-[#4a4460]">
          Log in to keep the story going.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border-[2px] border-ink bg-pink/20 px-4 py-3 text-[13px] font-semibold text-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full !text-center disabled:opacity-60">
            {submitting ? 'Logging in…' : 'Log in →'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-[2px] flex-1 bg-ink/10" />
          <span className="font-mono text-[11px] font-bold text-[#4a4460]">OR</span>
          <div className="h-[2px] flex-1 bg-ink/10" />
        </div>

        <button onClick={handleGoogleLogin} disabled={googleSubmitting} className="btn-secondary w-full !text-center disabled:opacity-60">
          {googleSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              Opening Google sign-in…
            </span>
          ) : (
            'Continue with Google'
          )}
        </button>

        <p className="mt-6 text-center text-[13.5px] font-medium text-[#4a4460]">
          New to Tripzy?{' '}
          <Link to="/signup" className="font-bold text-ink underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}