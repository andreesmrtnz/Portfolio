import gsap from 'gsap'

export type Gesture = 'rest' | 'wave' | 'point' | 'think' | 'bye' | 'thumbs'
export type Mood = 'calm' | 'happy' | 'curious' | 'surprised' | 'proud'
export interface Pt { x: number; y: number }
type Side = 'L' | 'R'

/** viewBox of the character SVG. Everything below lives in this coordinate space. */
export const VB = { x: -60, y: -10, w: 440, h: 400 }
const SHOULDER: Record<Side, Pt> = { L: { x: 92, y: 224 }, R: { x: 228, y: 224 } }
const UPPER = 64
const FORE = 60
const RAD = Math.PI / 180

/** Finger layout in hand space: fingers point along +x, thumb side is -y. */
export const FINGERS = [
  { x: 7, y: -8, l1: 9, l2: 8, w: 6.4 }, // thumb
  { x: 23.5, y: -7.2, l1: 10, l2: 8.5, w: 5.4 }, // index
  { x: 24.5, y: -2.4, l1: 11, l2: 9, w: 5.6 }, // middle
  { x: 23.5, y: 2.4, l1: 10, l2: 8.5, w: 5.3 }, // ring
  { x: 21.5, y: 6.9, l1: 8, l2: 7, w: 4.8 }, // pinky
] as const

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)
function lerpAngle(a: number, b: number, t: number) {
  const d = ((b - a + 540) % 360) - 180
  return a + d * t
}
const f = (n: number) => n.toFixed(2)

interface Arm {
  x: number; y: number // wrist target, body space
  fs: number // foreshortening of the bones
  follow: number // 1 = hand follows forearm, 0 = absolute rotation
  abs: number; off: number
  wave: number; poke: number; pointW: number
  c0: number; c1: number; c2: number; c3: number; c4: number
  spread: number; thumb: number
}

function restArm(side: Side): Arm {
  const k = side === 'R' ? 1 : -1
  return {
    x: SHOULDER[side].x + k * 3, y: SHOULDER[side].y + 119, fs: 1, follow: 1, abs: 0, off: 0,
    wave: 0, poke: 0, pointW: 0,
    c0: .5, c1: .55, c2: .6, c3: .65, c4: .7, spread: .1, thumb: .2,
  }
}

const HAND = {
  open: { c0: 0, c1: 0, c2: 0, c3: 0, c4: 0, spread: .7, thumb: 1 },
  relaxed: { c0: .5, c1: .55, c2: .6, c3: .65, c4: .7, spread: .1, thumb: .2 },
  point: { c0: .75, c1: 0, c2: 1, c3: 1, c4: 1, spread: 0, thumb: .3 },
  thumbs: { c0: 0, c1: 1, c2: 1, c3: 1, c4: 1, spread: 0, thumb: 1 },
  think: { c0: .8, c1: 0, c2: .95, c3: 1, c4: 1, spread: 0, thumb: .1 },
}

function capsule(a: Pt, b: Pt, ra: number, rb: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const p = (q: Pt, r: number, s: number) => `${f(q.x + nx * r * s)} ${f(q.y + ny * r * s)}`
  return `M${p(a, ra, 1)} L${p(b, rb, 1)} A${rb} ${rb} 0 0 0 ${p(b, rb, -1)} L${p(a, ra, -1)} A${ra} ${ra} 0 0 0 ${p(a, ra, 1)}Z`
}

function solveArm(side: Side, target: Pt, fs: number) {
  const S = SHOULDER[side]
  const u = UPPER * fs
  const fo = FORE * fs
  const dx = target.x - S.x
  const dy = target.y - S.y
  const d = Math.hypot(dx, dy) || 1
  const dd = clamp(d, Math.abs(u - fo) + 3, u + fo - .6)
  const base = Math.atan2(dy, dx)
  const wrist = { x: S.x + Math.cos(base) * dd, y: S.y + Math.sin(base) * dd }
  const a = Math.acos(clamp((u * u + dd * dd - fo * fo) / (2 * u * dd), -1, 1))
  const sign = side === 'R' ? 1 : -1
  const elbow = { x: S.x + u * Math.cos(base + sign * a), y: S.y + u * Math.sin(base + sign * a) }
  return { S, elbow, wrist }
}

