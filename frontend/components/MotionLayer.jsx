'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * MotionLayer — site-wide smoothness for the public website (not admin/reporter).
 *  1. Lenis inertia scrolling (desktop mouse/trackpad only, off for reduced motion)
 *  2. Scroll-reveal: sections/cards below the fold fade + rise in, grid items staggered
 *  3. Image fade-in: images inside <main> fade in once loaded instead of popping
 * Purely additive: content above the fold is never hidden, and every effect cleans
 * up after itself so existing hover/transition styles keep working.
 */

const REVEAL_SELECTOR = [
  'main section',
  'main article',
  'main [class*="grid-cols"] > *',
  'main .space-y-4 > *',
  'main .space-y-6 > *',
  'main .space-y-8 > *',
].join(',')

const isScrollableNode = (node) => {
  if (!(node instanceof HTMLElement)) return false
  if (node === document.body || node === document.documentElement) return false
  const oy = getComputedStyle(node).overflowY
  return (oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1
}

export default function MotionLayer() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    /* ---------- 1. Lenis smooth scrolling ---------- */
    let lenis = null
    let lockObserver = null
    if (!reduceMotion && finePointer) {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        autoRaf: true,
        anchors: true,
        // Let modals, dropdowns, selects and any inner scroll area scroll natively
        prevent: (node) =>
          !!node.closest?.('[role="dialog"],[role="alertdialog"],[role="listbox"],[role="menu"],[data-radix-scroll-area-viewport],[data-lenis-prevent]') ||
          isScrollableNode(node),
      })
      window.__lenis = lenis
      // Radix dialogs lock body scroll via data-scroll-locked: pause Lenis meanwhile
      lockObserver = new MutationObserver(() => {
        if (document.body.hasAttribute('data-scroll-locked')) lenis.stop()
        else lenis.start()
      })
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked', 'style'] })
    }

    /* ---------- 2. Scroll reveal ---------- */
    const timers = new Set()
    const reveal = (el) => {
      if (!el.classList.contains('reveal-pending')) return
      io?.unobserve(el)
      const delay = Number(el.dataset.revealDelay || 0)
      el.style.transitionDelay = `${delay}ms`
      el.classList.add('reveal-in')
      el.classList.remove('reveal-pending')
      // Drop our transition once done so the element's own hover transitions win again
      const t = setTimeout(() => {
        el.classList.remove('reveal-in')
        el.style.transitionDelay = ''
        timers.delete(t)
      }, 800 + delay)
      timers.add(t)
    }
    const io = reduceMotion ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) reveal(entry.target) })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    // Safety net: if IntersectionObserver is throttled (background tab, jump-scroll),
    // reveal anything already in or above the viewport so content never stays hidden.
    let scrollTimer = 0
    const sweep = () => {
      scrollTimer = 0
      const vh = window.innerHeight
      document.querySelectorAll('.reveal-pending').forEach((el) => {
        if (el.getBoundingClientRect().top < vh) reveal(el)
      })
    }
    const onScroll = () => { if (!scrollTimer) scrollTimer = setTimeout(sweep, 120) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    const registerReveal = (root) => {
      if (!io) return
      const vh = window.innerHeight
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.reveal) return
        el.dataset.reveal = '1'
        // Never hide what's already on screen, nor nest reveals inside a pending parent
        if (el.getBoundingClientRect().top < vh * 0.92) return
        if (el.parentElement?.closest('.reveal-pending')) return
        if (getComputedStyle(el).position === 'fixed') return
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : []
        const idx = Math.max(0, siblings.indexOf(el))
        el.dataset.revealDelay = String(Math.min(idx % 6, 5) * 60)
        el.classList.add('reveal-pending')
        io.observe(el)
      })
    }

    /* ---------- 3. Image fade-in ---------- */
    const registerImages = (root) => {
      if (reduceMotion) return
      root.querySelectorAll('main img').forEach((img) => {
        if (img.dataset.fade) return
        img.dataset.fade = '1'
        if (img.complete && img.naturalWidth > 0) return
        img.classList.add('img-fade')
        let fallbackTimer = 0
        const done = () => {
          img.classList.add('img-loaded')
          if (fallbackTimer) {
            clearTimeout(fallbackTimer)
            timers.delete(fallbackTimer)
            fallbackTimer = 0
          }
        }
        // Safety fallback so cached/raced/lazy images never remain hidden at opacity: 0
        fallbackTimer = setTimeout(done, 1200)
        timers.add(fallbackTimer)
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
        if (img.complete) done()
      })
    }

    const scan = () => {
      registerReveal(document)
      registerImages(document)
    }
    scan()

    // SPA view changes and lazy-loaded content add nodes: rescan (debounced).
    // setTimeout, not rAF: rAF never fires in background tabs, which would stall the scan.
    let raf = 0
    const mo = new MutationObserver(() => {
      if (raf) return
      raf = setTimeout(() => { raf = 0; scan() }, 60)
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
      io?.disconnect()
      lockObserver?.disconnect()
      if (raf) clearTimeout(raf)
      timers.forEach(clearTimeout)
      if (lenis) {
        lenis.destroy()
        if (window.__lenis === lenis) delete window.__lenis
      }
    }
  }, [])

  return null
}
