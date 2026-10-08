import { gsap } from 'gsap'
import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface RevealOptions {
  y?: number
  duration?: number
  delay?: number
  stagger?: number
}

/**
 * Core animation helpers. Every helper degrades to "show immediately" under
 * prefers-reduced-motion and only animates transform/opacity.
 */
export function useAnimation() {
  const reduced = prefersReducedMotion()

  function fadeIn(el: Element | Element[], o: RevealOptions = {}) {
    if (reduced) return gsap.set(el, { opacity: 1, clearProps: 'transform' })
    return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: o.duration ?? 0.8, delay: o.delay ?? 0, ease: 'power2.out' })
  }
  function slideUp(el: Element | Element[], o: RevealOptions = {}) {
    if (reduced) return gsap.set(el, { opacity: 1, y: 0 })
    return gsap.fromTo(
      el,
      { opacity: 0, y: o.y ?? 40 },
      { opacity: 1, y: 0, duration: o.duration ?? 0.8, delay: o.delay ?? 0, ease: 'power3.out', stagger: o.stagger ?? 0 },
    )
  }
  function stagger(els: Element[], o: RevealOptions = {}) {
    return slideUp(els, { y: 24, duration: 0.6, stagger: o.stagger ?? 0.08, delay: o.delay })
  }
  function textReveal(el: Element, o: RevealOptions = {}) {
    if (reduced) return gsap.set(el, { opacity: 1 })
    return gsap.fromTo(
      el,
      { opacity: 0, y: 16, letterSpacing: '0.12em' },
      { opacity: 1, y: 0, letterSpacing: 'inherit', duration: o.duration ?? 1, delay: o.delay ?? 0, ease: 'power2.out' },
    )
  }
  return { reduced, fadeIn, slideUp, stagger, textReveal }
}

/**
 * Reveal each matching element when it enters the viewport (once).
 * kind: fade | rise | stagger (children appear one by one, with blur).
 * `root` can be a scroll container (builder preview). Returns replay().
 */
export function useScrollReveal(container: Ref<HTMLElement | null>, kind: () => string = () => 'fade', root?: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined
  let targets: HTMLElement[] = []

  const parts = (el: HTMLElement): Element[] => (kind() === 'stagger' && el.children.length > 1 ? Array.from(el.children) : [el])
  const from = (): gsap.TweenVars => (kind() === 'mask' ? { opacity: 0, y: 24, clipPath: 'inset(0 0 100% 0)' } : kind() === 'rise' ? { opacity: 0, y: 70, scale: 0.97 } : kind() === 'stagger' ? { opacity: 0, y: 28, filter: 'blur(6px)' } : { opacity: 0, y: 40 })
  const to = (): gsap.TweenVars => ({ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', ...(kind() === 'mask' ? { clipPath: 'inset(0 0 0% 0)' } : {}), duration: kind() === 'stagger' ? 0.9 : kind() === 'mask' ? 1.3 : 1, ease: 'power3.out', stagger: 0.16 })

  function init() {
    observer?.disconnect()
    const host = container.value
    if (!host) return
    targets = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal]'))
    const all = targets.flatMap(parts)
    gsap.killTweensOf(all)
    if (kind() === 'none' || prefersReducedMotion() || !('IntersectionObserver' in window)) {
      gsap.set(all, { opacity: 1, y: 0, scale: 1, clipPath: 'none', clearProps: 'filter' })
      return
    }
    gsap.set(all, from())
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          gsap.to(parts(e.target as HTMLElement), to())
          observer?.unobserve(e.target)
        }
      },
      { root: root?.value ?? null, threshold: 0.12 },
    )
    targets.forEach((t) => observer?.observe(t))
  }

  onMounted(init)
  onBeforeUnmount(() => observer?.disconnect())
  return { replay: init }
}
