import { useEffect, useState } from 'react'

const REVEAL_SELECTOR = '.reveal'

/** Collects `root` itself plus any `.reveal` descendants it brought with it. */
function revealable(root) {
  if (!root || root.nodeType !== 1) return []
  const found = root.matches?.(REVEAL_SELECTOR) ? [root] : []
  root.querySelectorAll?.(REVEAL_SELECTOR).forEach((el) => found.push(el))
  return found
}

/**
 * Adds `is-in` to any element with the `reveal` class once it scrolls into
 * view. Runs once per element. Falls back to showing everything if
 * IntersectionObserver isn't available.
 *
 * Sections render from the shipped defaults first and re-render once the
 * published configuration arrives, so elements keep appearing after this hook
 * mounts. A MutationObserver hands those late arrivals to the same
 * IntersectionObserver — without it they would keep the `reveal` class, never
 * gain `is-in`, and sit at `opacity: 0` forever.
 */
export function useScrollReveal() {
  useEffect(() => {
    const show = (el) => el.classList.add('is-in')
    const canMutate = 'MutationObserver' in window

    if (!('IntersectionObserver' in window)) {
      const showAll = () => revealable(document.body).forEach(show)
      showAll()
      if (!canMutate) return undefined
      const mutations = new MutationObserver(showAll)
      mutations.observe(document.body, { childList: true, subtree: true })
      return () => mutations.disconnect()
    }

    const viewport = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target)
            viewport.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    // Observing an element twice is a no-op, so rescanning is always safe.
    const watch = (root) => revealable(root).forEach((el) => viewport.observe(el))
    watch(document.body)

    if (!canMutate) return () => viewport.disconnect()

    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(watch))
    })
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutations.disconnect()
      viewport.disconnect()
    }
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
