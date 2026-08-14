import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Standard modal accessibility behavior, applied consistently across every
 * modal in the app instead of each one reinventing it (or, as was the case
 * before this, none of them having it at all):
 *
 * 1. Escape closes the modal.
 * 2. Focus moves into the modal when it opens, and is trapped there while
 *    open (Tab/Shift+Tab cycle within the modal, not out to the page
 *    underneath) — without this, a keyboard user tabbing through a modal
 *    can silently tab into content behind it that's supposed to be hidden.
 * 3. Focus returns to whatever was focused before the modal opened (usually
 *    the button that triggered it) once it closes — without this, a
 *    keyboard user's focus gets dropped back at the top of the page after
 *    closing a modal, losing their place entirely.
 *
 * Usage: const modalRef = useModalA11y(onClose); then put modalRef on the
 * modal's outermost card div (the one with the modal-card class).
 */
export function useModalA11y(onClose: () => void) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement

    const modal = modalRef.current
    const focusable = modal?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const first = focusable?.[0]
    // Focus the first focusable element, or the modal container itself as a
    // fallback (e.g. a modal that's all static content with no inputs).
    ;(first || modal)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab' || !modal) return

      const focusableEls = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusableEls.length === 0) return

      const firstEl = focusableEls[0]
      const lastEl = focusableEls[focusableEls.length - 1]

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return modalRef
}