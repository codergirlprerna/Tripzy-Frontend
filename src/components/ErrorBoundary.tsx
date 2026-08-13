import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

/**
 * React error boundaries can only be class components — there's no Hooks
 * equivalent for catching render/lifecycle errors in child components (this
 * is a React limitation, not a stylistic choice). Without this, any
 * uncaught error anywhere in the tree unmounts the whole app and leaves a
 * blank white screen with no explanation, which is indistinguishable from
 * "the site is broken" or "I got signed out" from the outside — exactly the
 * kind of confusing failure that's been hard to diagnose from screenshots
 * alone this session.
 *
 * This catches render errors only — it does NOT catch errors inside async
 * code (event handlers, Firestore listeners, fetch calls), which is why
 * individual components still need their own try/catch for those (as most
 * already do — see the `catch` blocks in trips.ts, entries.ts, etc.).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production this is the one place to wire up error reporting
    // (Sentry, LogRocket, or even just logAnalyticsEvent) if that's ever
    // added — right now it just goes to the console.
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo.componentStack)
  }

  handleReload = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
          <AlertTriangle size={40} className="text-[#c0325f]" />
          <h1 className="font-display text-[22px] font-extrabold">Something broke</h1>
          <p className="max-w-[380px] text-[14px] font-medium text-[#4a4460]">
            This screen hit an error it couldn't recover from. Your data is fine — this is just a display problem.
          </p>
          <button onClick={this.handleReload} className="btn-primary !px-6 !py-3">
            Back to dashboard
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-w-[600px] overflow-x-auto rounded-lg border-2 border-ink/20 bg-paper-dim p-3 text-left font-mono text-[11px] text-[#c0325f]">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}