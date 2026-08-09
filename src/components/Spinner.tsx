type Props = {
  size?: number
  className?: string
}

/**
 * Shared loading spinner. Centralizing this one piece of markup means every
 * async action in the app (uploads, saves, votes, sign-in, AI generation)
 * shows the same visual instead of some spots getting a spinner and others
 * just changing button text — the inconsistency itself is what made it hard
 * to tell whether something was actually loading or just stuck.
 */
export default function Spinner({ size = 14, className = '' }: Props) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[2px] border-ink border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  )
}