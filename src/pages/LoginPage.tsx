import { Link } from 'react-router-dom'

export default function LoginPage() {
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

        {/* Placeholder form — wire up to Firebase Auth next */}
        <form className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Email
            </label>
            <input
              type="email"
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
              placeholder="••••••••"
              className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
            />
          </div>

          <button type="submit" className="btn-primary mt-2 w-full !text-center">
            Log in →
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-[2px] flex-1 bg-ink/10" />
          <span className="font-mono text-[11px] font-bold text-[#4a4460]">OR</span>
          <div className="h-[2px] flex-1 bg-ink/10" />
        </div>

        <button className="btn-secondary w-full !text-center">Continue with Google</button>

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