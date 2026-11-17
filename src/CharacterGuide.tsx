import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowDown, Mail, MessageCircle, Minus, RotateCcw } from 'lucide-react'
import { Character } from './Character'
import { ThreeCharacter } from './ThreeCharacter'
import { VideoCharacter } from './VideoCharacter'
import { GUIDE_RENDERER } from './guideConfig'
import type { GuideRenderer } from './guideConfig'
import type { Gesture, Mood, Rig } from './Character'

type Edge = 'bottom' | 'left' | 'right'
type Spot = 'br' | 'bl' | 'mr' | 'ml'
interface Stop {
  anchor: string // id of the element that marks this stop: it is "here" once that element reaches the middle of the screen
  gesture: Gesture; mood: Mood; message: string; action: string; href: string; target?: string
  spot: Spot // where the SVG version (cloud) sits
  peek: { edge: Edge; at: number; sink?: number } // where the 3D version peeks in; `at` is the position along that edge (0..1); `sink` lowers a bottom peek (box heights)
}

// One stop per place worth a comment, in page order. Consecutive stops on the same edge slide along it
// instead of leaving and coming back, so the guide seems to follow the reader down the page.
const stops: Stop[] = [
  { anchor: 'inicio', gesture: 'wave', mood: 'happy', message: 'Hola, soy Andrés. Te enseño en qué he trabajado.', action: 'Mi experiencia', href: '#experiencia', spot: 'br', peek: { edge: 'bottom', at: .5, sink: .3 } },
  { anchor: 'upango', gesture: 'think', mood: 'curious', message: 'En Upango hago tiendas y apps sobre Shopify para clientes.', action: 'Ver mi puesto', href: '#upango', spot: 'mr', peek: { edge: 'right', at: .5 } },
  { anchor: 'rendimiento', gesture: 'point', mood: 'proud', message: 'Aquí tienes dos mejoras que aceleraron tareas del día a día.', action: 'Ver el rendimiento', href: '#rendimiento', spot: 'mr', target: '#rendimiento', peek: { edge: 'right', at: .58 } },
  { anchor: 'freelance', gesture: 'wave', mood: 'happy', message: 'Y por mi cuenta, webs y tiendas para negocios reales.', action: 'Ver freelance', href: '#freelance', spot: 'mr', peek: { edge: 'right', at: .5 } },
  { anchor: 'la-cosa-nostra', gesture: 'point', mood: 'proud', message: 'Una pizzería que sigue vendiendo cuando se satura el teléfono.', action: 'La Cosa Nostra', href: '#la-cosa-nostra', spot: 'mr', target: '#la-cosa-nostra', peek: { edge: 'right', at: .52 } },
  { anchor: 'regalos', gesture: 'thumbs', mood: 'happy', message: 'Una tienda desde cero, con stock y pagos con Redsys.', action: 'Regalos Ana Fátima', href: '#regalos', spot: 'ml', peek: { edge: 'left', at: .55 } },
  { anchor: 'rey-del-mueble', gesture: 'point', mood: 'proud', message: 'Conecté el catálogo de Shopify con las APIs de proveedores.', action: 'El Rey del Mueble', href: '#rey-del-mueble', spot: 'mr', target: '#rey-del-mueble', peek: { edge: 'right', at: .55 } },
  { anchor: 'lostinswiss', gesture: 'wave', mood: 'happy', message: 'Rediseñé SwissUp y las ventas subieron.', action: 'Lostinswiss', href: '#lostinswiss', spot: 'ml', peek: { edge: 'left', at: .55 } },
  { anchor: 'capitales', gesture: 'think', mood: 'curious', message: 'Lo hice para jugar en la oficina: más de diez a la vez.', action: 'The World Capitals', href: '#capitales', spot: 'mr', peek: { edge: 'right', at: .55 } },
  { anchor: 'odins', gesture: 'point', mood: 'proud', message: 'De una foto de un cultivo a una sugerencia de tratamiento.', action: 'OdinS', href: '#odins', spot: 'ml', target: '#odins', peek: { edge: 'left', at: .52 } },
  { anchor: 'clientes', gesture: 'wave', mood: 'happy', message: 'Y más webs para clientes: un club de MMA y una academia de danza.', action: 'Ver más webs', href: '#clientes', spot: 'bl', peek: { edge: 'bottom', at: .5 } },
  { anchor: 'laboratorio', gesture: 'think', mood: 'curious', message: 'Estos los hice por mi cuenta. Puedes deslizarlos.', action: 'Proyectos propios', href: '#laboratorio', spot: 'ml', peek: { edge: 'bottom', at: .5 } },
  { anchor: 'formacion', gesture: 'thumbs', mood: 'proud', message: 'Ingeniería Informática en Murcia, inglés C1 y este stack.', action: 'Formación y tecnologías', href: '#formacion', spot: 'mr', peek: { edge: 'right', at: .55 } },
  { anchor: 'contacto', gesture: 'bye', mood: 'happy', message: 'Gracias por pasarte. Si te encaja, escríbeme.', action: 'Escribirme', href: 'mailto:andresml9602@gmail.com', spot: 'br', peek: { edge: 'bottom', at: .6 } },
]

