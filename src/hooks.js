import { useEffect, useState } from 'react'

/**
 * Adds `is-in` to any element with the `reveal` class once it scrolls into
 * view. Runs once per element. Falls back to showing everything if
 * IntersectionObserver isn't available.
 */
export function useScrollReveal() {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal')

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/**
 * The header is on screen from the very top, sitting transparently over the
 * hero gradient. It turns solid as soon as the page moves at all — otherwise
 * hero text scrolls underneath a see-through bar and the two collide.
 */
export function useHeaderSolid() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // offsetHeight is 0 before first layout; without a fallback the
      // threshold goes negative and the bar flashes solid over the hero.
      setSolid(window.scrollY > 24)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return solid
}