function mouthPath(cx: number, cy: number, open: number, smile: number, wide: number) {
  const w = 12.5 * wide
  const lift = -smile * 3.2
  const lx = cx - w
  const rx = cx + w
  const topCtl = cy + 1.5 + smile * 5 - open * 1.2
  const botCtl = topCtl + 1 + open * 24
  const top = `M${f(lx)} ${f(cy + lift)} Q${f(cx)} ${f(topCtl)} ${f(rx)} ${f(cy + lift)}`
  const fill = `${top} Q${f(cx)} ${f(botCtl)} ${f(lx)} ${f(cy + lift)}Z`
  return { top, fill }
}

export interface Rig {
  gesture(g: Gesture, opts?: { target?: () => Pt | null; side?: Side }): void
  mood(m: Mood, dur?: number): void
  /** Peeking in from a screen edge (3D renderer only). */
  peek?(edge: 'bottom' | 'left' | 'right'): void
  talk(on: boolean): void
  setAttention(fn: (() => Pt | null) | null): void
  setLook(v: Pt | null): void
  setVelocity(vx: number, vy: number): void
  hop(): void
  react(): void
  destroy(): void
}

export function createRig(svg: SVGSVGElement): Rig {
  const q = <T extends Element = SVGElement>(sel: string) => svg.querySelector(sel) as T
  const qa = <T extends Element = SVGElement>(sel: string) => Array.from(svg.querySelectorAll(sel)) as T[]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')

  const el = {
    body: q('[data-r="body"]'),
    head: q('[data-r="head"]'),
    face: q('[data-r="face"]'),
    cloud: q('[data-r="cloud"]'),
    puffsA: qa<SVGCircleElement>('[data-puff]'),
    eyeL: q('[data-r="eyeL"]'), eyeR: q('[data-r="eyeR"]'),
    irisL: q('[data-r="irisL"]'), irisR: q('[data-r="irisR"]'),
    browL: q('[data-r="browL"]'), browR: q('[data-r="browR"]'),
    mouthTop: q('[data-r="mouthTop"]'), mouthFill: q('[data-r="mouthFill"]'), mouthClip: q('[data-r="mouthClip"]'),
    tongue: q('[data-r="tongue"]'),
    blushL: q('[data-r="blushL"]'), blushR: q('[data-r="blushR"]'),
    curls: qa('[data-curl]'),
    hairBack: q('[data-r="hairBack"]'),
    shirt: q('[data-r="shirt"]'),
    arm: {
      L: {
        upper: q('[data-a="L-upper"]'), fore: q('[data-a="L-fore"]'), elbow: q('[data-a="L-elbow"]'),
        sleeveFill: q('[data-a="L-sleeve"]'), sleeveLine: q('[data-a="L-sleeveLine"]'), hand: q('[data-hand="L"]'),
      },
      R: {
        upper: q('[data-a="R-upper"]'), fore: q('[data-a="R-fore"]'), elbow: q('[data-a="R-elbow"]'),
        sleeveFill: q('[data-a="R-sleeve"]'), sleeveLine: q('[data-a="R-sleeveLine"]'), hand: q('[data-hand="R"]'),
      },
    },
  }
  const fingerEls = (side: Side) => qa(`[data-hand="${side}"] [data-f]`).map(g => ({
    g, s1: g.querySelector('.s1') as SVGRectElement, j: g.querySelector('.j') as SVGGElement, s2: g.querySelector('.s2') as SVGRectElement,
  }))
  const fingers = { L: fingerEls('L'), R: fingerEls('R') }
  const curlData = el.curls.map((c, i) => ({ c, w: Number(c.getAttribute('data-w') ?? 1), seed: i * 1.7 }))

  const s = {
    head: { rot: 0, yaw: 0, pitch: 0 },
    look: { x: 0, y: 0 },
    brow: { ly: 0, ry: 0, lt: 0, rt: 0 },
    eye: { blink: 0, squint: 0 },
    mouth: { open: 0, smile: .5, wide: 1 },
    blush: .25,
    body: { x: 0, y: 0, rot: 0 },
    cloud: { tilt: 0, sx: 1, sy: 1 },
    arms: { L: restArm('L'), R: restArm('R') } as Record<Side, Arm>,
  }

  let attention: (() => Pt | null) | null = null
  let lookOverride: Pt | null = null
  let talking = false
  let talkOpen = 0
  let pointers: Pt & { t: number } = { x: -9999, y: -9999, t: -99 }
  let glance: Pt = { x: 0, y: 0 }
  let idleTilt = 0
  let vel = { x: 0, y: 0 }
  let velSmooth = { x: 0, y: 0 }
  let hair = { x: 0, y: 0, rot: 0 }
  let hairLagRot = 0
  const pointing: { side: Side | null; target: (() => Pt | null) | null } = { side: null, target: null }
  let currentGesture: Gesture = 'rest'
  let freeSide: Side = 'L'
  let destroyed = false
  const calls: gsap.core.Tween[] = []

  const onPointer = (e: PointerEvent) => { pointers = { x: e.clientX, y: e.clientY, t: gsap.ticker.time } }
  window.addEventListener('pointermove', onPointer, { passive: true })

  /* ---------- life: blinking, idle glances ---------- */
  function blink() {
    if (destroyed) return
    const double = Math.random() < .18
    const tl = gsap.timeline()
    tl.to(s.eye, { blink: 1, duration: .07, ease: 'power2.in' }).to(s.eye, { blink: 0, duration: .13, ease: 'power2.out' })
    if (double) tl.to(s.eye, { blink: 1, duration: .07, delay: .06 }).to(s.eye, { blink: 0, duration: .13 })
    gsap.delayedCall(2 + Math.random() * 3.6, blink)
  }
  function idleTick() {
    if (destroyed) return
    const r = Math.random()
    const busy = talking || pointing.side !== null
    if (r < .42) {
      const g = { x: (Math.random() - .5) * 1.6, y: (Math.random() - .5) * .9 }
      gsap.to(glance, { x: g.x, y: g.y, duration: .22, ease: 'power3.out' })
      gsap.to(glance, { x: 0, y: 0, duration: .5, delay: .7 + Math.random() * 1.1, ease: 'power2.inOut' })
    } else if (r < .62) {
      const up = -4 - Math.random() * 3
      gsap.to(s.brow, { ly: up, ry: up, duration: .16, ease: 'power2.out' })
      gsap.to(s.brow, { ly: 0, ry: 0, duration: .4, delay: .6, ease: 'power2.inOut' })
    } else if (r < .72 && currentGesture !== 'think') {
      flourish()
    } else if (r < .8 && !busy) {
      const t = (Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 3)
      gsap.to(s.head, { rot: `+=${t}`, duration: .5, ease: 'sine.inOut', yoyo: true, repeat: 1 })
    } else if (!busy) {
      gsap.to(s.mouth, { smile: .95, duration: .25 })
      gsap.to(s.mouth, { smile: .5, duration: .6, delay: 1.2 })
    }
    gsap.delayedCall(2.4 + Math.random() * 3.6, idleTick)
  }
  // the free arm sometimes does something on its own: a little hello, or a stretch
  function flourish() {
    const side = freeSide
    const a = s.arms[side]
    if (destroyed || reduced.matches || a.pointW > 0 || a.wave > 0 || a.y < SHOULDER[side].y + 100) return
    if (currentGesture === 'wave' || currentGesture === 'bye') return
    const S = SHOULDER[side]
    const k = side === 'R' ? 1 : -1
    const tl = gsap.timeline({ onComplete: () => rest(side, .8) })
    tl.to(a, { x: S.x + 50 * k, y: S.y - 52, ...HAND.open, duration: .55, ease: 'back.out(1.3)', overwrite: 'auto' })
      .to(a, { wave: .8, duration: .25 })
      .to(a, { wave: 0, duration: .4 }, '+=1.1')
    calls.push(tl as never)
  }
  blink()
  gsap.delayedCall(1.6, idleTick)

  /* ---------- rendering ---------- */
  function toClient(p: Pt, rect: DOMRect): Pt {
    const sc = rect.width / VB.w
    return { x: rect.left + (p.x - VB.x) * sc, y: rect.top + (p.y - VB.y) * sc }
  }

  function renderHand(side: Side, wrist: Pt, forearmDeg: number, extra: number) {
    const a = s.arms[side]
    const hand = el.arm[side].hand
    const flip = side === 'R' ? 1 : -1
    const follow = forearmDeg + a.off
    const rot = lerpAngle(a.abs, follow, a.follow) + extra
    hand.setAttribute('transform', `translate(${f(wrist.x)} ${f(wrist.y)}) rotate(${f(rot)}) scale(1.38 ${f(1.38 * flip)})`)
    const curls = [a.c0, a.c1, a.c2, a.c3, a.c4]
    fingers[side].forEach((fe, i) => {
      const def = FINGERS[i]
      const c = clamp(curls[i], 0, 1)
      const isThumb = i === 0
      const ang = isThumb ? -8 - 58 * a.thumb : (i - 2.2) * a.spread * 8
      fe.g.setAttribute('transform', `translate(${def.x} ${def.y}) rotate(${f(ang + (isThumb ? 0 : c * 6))})`)
      const l1 = def.l1 * (1 - (isThumb ? .25 : .5) * c)
      const l2 = def.l2 * (1 - (isThumb ? .3 : .78) * c)
      fe.s1.setAttribute('width', f(l1 + def.w))
      fe.j.setAttribute('transform', `translate(${f(l1)} 0) rotate(${f(c * (isThumb ? 14 : 34))})`)
      fe.s2.setAttribute('width', f(l2 + def.w))
    })
  }

  function renderArm(side: Side, t: number, dt: number) {
    const a = s.arms[side]
    const k = side === 'R' ? 1 : -1
    const S = SHOULDER[side]
    let tx = a.x
    let ty = a.y
    let extra = 0
    if (a.pointW > 0 && pointing.side === side && pointing.target && svgRect) {
      const tp = pointing.target()
      if (tp) {
        const sc = svgRect.width / VB.w
        const sp = toClient({ x: S.x + s.body.x, y: S.y + s.body.y }, svgRect)
        const dir = Math.atan2(tp.y - sp.y, tp.x - sp.x)
        const reach = 116 + Math.sin(t * 5.4) * 3.5 * a.poke
        void sc
        tx = lerp(tx, S.x + Math.cos(dir) * reach, a.pointW)
        ty = lerp(ty, S.y + Math.sin(dir) * reach, a.pointW)
      }
    }
    if (a.wave > 0) {
      const w = Math.sin(t * 9.5) * a.wave
      tx += w * 12 * k
      ty += Math.abs(Math.cos(t * 9.5)) * -2.5 * a.wave
      extra = w * 20 * k
    }
    const breath = Math.sin(t * 1.9)
    if (a.pointW === 0 && a.wave === 0 && a.follow === 1 && Math.abs(a.y - (S.y + 119)) < 1) ty += breath * 1.6
    const { elbow, wrist } = solveArm(side, { x: tx, y: ty }, a.fs)
    void dt
    const ea = el.arm[side]
    ea.upper.setAttribute('d', capsule(S, elbow, 13.2, 11.8))
    ea.fore.setAttribute('d', capsule(elbow, wrist, 11.6, 9.2))
    ea.elbow.setAttribute('cx', f(elbow.x))
    ea.elbow.setAttribute('cy', f(elbow.y))
    // short sleeve: from the shoulder to ~58% of the upper arm
    const cuff = { x: lerp(S.x, elbow.x, .6), y: lerp(S.y, elbow.y, .6) }
    const dx = cuff.x - S.x
    const dy = cuff.y - S.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const r0 = 21
    const r1 = 19
    const P = (p: Pt, r: number, sg: number) => `${f(p.x + nx * r * sg)} ${f(p.y + ny * r * sg)}`
    const hem = `${f(cuff.x + dx / len * 7)} ${f(cuff.y + dy / len * 7)}`
    ea.sleeveFill.setAttribute('d', `M${P(S, r0, 1)} L${P(cuff, r1, 1)} Q${hem} ${P(cuff, r1, -1)} L${P(S, r0, -1)} A${r0} ${r0} 0 0 0 ${P(S, r0, 1)}Z`)
    ea.sleeveLine.setAttribute('d', `M${P(S, r0, 1)} L${P(cuff, r1, 1)} Q${hem} ${P(cuff, r1, -1)} L${P(S, r0, -1)}`)
    const forearmDeg = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) / RAD
    renderHand(side, wrist, forearmDeg, extra)
  }

  let svgRect: DOMRect | null = null
  function render(t: number, dt: number) {
    if (destroyed) return
    svgRect = svg.getBoundingClientRect()
    const rect = svgRect
    const calm = reduced.matches

    // --- gaze ---
    const eyeC = toClient({ x: 160, y: 112 }, rect)
    let gaze: Pt | null = attention?.() ?? null
    const pointerFresh = t - pointers.t < 5
    if (!gaze && pointerFresh) gaze = pointers
    let nx = 0
    let ny = 0
    if (lookOverride) { nx = lookOverride.x; ny = lookOverride.y } else if (gaze) {
      nx = clamp((gaze.x - eyeC.x) / (rect.width * 1.1), -1, 1)
      ny = clamp((gaze.y - eyeC.y) / (rect.width * 1.1), -1, 1)
    }
    const gx = clamp(nx + glance.x * (gaze ? .3 : 1), -1.2, 1.2)
    const gy = clamp(ny + glance.y * (gaze ? .3 : 1), -1.2, 1.2)
    s.look.x += (gx - s.look.x) * damp(12, dt)
    s.look.y += (gy - s.look.y) * damp(12, dt)
    s.head.yaw += (nx * .85 - s.head.yaw) * damp(3.6, dt)
    s.head.pitch += (ny * .8 - s.head.pitch) * damp(3.6, dt)
    idleTilt = Math.sin(t * .7) * 1.3 + Math.sin(t * 1.13 + 1) * .7

    // --- velocity from the flight ---
    velSmooth.x += (vel.x - velSmooth.x) * damp(7, dt)
    velSmooth.y += (vel.y - velSmooth.y) * damp(7, dt)
    const tiltTarget = clamp(velSmooth.x / 80, -17, 17) + clamp(velSmooth.y / 400, -5, 5) * Math.sign(velSmooth.x || 1)
    s.cloud.tilt += (tiltTarget - s.cloud.tilt) * damp(8, dt)
    const stretch = clamp(Math.hypot(velSmooth.x, velSmooth.y) / 5200, 0, .15)
    s.cloud.sx = 1 + stretch
    s.cloud.sy = 1 - stretch * .7

    // --- talking ---
    if (talking) {
      const syl = Math.max(0, Math.sin(t * 13 + Math.sin(t * 3.1) * 2.2))
      talkOpen = lerp(talkOpen, .12 + Math.pow(syl, .65) * .72, damp(30, dt))
    } else talkOpen = lerp(talkOpen, 0, damp(14, dt))
    const mouthOpen = clamp(s.mouth.open + talkOpen, 0, 1)

    // --- body ---
    const bob = calm ? 0 : Math.sin(t * 1.55) * 4.2 + Math.sin(t * .83) * 1.6
    const breath = calm ? 0 : Math.sin(t * 1.9) * 1.1
    const bodyY = s.body.y + bob
    const bodyRot = s.cloud.tilt * .45 + (calm ? 0 : Math.sin(t * .9) * .8)
    el.body.setAttribute('transform', `translate(${f(s.body.x)} ${f(bodyY)}) rotate(${f(bodyRot)} 160 300)`)
    s.body.rot = bodyRot
    el.shirt.setAttribute('transform', `translate(0 ${f(breath * .5)})`)
    el.cloud.setAttribute('transform', `translate(160 330) rotate(${f(s.cloud.tilt)}) scale(${f(s.cloud.sx)} ${f(s.cloud.sy)}) translate(-160 -330) translate(0 ${f(bob * .9)})`)
    el.puffsA.forEach((c, i) => {
      const base = Number(c.getAttribute('data-r0'))
      c.setAttribute('r', f(base * (1 + (calm ? 0 : Math.sin(t * 1.7 + i * 1.3) * .035))))
    })

    // --- head ---
    const headRot = s.head.rot + s.head.yaw * 6 + idleTilt
    el.head.setAttribute('transform', `translate(${f(s.head.yaw * 2.2)} ${f(s.head.pitch * 2 + breath * .4)}) rotate(${f(headRot)} 160 184)`)
    el.face.setAttribute('transform', `translate(${f(s.head.yaw * 7 + s.look.x * .8)} ${f(s.head.pitch * 4.5)})`)

    // --- hair: secondary motion, lags behind head/flight ---
    hairLagRot += (headRot - hairLagRot) * damp(3.4, dt)
    const lag = hairLagRot - headRot
    const targetX = clamp(-velSmooth.x * .012, -9, 9) + lag * .9
    const targetY = clamp(-velSmooth.y * .01, -8, 8) + Math.abs(lag) * -.15
    hair.x += (targetX - hair.x) * damp(9, dt)
    hair.y += (targetY - hair.y) * damp(9, dt)
    curlData.forEach(({ c, w, seed }) => {
      const sway = calm ? 0 : Math.sin(t * 1.6 + seed) * .7
      c.setAttribute('transform', `translate(${f(hair.x * w + sway * w)} ${f(hair.y * w + (calm ? 0 : Math.cos(t * 1.3 + seed) * .5 * w))})`)
    })
    el.hairBack.setAttribute('transform', `translate(${f(hair.x * .5)} ${f(hair.y * .5)})`)

    // --- eyes ---
    const b = clamp(s.eye.blink, 0, 1)
    const eyeScale = Math.max(.06, 1 - b * .94) * (1 - s.eye.squint * .38)
    const eyeShift = s.eye.squint * 2.2
    const eyeT = (cx: number, mir: boolean) =>
      `translate(${cx} ${f(112 + eyeShift)}) scale(${mir ? -1.13 : 1.13} 1.13) translate(0 -9) scale(1 ${f(eyeScale)}) translate(0 9)`
    el.eyeL.setAttribute('transform', eyeT(136, true))
    el.eyeR.setAttribute('transform', eyeT(184, false))
    const ix = s.look.x * 4.6
    const iy = s.look.y * 3.1
    el.irisL.setAttribute('transform', `translate(${f(-ix)} ${f(iy)})`)
    el.irisR.setAttribute('transform', `translate(${f(ix)} ${f(iy)})`)
    el.browL.setAttribute('transform', `translate(136 ${f(89 + s.brow.ly)}) scale(-1 1) rotate(${f(s.brow.lt)})`)
    el.browR.setAttribute('transform', `translate(184 ${f(89 + s.brow.ry)}) rotate(${f(s.brow.rt)})`)
    el.blushL.setAttribute('opacity', f(s.blush))
    el.blushR.setAttribute('opacity', f(s.blush))

    // --- mouth ---
    const m = mouthPath(160, 150, mouthOpen, s.mouth.smile, s.mouth.wide)
    el.mouthTop.setAttribute('d', m.top)
    el.mouthFill.setAttribute('d', m.fill)
    el.mouthClip.setAttribute('d', m.fill)
    el.mouthFill.setAttribute('opacity', mouthOpen > .04 ? '1' : '0')
    el.tongue.setAttribute('cy', f(150 + 4 + mouthOpen * 6))

    // --- arms ---
    renderArm('L', t, dt)
    renderArm('R', t, dt)
  }

  const tick = (time: number, deltaTime: number) => {
    const dt = Math.min(deltaTime / 1000, .05)
    render(time, dt)
  }
  gsap.ticker.add(tick)
  render(0, .016)

  /* ---------- public API ---------- */
  function armTween(side: Side, vars: Partial<Arm>, dur = .6, ease = 'power3.inOut') {
    const t = gsap.to(s.arms[side], { ...vars, duration: dur, ease, overwrite: 'auto' })
    calls.push(t)
    return t
  }
  function poseArm(side: Side, pose: Partial<Arm>, dur: number, ease?: string) {
    armTween(side, { follow: 1, off: 0, fs: 1, wave: 0, poke: 0, pointW: 0, ...pose }, dur, ease)
  }
  function rest(side: Side, dur = .7) {
    const r = restArm(side)
    poseArm(side, { ...r }, dur, 'power2.inOut')
  }

  const rig: Rig = {
    gesture(g, opts = {}) {
      currentGesture = g
      pointing.side = null
      pointing.target = null
      lookOverride = null
      const d = reduced.matches ? .01 : 1
      if (g === 'rest') {
        rest('L', .7 * d); rest('R', .7 * d)
        return
      }
      const side: Side = opts.side ?? 'R'
      const other: Side = side === 'R' ? 'L' : 'R'
      const k = side === 'R' ? 1 : -1
      const S = SHOULDER[side]
      freeSide = other
      if (g === 'wave' || g === 'bye') {
        rest(other, .6 * d)
        poseArm(side, { x: S.x + 58 * k, y: S.y - 74, ...HAND.open, wave: 0 }, .62 * d, 'back.out(1.25)')
        gsap.to(s.arms[side], { wave: 1, duration: .35, delay: .5 * d, ease: 'power2.out' })
        gsap.to(s.arms[side], { wave: 0, duration: .5, delay: (g === 'bye' ? 3.6 : 2.7) * d, ease: 'power2.inOut', onComplete: () => rest(side, .9) })
        if (g === 'bye') {
          gsap.to(s.eye, { squint: 1, duration: .35, delay: .4 })
          gsap.to(s.eye, { squint: 0, duration: .5, delay: 3.8 })
        }
        return
      }
      if (g === 'point') {
        rest(other, .6 * d)
        pointing.side = side
        pointing.target = opts.target ?? null
        poseArm(side, { x: S.x + k * 34, y: S.y - 14, ...HAND.point, pointW: 0 }, .35 * d, 'power2.out')
        gsap.to(s.arms[side], { pointW: 1, duration: .6 * d, delay: .12 * d, ease: 'back.out(1.3)' })
        gsap.to(s.arms[side], { poke: 1, duration: .5, delay: 1.2 })
        return
      }
      if (g === 'think') {
        rest(other, .6 * d)
        poseArm(side, { x: S.x - 14 * k, y: S.y - 28, ...HAND.think, fs: .9, follow: 0, abs: side === 'R' ? -92 : -88 }, .75 * d, 'power3.inOut')
        lookOverride = { x: .55 * k, y: -.75 }
        gsap.to(s.brow, { ly: -6, ry: 2, lt: 0, rt: 3, duration: .4 })
        return
      }
      if (g === 'thumbs') {
        rest(other, .6 * d)
        poseArm(side, { x: S.x + 42 * k, y: S.y - 44, ...HAND.thumbs, follow: 0, abs: side === 'R' ? -90 : -90 }, .6 * d, 'back.out(1.4)')
      }
    },
    mood(m, dur = .45) {
      const to = (o: object) => { gsap.to(s.mouth, { ...o, duration: dur, overwrite: 'auto' }) }
      const tb = (o: object) => { gsap.to(s.brow, { ...o, duration: dur, overwrite: 'auto' }) }
      if (m === 'calm') { to({ smile: .45, open: 0 }); tb({ ly: 0, ry: 0, lt: 0, rt: 0 }); gsap.to(s, { blush: .22, duration: dur }); gsap.to(s.eye, { squint: 0, duration: dur }) }
      if (m === 'happy') { to({ smile: 1, open: .08 }); tb({ ly: -3, ry: -3, lt: -2, rt: -2 }); gsap.to(s, { blush: .5, duration: dur }); gsap.to(s.eye, { squint: .3, duration: dur }) }
      if (m === 'curious') { to({ smile: .2, open: 0 }); tb({ ly: -6, ry: 1, lt: 0, rt: 4 }); gsap.to(s, { blush: .2, duration: dur }); gsap.to(s.eye, { squint: 0, duration: dur }) }
      if (m === 'surprised') { to({ smile: .1, open: .55 }); tb({ ly: -9, ry: -9, lt: 5, rt: 5 }); gsap.to(s.eye, { squint: 0, duration: dur }) }
      if (m === 'proud') { to({ smile: .8, open: 0 }); tb({ ly: -1, ry: -1, lt: -4, rt: -4 }); gsap.to(s, { blush: .38, duration: dur }); gsap.to(s.eye, { squint: .15, duration: dur }) }
    },
    talk(on) { talking = on },
    setAttention(fn) { attention = fn },
    setLook(v) { lookOverride = v },
    setVelocity(vx, vy) { vel = { x: vx, y: vy } },
    hop() {
      if (reduced.matches) return
      const tl = gsap.timeline()
      tl.to(s.body, { y: -16, duration: .2, ease: 'power2.out' }).to(s.body, { y: 0, duration: .45, ease: 'bounce.out' })
    },
    react() {
      if (reduced.matches) return
      rig.hop()
      rig.mood('surprised', .12)
      gsap.delayedCall(.55, () => rig.mood('happy', .3))
      if (currentGesture === 'rest') {
        rig.gesture('wave')
        gsap.delayedCall(2.4, () => { if (currentGesture === 'wave') rig.gesture('rest') })
      }
    },
    destroy() {
      destroyed = true
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onPointer)
      gsap.killTweensOf([s.head, s.look, s.brow, s.eye, s.mouth, s.body, s.cloud, s.arms.L, s.arms.R, glance, s])
      calls.forEach(c => c.kill())
    },
  }
  return rig
}