// SVG version: where things sit inside the character's box (fractions of its width / height).
const CLOUD_L = .1955
const CLOUD_R = .8227
const CLOUD_BOTTOM = .96

// 3D version: the box is 5 x 4.545 world units; these are where the screen edge cuts the character (see threeRig.ts).
const PEEK_BOTTOM_Y = .649 // fraction of the box height at which the viewport's bottom edge crosses the character
const PEEK_SIDE_X = .52 // fraction of the box width at which the viewport's side edge crosses
const PEEK_HEAD_Y = .427 // head centre of a sideways peek, as a fraction of the box height

// Video version: the clip layer is VIDEO_H box-heights tall, its bottom on the line where the viewport cuts a
// bottom peek, so the clip's own waist cut sits on the screen edge (see .guide-video in style.css).
const VIDEO_H = 1.05
const VIDEO_HEAD_TOP = .06 // head top as a fraction of the clip height
const VIDEO_HEAD_MID = .186 // head centre as a fraction of the clip height
const VIDEO_TILT = 14 * Math.PI / 180 // lean when peeking from a side (matches VideoCharacter)

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

interface Layout {
  x: number; y: number // resting position
  from: { x: number; y: number } // hidden position it slides in from / out to
  hx: number; hy: number // head centre (x) and head top (y) as fractions of the box
  edge: Edge | null
}

