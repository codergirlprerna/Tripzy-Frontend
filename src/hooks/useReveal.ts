import { useEffect, useRef, useState } from 'react'

/**
 * Adds a fade-up-on-scroll effect to any element.
 * Usage: const { ref, isVisible } = useReveal()
 *        <div ref={ref} className={isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}>
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
