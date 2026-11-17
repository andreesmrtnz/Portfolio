import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Gesture, Pt, Rig } from './characterRig'

/**
 * The guide as short anime clips (made with Gemini/Veo, keyed to transparent WebM by
 * scripts/build-guide-clips.py). A looping idle clip is the resting pose; gestures and talking play
 * over it with a quick crossfade. All source clips start and end in the same neutral pose.
 * Browsers without transparent video (Safari) and reduced motion get still frames instead.
 */
const BASE = '/guide/'
type Clip = 'idle' | 'talk' | 'wave' | 'point' | 'point-m' | 'thumbs' | 'laptop'
const CLIPS: Clip[] = ['wave', 'talk', 'point', 'point-m', 'thumbs', 'laptop']
const FOR_GESTURE: Partial<Record<Gesture, Clip>> = { wave: 'wave', think: 'laptop', bye: 'thumbs', thumbs: 'thumbs' }
// pointing plays once and stays on its last frame for a few seconds, then it goes back to rest
const HOLD: Partial<Record<Clip, number>> = { point: 3, 'point-m': 3 }
const LOOPS = new Set<Clip>(['talk'])
const EXTRAS: Clip[] = ['thumbs', 'laptop']
const FADE = .18
const still = (name: Clip) => `${BASE}${name}.webp`

// Every browser on iPhone/iPad (Chrome and Firefox included) runs on WebKit, which draws transparent WebM with a solid background.
const onApple = typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
const alphaVideo = typeof navigator !== 'undefined' && !onApple && !/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)