export function CharacterGuide() {
  const root = useRef<HTMLElement>(null)
  const fx = useRef<HTMLDivElement>(null)
  const typed = useRef<HTMLSpanElement>(null)
  const rigRef = useRef<Rig | null>(null)
  const [shown, setShown] = useState(0)
  const [active, setActive] = useState(0) // the stop the page position points at
  const [sync, setSync] = useState(0) // bumped when a move ends, so the placement is re-checked against the page position
  const [open, setOpen] = useState(false) // bubble visible
  const [away, setAway] = useState(true) // character is off screen
  const [started, setStarted] = useState(false)
  const [renderer, setRenderer] = useState<GuideRenderer>(GUIDE_RENDERER)
  const fallBack = useCallback(() => setRenderer('svg'), [])
  const live = useRef({ active: 0, minimized: false, hovered: false, token: 0, here: false, shown: 0, placed: 0, acted: -1 })
  const openRef = useRef(false)
  openRef.current = open
  const rendererRef = useRef(renderer)
  rendererRef.current = renderer
  const size = useRef({ w: 300, h: 273 })
  const layout = useRef<Layout | null>(null)
  const tweens = useRef<{ type?: gsap.core.Tween; nap?: gsap.core.Tween; move?: gsap.core.Tween | gsap.core.Timeline }>({})
  const reduced = useRef(false)
  const lastPuff = useRef(0)
  const lastPos = useRef({ x: 0, y: 0 })
  const visited = useRef(new Set<number>()) // stops it has already commented on: it does not repeat itself
  const lastScroll = useRef(0) // when the page last moved: the guide waits for the reader to settle

  const setRig = useCallback((rig: Rig | null) => { rigRef.current = rig }, [])
  const isPeek = useCallback(() => (rigRef.current ? !!rigRef.current.peek : rendererRef.current !== 'svg'), [])

  /* ---- geometry ---- */
  const measure = useCallback(() => {
    const vw = window.innerWidth
    const peek = isPeek()
    const phone = rendererRef.current === 'video' ? .72 : .8 // the clip is taller than the 3D figure: keep it from covering the page
    const w = vw < 700 ? clamp(vw * (peek ? phone : .64), 220, peek ? 340 : 290) : clamp(vw * (peek ? .3 : .27), peek ? 320 : 270, peek ? 420 : 372)
    const h = w * 400 / 440
    size.current = { w, h }
    const el = root.current
    if (el) {
      el.style.setProperty('--gw', `${w}px`)
      el.style.setProperty('--gh', `${h}px`)
    }
  }, [isPeek])

  const layoutFor = useCallback((st: Stop): Layout => {
    const { w, h } = size.current
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (!isPeek()) {
      const edge = clamp(vw * .02, 10, 26)
      const right = st.spot.endsWith('r')
      const mid = st.spot.startsWith('m') && vw >= 700
      const x = right ? vw - CLOUD_R * w - edge : edge - CLOUD_L * w
      const y = mid ? (vh - h) / 2 + h * .06 : vh - CLOUD_BOTTOM * h - edge * .8
      return { x, y, from: { x: right ? vw - CLOUD_L * w + 50 : -CLOUD_R * w - 60, y: y - 130 }, hx: .5, hy: .09, edge: null }
    }
    let { edge, at } = st.peek
    if (vw < 700 && edge !== 'bottom') { at = edge === 'left' ? .25 : .75; edge = 'bottom' }
    if (rendererRef.current === 'video') {
      const V = VIDEO_H * h
      const headTop = PEEK_BOTTOM_Y - (1 - VIDEO_HEAD_TOP) * VIDEO_H // head top relative to the box, in box heights
      if (edge === 'bottom') {
        const x = clamp(at * vw - .5 * w, -.2 * w, vw - .8 * w)
        const y = vh - PEEK_BOTTOM_Y * h + (st.peek.sink ?? 0) * h
        return { x, y, from: { x, y: vh - headTop * h + 20 }, hx: .5, hy: headTop, edge }
      }
      // leaning in around the clip's bottom centre (box: .5w, PEEK_BOTTOM_Y h)
      const reach = (1 - VIDEO_HEAD_MID) * V
      const dx = reach * Math.sin(VIDEO_TILT) // head centre's horizontal offset from the pivot
      const pivotY = clamp(at * vh, 120, vh - 140) + reach * Math.cos(VIDEO_TILT)
      const y = pivotY - PEEK_BOTTOM_Y * h
      const topY = PEEK_BOTTOM_Y - (1 - VIDEO_HEAD_TOP) * VIDEO_H * Math.cos(VIDEO_TILT)
      if (edge === 'right') {
        const x = vw - .3 * w + dx - .5 * w
        return { x, y, from: { x: x + .8 * w, y }, hx: (.5 * w - dx) / w, hy: topY, edge }
      }
      const x = .3 * w - dx - .5 * w
      return { x, y, from: { x: x - .8 * w, y }, hx: (.5 * w + dx) / w, hy: topY, edge }
    }
    if (edge === 'bottom') {
      const x = clamp(at * vw - .5 * w, -.1 * w, vw - .9 * w)
      const y = vh - PEEK_BOTTOM_Y * h
      return { x, y, from: { x, y: y + .62 * h }, hx: .5, hy: .09, edge }
    }
    const y = clamp(at * vh - PEEK_HEAD_Y * h, 70 - PEEK_HEAD_Y * h, vh - .6 * h)
    if (edge === 'right') {
      const x = vw - PEEK_SIDE_X * w
      return { x, y, from: { x: x + .55 * w, y }, hx: .18, hy: .27, edge }
    }
    const x = -(1 - PEEK_SIDE_X) * w
    return { x, y, from: { x: x - .55 * w, y }, hx: .82, hy: .27, edge }
  }, [isPeek])

  const placeBubble = useCallback((l: Layout) => {
    const el = root.current
    if (!el) return
    const { w } = size.current
    const bw = Math.min(238, window.innerWidth - 24)
    const headScreen = l.x + l.hx * w
    const left = clamp(headScreen - bw / 2, 12, window.innerWidth - bw - 12)
    el.style.setProperty('--bw', `${bw}px`)
    el.style.setProperty('--bl', `${left - l.x}px`)
    el.style.setProperty('--hy', String(l.hy))
    el.style.setProperty('--tail', `${clamp(headScreen - left - 6, 18, bw - 30)}px`)
  }, [])

  /* ---- puffs (SVG version only) ---- */
  const puff = useCallback((cx: number, cy: number, size0: number, dx: number, dy: number, life: number) => {
    const layer = fx.current
    if (!layer || reduced.current || layer.childElementCount > 46) return
    const d = document.createElement('i')
    d.className = 'guide-puff'
    d.style.width = d.style.height = `${size0}px`
    layer.appendChild(d)
    gsap.fromTo(d,
      { x: cx - size0 / 2, y: cy - size0 / 2, scale: .35, opacity: .95, rotation: Math.random() * 60 },
      { x: cx - size0 / 2 + dx, y: cy - size0 / 2 + dy, scale: 1.35 + Math.random() * .4, opacity: 0, duration: life, ease: 'power2.out', onComplete: () => d.remove() })
  }, [])

  const burst = useCallback((count: number, spread = 1) => {
    const el = root.current
    if (!el || isPeek()) return
    const { w, h } = size.current
    const x = Number(gsap.getProperty(el, 'x'))
    const y = Number(gsap.getProperty(el, 'y'))
    const cx = x + .509 * w
    const cy = y + .84 * h
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * .5
      const r = (60 + Math.random() * 50) * spread * (w / 330)
      puff(cx + Math.cos(a) * 30, cy + Math.sin(a) * 12, 34 + Math.random() * 30, Math.cos(a) * r, Math.sin(a) * r * .55 - 8, .8 + Math.random() * .4)
    }
  }, [puff, isPeek])

  /* ---- speech ---- */
  // `quick` is for a change that follows the scroll: it types fast and starts at once, and a newer one replaces it
  const say = useCallback((text: string, quick = false) => {
    const node = typed.current
    tweens.current.type?.kill()
    if (!node) return
    if (reduced.current) { node.textContent = text; return }
    if (node.textContent === text) { rigRef.current?.talk(false); return }
    const o = { n: 0 }
    node.textContent = ''
    rigRef.current?.talk(true)
    tweens.current.type = gsap.to(o, {
      n: text.length, duration: text.length / (quick ? 110 : 40), ease: 'none', delay: quick ? 0 : .25,
      onUpdate: () => { node.textContent = text.slice(0, Math.round(o.n)) },
      onComplete: () => { rigRef.current?.talk(false) },
    })
  }, [])

  // the bubble text always follows the page position, even while the character is busy or waiting
  const follow = useCallback(() => {
    const l = live.current
    if (!l.here || l.minimized || l.shown === l.active) return
    l.shown = l.active
    setShown(l.active)
    say(stops[l.active].message, true)
  }, [say])

  const targetPoint = useCallback((selector: string) => () => {
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      x: clamp(r.left + r.width / 2, 30, window.innerWidth - 30),
      y: clamp(r.top + Math.min(r.height / 2, 130), 40, window.innerHeight - 40),
    }
  }, [])

  const present = useCallback((index: number, speak = true, gesture = true) => {
    const rig = rigRef.current
    const el = root.current
    const l = layout.current
    const st = stops[index]
    if (!rig || !el || !l) return
    rig.mood(st.mood)
    if (gesture) {
      live.current.acted = index
      const headX = Number(gsap.getProperty(el, 'x')) + l.hx * size.current.w
      // the free arm is the one on the side of the screen's centre
      const toward: 'L' | 'R' = headX > window.innerWidth / 2 ? 'L' : 'R'
      if (st.gesture === 'point' && st.target) {
        const getter = targetPoint(st.target)
        const tp = getter()
        rig.gesture('point', { target: getter, side: tp && tp.x < headX ? 'L' : 'R' })
        rig.setAttention(getter)
      } else {
        rig.setAttention(null)
        rig.gesture(st.gesture, { side: toward })
      }
    }
    if (speak) say(st.message)
  }, [say, targetPoint])

  // the clip for the comment on screen: played shortly after the text changed, so not for every stop flashed past
  const act = useCallback((index: number) => {
    const l = live.current
    if (!l.here || l.minimized || !openRef.current || l.acted === index) return
    present(index, false, true)
  }, [present])

  /* ---- entrances and exits ---- */
  const leave = useCallback(() => new Promise<void>(resolve => {
    const el = root.current
    const rig = rigRef.current
    const l = layout.current
    if (!el || !l) return resolve()
    tweens.current.type?.kill()
    rig?.talk(false)
    rig?.setAttention(null)
    rig?.gesture('rest')
    if (reduced.current) {
      tweens.current.move = gsap.to(el, { opacity: 0, duration: .25, onComplete: () => resolve() })
      return
    }
    const tl = gsap.timeline({ onComplete: () => resolve() })
    if (l.edge) {
      // a small step back into the screen, then out behind the edge
      const x = Number(gsap.getProperty(el, 'x'))
      const y = Number(gsap.getProperty(el, 'y'))
      const back = l.edge === 'bottom' ? { x, y: y - 14 } : { x: x + (l.edge === 'left' ? 14 : -14), y }
      tl.add(() => { rig?.mood('surprised', .1) })
        .to(el, { ...back, duration: .14, ease: 'power2.out' })
        .to(el, { x: l.from.x, y: l.from.y, duration: .42, ease: 'power3.in' })
    } else {
      const x = Number(gsap.getProperty(el, 'x'))
      const y = Number(gsap.getProperty(el, 'y'))
      const right = l.x > window.innerWidth / 2
      tl.add(() => { rig?.mood('surprised', .1); burst(7, .8) })
        .to(el, { x: x + (right ? 26 : -26), y: y + 10, duration: .22, ease: 'power2.out' })
        .add(() => { rig?.mood('happy', .2) })
        .to(el, { x: l.from.x, duration: .78, ease: 'power3.in' }, '>')
        .to(el, { y: y - 120, duration: .78, ease: 'power2.in' }, '<')
    }
    tweens.current.move = tl
  }), [burst])

  const arrive = useCallback((st: Stop) => new Promise<void>(resolve => {
    const el = root.current
    if (!el) return resolve()
    measure()
    const l = layoutFor(st)
    layout.current = l
    placeBubble(l)
    el.dataset.edge = l.edge ?? 'none'
    rigRef.current?.peek?.(l.edge ?? 'bottom')
    if (!l.edge) rigRef.current?.gesture('rest')
    if (reduced.current) {
      gsap.set(el, { x: l.x, y: l.y, opacity: 0 })
      tweens.current.move = gsap.to(el, { opacity: 1, duration: .3, onComplete: () => resolve() })
      return
    }
    gsap.set(el, { opacity: 1, x: l.from.x, y: l.from.y })
    const tl = gsap.timeline({ onComplete: () => resolve() })
    if (l.edge) {
      tl.to(el, { x: l.x, y: l.y, duration: .75, ease: 'back.out(1.2)' }, 0)
    } else {
      tl.to(el, { x: l.x, duration: 1.15, ease: 'power3.out' }, 0)
        .to(el, { y: l.y, duration: 1.15, ease: 'sine.out' }, 0)
        .add(() => { burst(6, .7); rigRef.current?.hop() }, 1.0)
    }
    tweens.current.move = tl
  }), [burst, layoutFor, measure, placeBubble])

  const scheduleNap = useCallback(() => {
    tweens.current.nap?.kill()
    tweens.current.nap = gsap.delayedCall(9, function nap() {
      const l = live.current
      if (!l.here) return
      const el = root.current
      if (l.hovered || el?.contains(document.activeElement)) { tweens.current.nap = gsap.delayedCall(6, nap); return }
      void sleep()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sleep = useCallback(async () => {
    const l = live.current
    const token = ++l.token
    setOpen(false)
    await leave()
    if (token !== l.token) return
    l.here = false
    setAway(true)
    if (typed.current) typed.current.textContent = ''
  }, [leave])

  const go = useCallback(async (index: number) => {
    const l = live.current
    const token = ++l.token
    l.acted = -1
    tweens.current.nap?.kill()
    setOpen(false)
    if (l.here) {
      await leave()
      if (token !== l.token) return
    }
    l.here = true
    l.shown = index
    l.placed = index
    visited.current.add(index)
    setShown(index)
    setAway(false)
    setStarted(true)
    await new Promise(r => requestAnimationFrame(r))
    await arrive(stops[index])
    if (token !== l.token) return
    setOpen(true)
    present(index)
    scheduleNap()
    follow()
    setSync(v => v + 1)
  }, [arrive, leave, present, scheduleNap, follow])

  // already on screen and the next stop is on the same edge: slide along it and change the text
  const shift = useCallback(async (index: number) => {
    const el = root.current
    const l = live.current
    if (!el) return
    const token = ++l.token
    tweens.current.nap?.kill()
    const next = layoutFor(stops[index])
    layout.current = next
    l.shown = index
    l.placed = index
    visited.current.add(index)
    setShown(index)
    if (reduced.current) gsap.set(el, { x: next.x, y: next.y })
    else await new Promise<void>(resolve => { tweens.current.move = gsap.to(el, { x: next.x, y: next.y, duration: .7, ease: 'power3.inOut', onComplete: () => resolve() }) })
    if (token !== l.token) return
    placeBubble(next)
    setOpen(true)
    present(index, true, l.acted !== index)
    scheduleNap()
    follow()
    setSync(v => v + 1)
  }, [layoutFor, placeBubble, present, scheduleNap, follow])

  /* ---- lifecycle ---- */
  useLayoutEffect(() => {
    measure()
    if (root.current) gsap.set(root.current, { x: -2000, y: 0, opacity: 0 })
  }, [measure])

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduced.current = media.matches }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // keep the rig informed about how fast the box is moving (hair and lean) and, for the cloud, lay a trail of puffs
  useEffect(() => {
    const tick = (_: number, deltaTime: number) => {
      const el = root.current
      const rig = rigRef.current
      if (!el || !rig) return
      const dt = Math.max(deltaTime / 1000, .001)
      const x = Number(gsap.getProperty(el, 'x'))
      const y = Number(gsap.getProperty(el, 'y'))
      const vx = (x - lastPos.current.x) / dt
      const vy = (y - lastPos.current.y) / dt
      lastPos.current = { x, y }
      if (Math.abs(vx) > 6000 || Math.abs(vy) > 6000) return
      rig.setVelocity(vx, vy)
      const speed = Math.hypot(vx, vy)
      const now = gsap.ticker.time
      if (!rig.peek && speed > 520 && now - lastPuff.current > .04 && !reduced.current) {
        lastPuff.current = now
        const { w, h } = size.current
        const k = speed > 0 ? 1 / speed : 0
        puff(x + .509 * w - vx * k * w * .2, y + .86 * h - vy * k * w * .1, 26 + Math.random() * 26,
          -vx * k * 36, -vy * k * 20 + 10, .6 + Math.random() * .3)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [puff])

  // which stop the page position points at
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const marker = window.innerHeight * .5
      let current = 0
      stops.forEach((stop, index) => {
        const top = document.getElementById(stop.anchor)?.getBoundingClientRect().top
        if (top !== undefined && top <= marker) current = index
      })
      if (window.scrollY > 0 && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = stops.length - 1
      setActive(current)
    }
    const schedule = () => {
      lastScroll.current = performance.now()
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // the bubble follows the page position at once (no waiting for the scroll to stop); the clip follows shortly after
  useEffect(() => {
    const l = live.current
    l.active = active
    if (!l.here || l.minimized || !openRef.current) return
    follow()
    scheduleNap()
    const id = window.setTimeout(() => act(active), 400)
    return () => window.clearTimeout(id)
  }, [active, follow, scheduleNap, act])

  useEffect(() => {
    live.current.active = active
    if (live.current.minimized) return
    const first = !live.current.here && live.current.token === 0
    const since = performance.now()
    let id = 0
    // act only once the scroll has stopped (or the reader has stayed here a while), so fast scrolling never
    // makes it pop in and straight out again; the current one stays put until then
    const settle = () => {
      const l = live.current
      if (l.minimized || (l.here && l.placed === active)) return
      // a stop it has already commented on: tuck away instead of repeating the whole show
      if (visited.current.has(active) && !l.here) return
      const waited = performance.now() - since
      const idle = performance.now() - lastScroll.current
      const sameEdge = !!(l.here && layout.current?.edge && layoutFor(stops[active]).edge === layout.current.edge)
      const ready = sameEdge ? waited >= 350 && idle >= 300 : waited >= (first ? 1100 : 650) && (idle >= 500 || waited >= 2600)
      if (ready) {
        void (sameEdge ? shift(active) : go(active))
        return
      }
      id = window.setTimeout(settle, 120)
    }
    id = window.setTimeout(settle, first ? 1100 : 650)
    return () => window.clearTimeout(id)
  }, [active, sync, go, shift, layoutFor])

  useEffect(() => {
    const onResize = () => {
      measure()
      const l = live.current
      const el = root.current
      if (!el || !l.here) return
      const next = layoutFor(stops[l.placed])
      layout.current = next
      gsap.set(el, { x: next.x, y: next.y })
      placeBubble(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [layoutFor, measure, placeBubble])

  useEffect(() => () => {
    tweens.current.type?.kill()
    tweens.current.nap?.kill()
    tweens.current.move?.kill()
  }, [])

  // debugging hook for development only
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __guide: unknown }).__guide = { go, shift, rig: () => rigRef.current, sleep, stops: stops.length }
  }, [go, shift, sleep])

  const stop = stops[shown] ?? stops[0]
  const ActionIcon = stop.href.startsWith('mailto:') ? Mail : ArrowDown

  return (
    <>
      <div className="guide-fx" ref={fx} aria-hidden="true" />
      <aside ref={root} className="character-guide" data-open={open} data-away={away} aria-label="Guía del portfolio"
        onPointerEnter={() => { live.current.hovered = true }}
        onPointerLeave={() => { live.current.hovered = false }}>
        <div className="guide-note" inert={!open} aria-hidden={!open}>
          <p className="guide-text">
            <span className="sr-only">{stop.message}</span>
            <span ref={typed} aria-hidden="true" />
          </p>
          <div className="guide-foot">
            <a href={stop.href} onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !stop.href.startsWith('#')) return
              const destination = document.getElementById(stop.href.slice(1))
              if (!destination) return
              destination.tabIndex = -1
              destination.focus({ preventScroll: true })
            }}>{stop.action} <ActionIcon size={13} aria-hidden="true" /></a>
            <div className="guide-controls">
              <button type="button" className="guide-replay" onClick={() => { rigRef.current?.hop(); present(shown); scheduleNap() }}
                aria-label="Repetir gesto del personaje" title="Repetir gesto"><RotateCcw size={13} /></button>
              <button type="button" onClick={() => {
                live.current.minimized = true
                void sleep()
              }} aria-label="Recoger la guía" title="Recoger la guía"><Minus size={15} /></button>
            </div>
          </div>
        </div>
        <div className="guide-stage" aria-hidden="true">
          {renderer === 'video'
            ? <VideoCharacter onRig={setRig} />
            : renderer === 'three'
              ? <ThreeCharacter onRig={setRig} onFail={fallBack} />
              : <Character onRig={setRig} />}
          <div className="guide-hit" onClick={() => { rigRef.current?.react(); scheduleNap() }} />
        </div>
      </aside>
      <button type="button" className="guide-trigger" hidden={!away || !started}
        onClick={() => {
          live.current.minimized = false
          void go(live.current.active)
        }} aria-label="Abrir la guía del portfolio" title="Abrir la guía">
        <MessageCircle size={19} aria-hidden="true" />
      </button>
    </>
  )
}