function createVideoRig(host: HTMLDivElement, lean: HTMLDivElement): Rig {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const useVideo = () => alphaVideo && !reduced.matches
  const idle = host.querySelector('.guide-idle') as HTMLImageElement
  const frame = document.createElement('img')
  frame.className = 'guide-clip'
  frame.alt = ''
  host.appendChild(frame)
  const videos = new Map<Clip, HTMLVideoElement>()
  let playing: Clip | null = null
  let talking = false
  let destroyed = false
  let flap: gsap.core.Tween | null = null
  let stillTimer: gsap.core.Tween | null = null
  let extraTimer: gsap.core.Tween | null = null
  let holdTimer: gsap.core.Tween | null = null
  let edge: 'bottom' | 'left' | 'right' = 'bottom'
  let vx = 0
  // the resting loop plays from the start; the still under it only shows until the video can play
  let rest: HTMLElement = idle
  if (useVideo()) {
    const v = video('idle')
    v.loop = true
    v.addEventListener('playing', () => { if (rest === idle) { rest = v; if (!playing) show(null) } }, { once: true })
    void v.play().catch(() => {})
  }
  video('wave')
  const loadTimer = window.setTimeout(() => CLIPS.forEach(video), 600)

  function video(name: Clip) {
    let v = videos.get(name)
    if (!v) {
      v = document.createElement('video')
      v.className = 'guide-clip'
      v.muted = true
      v.playsInline = true
      v.preload = 'auto'
      v.src = `${BASE}${name}.webm`
      v.addEventListener('ended', () => {
        if (playing !== name) return
        const hold = HOLD[name]
        if (hold) holdTimer = gsap.delayedCall(hold, () => { if (playing === name) finish() })
        else finish()
      })
      host.appendChild(v)
      videos.set(name, v)
    }
    return v
  }

  // crossfade: the new layer fades in on top, the others go only once it covers them (no see-through dip)
  let z = 1
  function show(el: HTMLElement | null) {
    const next = el ?? rest
    next.style.zIndex = String(++z)
    gsap.to(next, { opacity: 1, duration: FADE, overwrite: 'auto' })
    host.querySelectorAll<HTMLElement>('.guide-clip, .guide-idle').forEach(x => {
      if (x !== next) gsap.to(x, { opacity: 0, duration: .05, delay: FADE, overwrite: 'auto' })
    })
  }

  function play(name: Clip) {
    if (destroyed) return
    stillTimer?.kill()
    holdTimer?.kill()
    flap?.kill()
    flap = null
    const loop = LOOPS.has(name)
    if (!useVideo()) {
      // still frame of the gesture, then back to rest
      playing = name
      frame.src = still(name)
      show(frame)
      if (!loop) stillTimer = gsap.delayedCall(2.4, finish)
      return
    }
    const v = video(name)
    playing = name
    v.loop = loop
    v.currentTime = 0
    void v.play().catch(() => {})
    show(v)
  }

  function finish() {
    playing = null
    if (talking) startTalk()
    else show(null)
  }

  function startTalk() {
    if (!useVideo()) {
      // alternate two stills like a cel animation
      if (reduced.matches) return
      flap?.kill()
      let open = true
      frame.src = `${BASE}talk.webp`
      show(frame)
      flap = gsap.to({}, { duration: .14, repeat: -1, onRepeat: () => {
        open = !open
        frame.src = `${BASE}${open ? 'talk' : 'idle'}.webp`
      } })
      playing = 'talk'
      return
    }
    play('talk')
  }

  function stopTalk() {
    flap?.kill()
    flap = null
    if (playing === 'talk') finish()
  }

  // now and then, while it is just standing there, it does something on its own
  function scheduleExtra() {
    extraTimer?.kill()
    extraTimer = gsap.delayedCall(18 + Math.random() * 14, () => {
      if (destroyed) return
      if (!playing && !talking && !reduced.matches && useVideo() && !document.hidden) play(EXTRAS[Math.floor(Math.random() * EXTRAS.length)])
      scheduleExtra()
    })
  }
  scheduleExtra()

  // breathing, a slow sway and a lean into the screen when peeking from a side
  const life = (time: number) => {
    if (destroyed) return
    const calm = reduced.matches
    const tilt = edge === 'right' ? -14 : edge === 'left' ? 14 : 0
    const sway = calm ? 0 : Math.sin(time * .9) * .8
    const motion = Math.max(-6, Math.min(6, -vx / 260))
    gsap.set(lean, { rotation: tilt + sway + motion })
  }
  gsap.ticker.add(life)

  return {
    gesture(g, opts = {}) {
      if (g === 'rest') { if (playing && playing !== 'talk') finish(); return }
      if (g === 'point') {
        const head = host.getBoundingClientRect()
        const t: Pt | null = opts.target?.() ?? null
        const left = t ? t.x < head.left + head.width / 2 : opts.side === 'L'
        play(left ? 'point' : 'point-m') // the source clip points toward the left of the picture
        return
      }
      const clip = FOR_GESTURE[g]
      if (clip) play(clip)
    },
    mood() {},
    peek(e) { edge = e },
    talk(on) {
      if (on === talking) return
      talking = on
      if (on) { if (!playing) startTalk() } else stopTalk()
    },
    setAttention() {},
    setLook() {},
    setVelocity(x) { vx += (x - vx) * .2 },
    hop() {
      if (reduced.matches) return
      gsap.timeline()
        .to(host, { y: -14, duration: .16, ease: 'power2.out' })
        .to(host, { y: 0, duration: .5, ease: 'bounce.out' })
    },
    react() {
      this.hop()
      if (!playing || playing === 'talk') play('thumbs')
    },
    destroy() {
      destroyed = true
      window.clearTimeout(loadTimer)
      gsap.ticker.remove(life)
      flap?.kill()
      stillTimer?.kill()
      holdTimer?.kill()
      extraTimer?.kill()
      videos.forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); v.remove() })
      frame.remove()
    },
  }
}

export function VideoCharacter({ onRig }: { onRig: (rig: Rig | null) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const lean = useRef<HTMLDivElement>(null)
  const cb = useRef(onRig)
  cb.current = onRig

  useEffect(() => {
    if (!host.current || !lean.current) return
    const rig = createVideoRig(host.current, lean.current)
    cb.current(rig)
    return () => { rig.destroy(); cb.current(null) }
  }, [])

  return (
    <div className="guide-video" ref={lean} aria-hidden="true">
      <div className="guide-video-frame" ref={host}>
        <img src={`${BASE}idle.webp`} alt="" className="guide-idle" draggable={false} />
      </div>
    </div>
  )
}
