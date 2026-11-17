import * as THREE from 'three'
import gsap from 'gsap'
import type { Gesture, Mood, Pt, Rig } from './characterRig'

type Side = 'L' | 'R'

/* ------------------------------------------------------------------ *
 *  Framing. The canvas has the same 440:400 box as the SVG version, so *
 *  the director can place either renderer with the same constants.     *
 * ------------------------------------------------------------------ */
const FW = 5
const FH = 4.545
const FTOP = 2.0
const FLEFT = -2.5

const SKIN = '#dfb99c'
const HAIR = '#2b1e17'
const CURL_COLORS = ['#33261e', '#2b2019', '#3a2b22', '#2e231c']
const SHIRT = '#eef1f8'

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)
const smooth = (t: number) => t * t * (3 - 2 * t)
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

/* ------------------------------------------------------------------ *
 *  Materials: 3-band toon shading plus an inverted-hull outline.        *
 * ------------------------------------------------------------------ */
function makeToon() {
  const gradient = new THREE.DataTexture(new Uint8Array([128, 196, 255]), 3, 1, THREE.RedFormat)
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter
  gradient.needsUpdate = true
  const strong = new THREE.DataTexture(new Uint8Array([68, 150, 255]), 3, 1, THREE.RedFormat)
  strong.minFilter = strong.magFilter = THREE.NearestFilter
  strong.needsUpdate = true
  const cache = new Map<string, THREE.MeshToonMaterial>()
  const toon = (color: string, contrast = false) => {
    const key = color + (contrast ? '!' : '')
    let m = cache.get(key)
    if (!m) { m = new THREE.MeshToonMaterial({ color, gradientMap: contrast ? strong : gradient }); cache.set(key, m) }
    return m
  }
  const outline = (color: string, thick: number) => new THREE.ShaderMaterial({
    uniforms: { uThick: { value: thick }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `uniform float uThick;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        clip.xy += n.xy * uThick * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: 'uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }',
    side: THREE.BackSide,
  })
  const dispose = () => { gradient.dispose(); strong.dispose(); cache.forEach(m => m.dispose()) }
  return { toon, outline, dispose }
}

/* ------------------------------------------------------------------ *
 *  Head geometry: a sphere with a tapered jaw.                          *
 * ------------------------------------------------------------------ */
const HR = .45
type Keys = [number, number][]
function prof(x: number, keys: Keys) {
  if (x <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) { const [x0, y0] = keys[i - 1]; const [x1, y1] = keys[i]; return lerp(y0, y1, smooth((x - x0) / (x1 - x0))) }
  }
  return keys[keys.length - 1][1]
}
// horizontal / depth scale per height (-1 = chin, 1 = crown). A male jaw: wide cheekbones, a clear jaw angle, a flat-ish chin.
const HEAD_W: Keys = [[-1, .66], [-.9, .74], [-.78, .84], [-.66, .99], [-.57, 1.1], [-.44, 1.07], [-.2, 1.01], [.1, 1.0], [.4, 1.0], [.75, .95], [1, .9]]
const HEAD_D: Keys = [[-1, 1.14], [-.85, 1.12], [-.6, 1.05], [-.3, 1.0], [0, 1], [.4, .96], [1, .86]]
function shapeHead(p: THREE.Vector3) {
  const yn = clamp(p.y / HR, -1, 1)
  p.x *= prof(yn, HEAD_W)
  p.z *= prof(yn, HEAD_D)
  if (p.y < 0) p.y *= 1 + .48 * Math.pow(Math.min(1, -p.y / HR), .8)
  p.y = Math.max(p.y, -HR * 1.2)
  return p
}
const spherePt = (r: number, a: number, th: number) => new THREE.Vector3(r * Math.sin(th) * Math.sin(a), r * Math.cos(th), r * Math.sin(th) * Math.cos(a))

function headGeometry() {
  const g = new THREE.SphereGeometry(HR, 40, 30)
  const pos = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); shapeHead(v); pos.setXYZ(i, v.x, v.y, v.z) }
  g.computeVertexNormals()
  return g
}

// where the face texture sits on the head (angles in radians)
const FACE_A = .85
const FACE_T0 = Math.PI / 2 - .75
const FACE_TL = 1.7
function faceGeometry() {
  const nA = 36
  const nT = 30
  const positions: number[] = []
  const uvs: number[] = []
  const index: number[] = []
  for (let j = 0; j <= nT; j++) {
    for (let i = 0; i <= nA; i++) {
      const a = -FACE_A + (i / nA) * FACE_A * 2
      const th = FACE_T0 + (j / nT) * FACE_TL
      const p = shapeHead(spherePt(HR * 1.004, a, th))
      positions.push(p.x, p.y, p.z)
      uvs.push(i / nA, 1 - j / nT)
    }
  }
  for (let j = 0; j < nT; j++) {
    for (let i = 0; i < nA; i++) {
      const a = j * (nA + 1) + i
      const b = a + nA + 1
      index.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

function keyed(x: number, keys: [number, number][]) {
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) { const [x0, y0] = keys[i - 1]; const [x1, y1] = keys[i]; return lerp(y0, y1, smooth((x - x0) / (x1 - x0))) }
  }
  return keys[keys.length - 1][1]
}

const CAP_KEYS: [number, number][] = [[0, -.34], [.8, -.36], [1.25, -.4], [2.0, -.4], [2.8, -.36], [Math.PI, -.3]]

// closely cropped hair on the temples and nape (the "fade"), a translucent band under the cap
function fadeGeometry() {
  const nA = 72
  const nT = 8
  const positions: number[] = []
  const colors: number[] = []
  const index: number[] = []
  const col = new THREE.Color('#2b1d16')
  for (let i = 0; i <= nA; i++) {
    const a = -Math.PI + (i / nA) * Math.PI * 2
    const inner = Math.PI / 2 + keyed(Math.abs(a), CAP_KEYS)
    const d = 1.2 * smooth(clamp((Math.abs(a) - 1.2) / .5, 0, 1))
    for (let j = 0; j <= nT; j++) {
      const t = j / nT
      const p = shapeHead(spherePt(HR * 1.016, a, inner - .05 + t * (d + .05)))
      positions.push(p.x, p.y, p.z)
      colors.push(col.r, col.g, col.b, (t < .78 ? .9 : (1 - (t - .78) / .22) ** 1.2 * .9))
    }
  }
  for (let i = 0; i < nA; i++) {
    for (let j = 0; j < nT; j++) {
      const a = i * (nT + 1) + j
      const b = a + nT + 1
      index.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

function fringeGeometry() {
  const nA = 48
  const nV = 9
  const positions: number[] = []
  const index: number[] = []
  for (let i = 0; i <= nA; i++) {
    const t = i / nA
    const a = -1.2 + t * 2.4
    const edge = smooth(clamp(1 - Math.pow(Math.abs(t * 2 - 1), 3.2), 0, 1))
    // lower on the viewer's left, with a few soft notches
    const tip = Math.PI / 2 - .16 + .07 * (1 - t) ** 1.3 - .03 * t + (hash(i * 1.7) - .5) * .014
    for (let j = 0; j <= nV; j++) {
      const v = j / nV
      const th = lerp(Math.PI / 2 - .95, tip, v)
      const r = HR * (1.02 + (.045 + .05 * v * v) * edge)
      const p = spherePt(r, a, th)
      p.z += .014 * v * edge
      positions.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i < nA; i++) {
    for (let j = 0; j < nV; j++) {
      const a = i * (nV + 1) + j
      const b = a + nV + 1
      index.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

function hairCapGeometry() {
  const nA = 56
  const nT = 16
  const positions: number[] = []
  const index: number[] = []
  const R = HR * 1.065
  for (let i = 0; i <= nA; i++) {
    const a = -Math.PI + (i / nA) * Math.PI * 2
    const thMax = Math.PI / 2 + keyed(Math.abs(a), CAP_KEYS)
    for (let j = 0; j <= nT; j++) {
      const th = (j / nT) * thMax
      const p = spherePt(R, a, th)
      p.y *= 1.06
      positions.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i < nA; i++) {
    for (let j = 0; j < nT; j++) {
      const a = i * (nT + 1) + j
      const b = a + nT + 1
      index.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/* ------------------------------------------------------------------ *
 *  Face texture, painted on a canvas every time the expression moves.   *
 * ------------------------------------------------------------------ */
const EYE_WHITE = new Path2D('M-15 1 C-11 -9 -3 -10.5 3 -10.5 C10 -10.5 14.5 -5.5 16 1.5 C11 9.5 3 10.5 -2 10.5 C-8 10.5 -13 7 -15 1Z')
const EYE_LID = new Path2D('M-16.5 1.5 C-12 -10.5 -3 -12 3 -12 C11 -12 16 -6 17.5 1.5')
const EYE_LOW = new Path2D('M-11 8.4 C-5 11 4 11 12 6.6')

interface Face {
  look: { x: number; y: number }
  blink: number; squint: number
  brow: { ly: number; ry: number; lt: number; rt: number }
  mouth: { open: number; smile: number }
  blush: number
}

function createFacePainter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const px = W / FACE_TL // pixels per radian
  const X = (a: number) => (a + FACE_A) / (FACE_A * 2) * W
  const Y = (th: number) => (th - FACE_T0) / FACE_TL * canvas.height

  function eye(a: number, mir: boolean, f: Face) {
    const cx = X(a)
    const cy = Y(Math.PI / 2 + .05 + f.squint * .015)
    const k = 3.1
    const sy = Math.max(.07, 1 - f.blink * .93) * (1 - f.squint * .36)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(mir ? -k * .97 : k * .97, k * .76)
    ctx.rotate(mir ? .06 : -.06)
    ctx.translate(0, -9)
    ctx.scale(1, sy)
    ctx.translate(0, 9)
    ctx.save()
    ctx.clip(EYE_WHITE)
    ctx.fillStyle = '#fbf7f2'
    ctx.fill(EYE_WHITE)
    const ix = f.look.x * 4.2 * (mir ? -1 : 1)
    const iy = f.look.y * 2.8 - .6
    const g = ctx.createRadialGradient(ix, iy - 3.5, .5, ix, iy, 8.6)
    g.addColorStop(0, '#c98a50'); g.addColorStop(.5, '#7a431f'); g.addColorStop(1, '#2f170b')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.ellipse(ix, iy, 7.4, 8.4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#120804'
    ctx.beginPath(); ctx.ellipse(ix, iy, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(ix + (mir ? 2.6 : -2.6), iy - 3.2, 2.4, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = .75
    ctx.beginPath(); ctx.arc(ix + (mir ? -2.8 : 2.8), iy + 3, 1.1, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
    const sh = ctx.createLinearGradient(0, -12, 0, 2)
    sh.addColorStop(0, 'rgba(30,14,8,.7)'); sh.addColorStop(1, 'rgba(30,14,8,0)')
    ctx.fillStyle = sh
    ctx.fillRect(-18, -13, 38, 16)
    ctx.restore()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1b0d07'
    ctx.lineWidth = 3.4
    ctx.stroke(EYE_LID)
    ctx.lineWidth = 4.4
    ctx.beginPath(); ctx.moveTo(2, -12); ctx.bezierCurveTo(9, -12, 15, -7, 17.5, 1.5); ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(16.4, -2.5); ctx.lineTo(20.5, -5.4); ctx.stroke()
    ctx.globalAlpha = .4
    ctx.strokeStyle = '#7a4a37'
    ctx.lineWidth = 1.1
    ctx.beginPath(); ctx.moveTo(-12, -13.6); ctx.bezierCurveTo(-6, -17, 6, -17, 14, -11.5); ctx.stroke()
    ctx.globalAlpha = .5
    ctx.stroke(EYE_LOW)
    ctx.restore()
  }

  function brow(a: number, mir: boolean, lift: number, tilt: number) {
    const cx = X(a)
    const cy = Y(Math.PI / 2 - .125) + lift * 2.1
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(mir ? -1 : 1, 1)
    ctx.rotate(tilt * Math.PI / 180)
    ctx.strokeStyle = '#2a170d'
    ctx.lineCap = 'round'
    ctx.lineWidth = 25
    ctx.beginPath(); ctx.moveTo(-52, 7); ctx.quadraticCurveTo(-6, -4, 56, 3); ctx.stroke()
    ctx.restore()
  }

  function paint(f: Face) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // eye sockets and cheekbones, so the face has relief
    for (const a of [-.37, .37]) {
      const eg = ctx.createRadialGradient(X(a), Y(Math.PI / 2 + .02), 4, X(a), Y(Math.PI / 2 + .02), px * .24)
      eg.addColorStop(0, 'rgba(110,60,42,.3)'); eg.addColorStop(1, 'rgba(110,60,42,0)')
      ctx.fillStyle = eg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const cg2 = ctx.createRadialGradient(X(a * 1.35), Y(Math.PI / 2 + .3), 3, X(a * 1.35), Y(Math.PI / 2 + .3), px * .2)
      cg2.addColorStop(0, 'rgba(255,236,215,.28)'); cg2.addColorStop(1, 'rgba(255,236,215,0)')
      ctx.fillStyle = cg2
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    for (const a of [-.78, .78]) {
      const jg = ctx.createRadialGradient(X(a), Y(Math.PI / 2 + .72), 4, X(a), Y(Math.PI / 2 + .72), px * .3)
      jg.addColorStop(0, 'rgba(110,64,46,.3)'); jg.addColorStop(1, 'rgba(110,64,46,0)')
      ctx.fillStyle = jg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    // shadow cast by the fringe onto the forehead
    const fg = ctx.createLinearGradient(0, 30, 0, 125)
    fg.addColorStop(0, 'rgba(70,35,22,.32)'); fg.addColorStop(1, 'rgba(70,35,22,0)')
    ctx.fillStyle = fg
    ctx.fillRect(0, 30, canvas.width, 95)
    // soft cheek warmth
    if (f.blush > .01) {
      for (const a of [-.62, .62]) {
        const g = ctx.createRadialGradient(X(a), Y(Math.PI / 2 + .38), 2, X(a), Y(Math.PI / 2 + .38), px * .17)
        g.addColorStop(0, `rgba(235,120,105,${f.blush * .45})`); g.addColorStop(1, 'rgba(235,120,105,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    eye(-.37, true, f)
    eye(.37, false, f)
    brow(-.37, true, f.brow.ly, f.brow.lt)
    brow(.37, false, f.brow.ry, f.brow.rt)
    // nose
    const ng = ctx.createRadialGradient(X(.07), Y(Math.PI / 2 + .38), 2, X(.07), Y(Math.PI / 2 + .38), px * .16)
    ng.addColorStop(0, 'rgba(150,86,56,.22)'); ng.addColorStop(1, 'rgba(150,86,56,0)')
    ctx.fillStyle = ng
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // mouth: a calm, slightly lifted line with a soft lower lip
    const cx = X(0)
    const cy = Y(Math.PI / 2 + .64)
    const w = px * .34
    const open = f.mouth.open
    const sm = f.mouth.smile
    const N = 32
    const us = Array.from({ length: N + 1 }, (_, i) => -1 + (2 * i) / N)
    const bell = (u: number) => Math.pow(Math.max(0, 1 - Math.abs(u) ** 1.8), .85)
    const yTop = (u: number) => lerp(cy + 1.5 + sm * 3, cy - sm * 6, Math.abs(u) ** 1.9)
    const yGap = (u: number) => yTop(u) + open * 44 * bell(u)
    const lip = 31 + sm
    const trace = (fn: (u: number) => number) => { ctx.beginPath(); us.forEach((u, i) => { const x = cx + u * w; const y = fn(u); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }) }
    const band = (a1: (u: number) => number, a2: (u: number) => number) => {
      ctx.beginPath()
      us.forEach((u, i) => { const x = cx + u * w; i ? ctx.lineTo(x, a1(u)) : ctx.moveTo(x, a1(u)) })
      for (let i = us.length - 1; i >= 0; i--) ctx.lineTo(cx + us[i] * w, a2(us[i]))
      ctx.closePath()
    }
    // soft shadow under the lower lip
    const cg = ctx.createRadialGradient(cx, yGap(0) + lip + 12, 2, cx, yGap(0) + lip + 12, w * .55)
    cg.addColorStop(0, 'rgba(140,80,56,.2)'); cg.addColorStop(1, 'rgba(140,80,56,0)')
    ctx.fillStyle = cg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (open > .05) {
      band(yTop, yGap)
      ctx.fillStyle = '#5a1c28'
      ctx.fill()
      ctx.save(); ctx.clip()
      ctx.fillStyle = '#e0838c'
      ctx.beginPath(); ctx.ellipse(cx, yGap(0) - 4, w * .5, 10 + open * 8, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#f9f3ee'
      band(yTop, u => yTop(u) + 9 + open * 4)
      ctx.fill()
      ctx.restore()
    }
    band(yGap, u => yGap(u) + lip * bell(u))
    ctx.fillStyle = 'rgba(194,112,110,.62)'
    ctx.fill()
    band(u => yTop(u) - 5 * bell(u), yTop)
    ctx.fillStyle = 'rgba(176,98,98,.4)'
    ctx.fill()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#4b1f1f'
    ctx.lineWidth = 4.5
    trace(yTop); ctx.stroke()
    ctx.save(); ctx.beginPath(); ctx.rect(cx - w * .55, 0, w * 1.1, canvas.height); ctx.clip()
    ctx.lineWidth = 7
    trace(yTop); ctx.stroke(); ctx.restore()
  }
  return paint
}

/* ------------------------------------------------------------------ *
 *  Hand                                                                *
 * ------------------------------------------------------------------ */
interface FingerDef { x: number; l1: number; l2: number; r: number }
const FINGER_DEFS: FingerDef[] = [
  { x: -.078, l1: .085, l2: .07, r: .026 },
  { x: -.026, l1: .095, l2: .078, r: .027 },
  { x: .026, l1: .085, l2: .07, r: .026 },
  { x: .072, l1: .068, l2: .058, r: .023 },
]

interface HandRig {
  root: THREE.Group
  fingers: { base: THREE.Group; joint: THREE.Group }[]
  thumb: { base: THREE.Group; joint: THREE.Group }
}

function buildHand(toonMat: THREE.Material, addOutline: (m: THREE.Mesh, material: THREE.ShaderMaterial) => void, line: THREE.ShaderMaterial): HandRig {
  const root = new THREE.Group()
  const mesh = (geo: THREE.BufferGeometry) => { const m = new THREE.Mesh(geo, toonMat); addOutline(m, line); return m }
  const palm = mesh(new THREE.SphereGeometry(1, 20, 14))
  palm.scale.set(.118, .15, .06)
  palm.position.set(0, .135, 0)
  root.add(palm)
  const fingers = FINGER_DEFS.map(d => {
    const base = new THREE.Group()
    base.position.set(d.x, .255, 0)
    const p = mesh(new THREE.CapsuleGeometry(d.r, d.l1, 4, 10))
    p.position.y = d.l1 / 2
    const joint = new THREE.Group()
    joint.position.y = d.l1 + d.r * .1
    const dm = mesh(new THREE.CapsuleGeometry(d.r * .92, d.l2, 4, 10))
    dm.position.y = d.l2 / 2
    joint.add(dm)
    base.add(p, joint)
    root.add(base)
    return { base, joint }
  })
  const tb = new THREE.Group()
  tb.position.set(-.092, .07, .012)
  const tp = mesh(new THREE.CapsuleGeometry(.03, .075, 4, 10))
  tp.position.y = .045
  const tj = new THREE.Group()
  tj.position.y = .085
  const td = mesh(new THREE.CapsuleGeometry(.027, .065, 4, 10))
  td.position.y = .04
  tj.add(td)
  tb.add(tp, tj)
  root.add(tb)
  return { root, fingers, thumb: { base: tb, joint: tj } }
}

/* ------------------------------------------------------------------ *
 *  Arms                                                                *
 * ------------------------------------------------------------------ */
const UPPER = .72
const FORE = .66
const SHOULDER: Record<Side, THREE.Vector3> = {
  L: new THREE.Vector3(-.93, -.22, 0),
  R: new THREE.Vector3(.93, -.22, 0),
}
const Y_AXIS = new THREE.Vector3(0, 1, 0)

interface Arm {
  x: number; y: number; z: number // wrist target relative to the shoulder
  fs: number
  follow: number
  fx: number; fy: number; fz: number // fingers direction when not following the forearm
  px: number; py: number; pz: number // where the palm faces
  wave: number; poke: number; pointW: number; grip: number
  c0: number; c1: number; c2: number; c3: number; c4: number
  spread: number; thumb: number
}

function restArm(side: Side): Arm {
  const k = side === 'R' ? 1 : -1
  return {
    x: k * .04, y: -1.18, z: .1, fs: 1, follow: 1, fx: 0, fy: 1, fz: 0, px: -k * .4, py: 0, pz: .6,
    wave: 0, poke: 0, pointW: 0, grip: 0,
    c0: .5, c1: .55, c2: .6, c3: .65, c4: .7, spread: .1, thumb: .1,
  }
}

const HAND = {
  open: { c0: 0, c1: 0, c2: 0, c3: 0, c4: 0, spread: .8, thumb: 1 },
  point: { c0: .8, c1: 0, c2: 1, c3: 1, c4: 1, spread: 0, thumb: .25 },
  thumbs: { c0: 0, c1: 1, c2: 1, c3: 1, c4: 1, spread: 0, thumb: 1 },
  think: { c0: .8, c1: 0, c2: .95, c3: 1, c4: 1, spread: 0, thumb: .15 },
}

function solveArm(side: Side, target: THREE.Vector3, fs: number) {
  const S = SHOULDER[side]
  const k = side === 'R' ? 1 : -1
  const u = UPPER * fs
  const f = FORE * fs
  const v = target.clone().sub(S)
  const d = v.length() || 1
  const dd = clamp(d, Math.abs(u - f) + .03, u + f - .01)
  const dir = v.multiplyScalar(1 / d)
  const wrist = S.clone().addScaledVector(dir, dd)
  const cosA = clamp((u * u + dd * dd - f * f) / (2 * u * dd), -1, 1)
  const a = Math.acos(cosA)
  const pole = new THREE.Vector3(k * 1, -.75, -.55)
  pole.addScaledVector(dir, -pole.dot(dir))
  if (pole.lengthSq() < 1e-4) pole.set(0, 0, -1)
  pole.normalize()
  const elbow = S.clone().addScaledVector(dir, u * cosA).addScaledVector(pole, u * Math.sin(a))
  return { elbow, wrist }
}

function armGeo(profile: [number, number][]) {
  return new THREE.LatheGeometry(profile.map(([y, r]) => new THREE.Vector2(r, y)), 22)
}

function place(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  const dir = b.clone().sub(a)
  const len = dir.length() || 1e-4
  m.position.copy(a).addScaledVector(dir, .5)
  m.quaternion.setFromUnitVectors(Y_AXIS, dir.multiplyScalar(1 / len))
  m.scale.y = len
}

/* ------------------------------------------------------------------ *
 *  The whole thing                                                     *
 * ------------------------------------------------------------------ */
export function createThreeRig(canvas: HTMLCanvasElement): Rig | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const FOV = 16
  const camDist = (FH / 2) / Math.tan((FOV * Math.PI) / 360)
  const camera = new THREE.PerspectiveCamera(FOV, FW / FH, .5, 60)
  camera.position.set(0, FTOP - FH / 2, camDist)
  camera.lookAt(0, FTOP - FH / 2, 0)
  scene.add(new THREE.AmbientLight(0xffffff, .42))
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc7b0a0, .55))
  const sun = new THREE.DirectionalLight(0xfff4e8, 2.6)
  sun.position.set(-.8, 2.8, 6.5)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -3.2
  sun.shadow.camera.right = 3.2
  sun.shadow.camera.top = 3.2
  sun.shadow.camera.bottom = -3.2
  sun.shadow.camera.near = .5
  sun.shadow.camera.far = 20
  sun.shadow.bias = -.0006
  sun.shadow.normalBias = .025
  const rim = new THREE.DirectionalLight(0xcfe0ff, 1.5)
  rim.position.set(3, 2, -4)
  scene.add(rim)
  scene.add(sun)

  const { toon, outline, dispose: disposeToon } = makeToon()
  const lineBody = outline('#3a2118', .008)
  const lineFine = outline('#4a2a1e', .0058)
  const lineHair = outline('#150b07', .0034)
  const addOutline = (m: THREE.Mesh, mat: THREE.ShaderMaterial) => { const o = new THREE.Mesh(m.geometry, mat); m.add(o) }
  const mk = (geo: THREE.BufferGeometry, color: string, mat: THREE.ShaderMaterial = lineBody) => {
    const m = new THREE.Mesh(geo, toon(color, mat === lineHair))
    addOutline(m, mat)
    return m
  }
  const geos: THREE.BufferGeometry[] = []
  const G = <T extends THREE.BufferGeometry>(g: T) => { geos.push(g); return g }

  /* ---- body ---- */
  const root = new THREE.Group()
  root.position.set(0, -1.1, 0)
  scene.add(root)
  const body = new THREE.Group()
  body.position.set(0, 1.1, 0)
  root.add(body)
  // [y, radius] bottom → top. Wide chest, a trapezius slope up to the neck.
  const TORSO: [number, number][] = [[-3.4, .7], [-1.8, .68], [-1.1, .64], [-.65, .7], [-.4, .8], [-.22, .84], [-.1, .8], [0, .7], [.07, .56], [.13, .42], [.18, .34]]
  const torsoR = (y: number) => {
    for (let i = 1; i < TORSO.length; i++) if (y <= TORSO[i][0]) { const [y0, r0] = TORSO[i - 1]; const [y1, r1] = TORSO[i]; return lerp(r0, r1, (y - y0) / (y1 - y0)) }
    return TORSO[TORSO.length - 1][1]
  }
  const TX = 1.22
  const TZ = .62
  const shirt = new THREE.Group()
  const torso = mk(G(new THREE.LatheGeometry(TORSO.map(([y, r]) => new THREE.Vector2(r, y)), 48)), SHIRT)
  torso.scale.set(TX, 1, TZ)
  shirt.add(torso)
  // soft creases lying on the cloth: from the armpits, across the chest, and a hem fold
  const foldMat = toon('#d3d8e8')
  const onTorso = (x: number, y: number, lift = .012) => {
    const r = torsoR(y)
    const nx = clamp(x / (r * TX), -.97, .97)
    return new THREE.Vector3(x, y, Math.sqrt(1 - nx * nx) * r * TZ + lift)
  }
  const fold = (pts: [number, number][], radius: number) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => onTorso(x, y)))
    const m = new THREE.Mesh(G(new THREE.TubeGeometry(curve, 24, radius, 6, false)), foldMat)
    shirt.add(m)
  }
  // chest: two pecs under the shirt, with a crease where each one ends
  for (const sx of [-1, 1]) {
    const pec = new THREE.Mesh(G(new THREE.SphereGeometry(1, 28, 20)), toon(SHIRT))
    pec.scale.set(.4, .22, .06)
    pec.position.set(sx * .4, -.5, .455)
    shirt.add(pec)
    fold([[sx * .8, -.34], [sx * .6, -.52], [sx * .36, -.62], [sx * .08, -.64]], .009)
    fold([[sx * .86, -.5], [sx * .72, -.68], [sx * .62, -.92]], .009)
  }
  fold([[-.22, .02], [0, -.03], [.22, .02]], .012)
  fold([[0, -.64], [.01, -.85], [0, -1.05]], .01)
  const collar = new THREE.Mesh(G(new THREE.TorusGeometry(.33, .046, 10, 36)), toon('#dfe3ee'))
  collar.rotation.x = Math.PI / 2
  collar.position.set(0, .1, .01)
  collar.scale.set(1.02, 1.12, 1)
  shirt.add(collar)
  body.add(shirt)

  const neck = mk(G(new THREE.CylinderGeometry(.245, .29, .8, 32)), SKIN, lineFine)
  neck.position.set(0, .43, -.005)
  body.add(neck)

  /* ---- head ---- */
  const headPivot = new THREE.Group()
  headPivot.position.set(0, .14, 0)
  body.add(headPivot)
  const head = new THREE.Group()
  head.position.set(0, .98, 0)
  head.scale.set(.93, 1.38, 1.1)
  headPivot.add(head)
  const skull = mk(G(headGeometry()), SKIN)
  head.add(skull)
  const faceCanvas = document.createElement('canvas')
  faceCanvas.width = faceCanvas.height = 384
  const faceTex = new THREE.CanvasTexture(faceCanvas)
  faceTex.colorSpace = THREE.SRGBColorSpace
  faceTex.anisotropy = 4
  const face = new THREE.Mesh(G(faceGeometry()), new THREE.MeshBasicMaterial({
    map: faceTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }))
  skull.add(face)
  for (const sx of [-1, 1]) {
    const ear = mk(G(new THREE.SphereGeometry(1, 18, 14)), SKIN, lineFine)
    ear.scale.set(.068, .148, .105)
    ear.position.set(sx * HR * .96, -.03, -.005)
    ear.rotation.z = sx * .1
    ear.rotation.y = sx * .28
    const rim = new THREE.Mesh(G(new THREE.TorusGeometry(.085, .018, 10, 24, Math.PI * 1.45)), toon(SKIN))
    rim.position.set(sx * HR * 1.0, -.02, -.012)
    rim.rotation.set(0, sx * Math.PI / 2, sx * 1.1)
    rim.scale.set(.8, 1.15, 1)
    head.add(rim)
    head.add(ear)
    const inner = new THREE.Mesh(G(new THREE.SphereGeometry(1, 12, 10)), toon('#e3a07e'))
    inner.scale.set(.02, .06, .04)
    inner.position.set(sx * HR * 1.0, -.015, -.02)
    head.add(inner)
  }
  const stud = new THREE.Mesh(G(new THREE.SphereGeometry(.03, 14, 12)), toon('#f4f7ff'))
  stud.position.set(HR * 1.0, -.165, .0)
  head.add(stud)
  // nose: an extruded side profile (bridge -> tip -> base) so it joins the face and reads from the side
  const noseMat = toon(SKIN)
  const nose = new THREE.Group()
  const prof2d = new THREE.Shape()
  prof2d.moveTo(.4, .02)
  prof2d.lineTo(.446, .02)
  prof2d.bezierCurveTo(.476, -.07, .512, -.15, .536, -.188)
  prof2d.bezierCurveTo(.552, -.212, .538, -.236, .508, -.234)
  prof2d.lineTo(.46, -.226)
  prof2d.lineTo(.4, -.226)
  prof2d.closePath()
  const noseGeo = G(new THREE.ExtrudeGeometry(prof2d, { depth: .09, bevelEnabled: true, bevelSize: .034, bevelThickness: .034, bevelSegments: 4, curveSegments: 14 }))
  noseGeo.rotateY(-Math.PI / 2)
  noseGeo.translate(.045, 0, 0)
  const bridgeMesh = new THREE.Mesh(noseGeo, noseMat)
  nose.add(bridgeMesh)
  const wingGeo = G(new THREE.SphereGeometry(1, 16, 12))
  for (const sx of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, noseMat)
    wing.scale.set(.052, .05, .05)
    wing.position.set(sx * .082, -.196, .484)
    nose.add(wing)
    const hole = new THREE.Mesh(G(new THREE.SphereGeometry(1, 10, 8)), toon('#7d4a36'))
    hole.scale.set(.02, .01, .016)
    hole.position.set(sx * .034, -.232, .515)
    nose.add(hole)
  }
  skull.add(nose)
  const fade = new THREE.Mesh(G(fadeGeometry()), new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }))
  head.add(fade)
  const hairGroup = new THREE.Group()
  head.add(hairGroup)
  const hairCap = mk(G(hairCapGeometry()), HAIR, lineHair)
  hairCap.material = toon('#2c1f18', true)
  hairGroup.add(hairCap)
  // the quiff: a broad dark mass on top that overhangs the forehead, textured with curls
  const Q = { rx: HR * 1.06, ry: HR * .42, rz: HR * 1.0, cy: HR * .58, cz: HR * .1 }
  const quiff = mk(G(new THREE.SphereGeometry(1, 40, 28)), '#16100c', lineHair)
  quiff.material = toon('#33241c', true)
  quiff.scale.set(Q.rx, Q.ry, Q.rz)
  quiff.position.set(0, Q.cy, Q.cz)
  hairGroup.add(quiff)
  const curls: { m: THREE.Mesh; home: THREE.Vector3; w: number; seed: number }[] = []
  const lockGeo = G(new THREE.IcosahedronGeometry(1, 2))
  const UP = new THREE.Vector3(0, 1, 0)
  // one tuft: an elongated blob that starts at `p` and points along `dir`
  const placeLock = (p: THREE.Vector3, dir: THREE.Vector3, len: number, wid: number, thick: number, w: number) => {
    const z = dir.clone().normalize()
    const x = new THREE.Vector3().crossVectors(UP, z).normalize()
    const y = new THREE.Vector3().crossVectors(z, x).normalize()
    const m = mk(lockGeo, CURL_COLORS[curls.length % CURL_COLORS.length], lineHair)
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
    m.scale.set(wid, thick, len)
    const home = p.clone().addScaledVector(z, len * .55)
    m.position.copy(home)
    hairGroup.add(m)
    curls.push({ m, home, w, seed: curls.length })
  }
  const surf = (a: number, th: number) => {
    const st = Math.sin(th)
    return new THREE.Vector3(Q.rx * st * Math.sin(a), Q.ry * Math.cos(th), Q.rz * st * Math.cos(a))
  }
  // locks on the dome, flowing from the crown toward the front and down the sides
  const dome = (a: number, th: number, len: number, wid: number, thick: number, w: number, sweep = .12, lift = 1.0) => {
    const st = Math.sin(th)
    const ct = Math.cos(th)
    const p = surf(a, th).multiplyScalar(lift)
    p.y += Q.cy
    p.z += Q.cz
    const T = new THREE.Vector3(Q.rx * ct * Math.sin(a), -Q.ry * st, Q.rz * ct * Math.cos(a))
    T.x += sweep
    placeLock(p, T, len, wid, thick, w)
  }
  // a few low, soft clumps over the smooth crown (no loose lobes at the temples)
  for (let i = 0; i < 4; i++) dome(-.9 + i * .6, .4 + hash(i + 60) * .04, .22, .13, .07, .8, .2, 1.0)
  for (let i = 0; i < 6; i++) dome(-1.3 + i * .52, .85 + hash(i + 40) * .05, .2, .12, .065, .85, .12, 1.0)
  // the fringe: one smooth, thick band over the forehead, longer and lower on one side
  const fringe = mk(G(fringeGeometry()), HAIR, lineHair)
  fringe.material = new THREE.MeshToonMaterial({ color: '#2c2019', side: THREE.DoubleSide, gradientMap: toon('#fff', true).gradientMap })
  hairGroup.add(fringe)

  /* ---- arms ---- */
  interface Limb {
    upper: THREE.Mesh; fore: THREE.Mesh; elbow: THREE.Mesh; wristBall: THREE.Mesh
    sleeve: THREE.Mesh; sleeveCap: THREE.Mesh; hand: HandRig; handRoot: THREE.Group
  }
  const makeLimb = (side: Side): Limb => {
    const upper = mk(G(armGeo([[-.5, .15], [-.1, .16], [.3, .135], [.5, .118]])), SKIN, lineFine)
    const fore = mk(G(armGeo([[-.5, .118], [-.28, .138], [.1, .113], [.5, .09]])), SKIN, lineFine)
    const elbow = mk(G(new THREE.SphereGeometry(.125, 18, 14)), SKIN, lineFine)
    const wristBall = mk(G(new THREE.SphereGeometry(.095, 16, 12)), SKIN, lineFine)
    const sleeve = mk(G(new THREE.CylinderGeometry(.225, .2, 1, 28)), SHIRT, lineBody)
    const sleeveCap = mk(G(new THREE.SphereGeometry(.205, 24, 18)), SHIRT, lineBody)
    const hand = buildHand(toon(SKIN), addOutline, lineFine)
    const handRoot = new THREE.Group()
    handRoot.scale.setScalar(1.22)
    handRoot.add(hand.root)
    if (side === 'L') hand.root.scale.x = -1
    const g = new THREE.Group()
    g.add(upper, fore, elbow, wristBall, sleeve, sleeveCap, handRoot)
    body.add(g)
    return { upper, fore, elbow, wristBall, sleeve, sleeveCap, hand, handRoot }
  }
  const limbs: Record<Side, Limb> = { L: makeLimb('L'), R: makeLimb('R') }

  scene.traverse(o => {
    const m = o as THREE.Mesh
    if (m.isMesh && !(m.material instanceof THREE.ShaderMaterial) && !(m.material instanceof THREE.MeshBasicMaterial)) {
      m.castShadow = true
      m.receiveShadow = true
    }
  })

  /* ---- state ---- */
  const s = {
    head: { rot: 0, yaw: 0, pitch: 0 },
    look: { x: 0, y: 0 },
    brow: { ly: 0, ry: 0, lt: 0, rt: 0 },
    eye: { blink: 0, squint: 0 },
    mouth: { open: 0, smile: .12 },
    blush: .12,
    body: { y: 0 },
    peek: { rot: 0 },
    arms: { L: restArm('L'), R: restArm('R') } as Record<Side, Arm>,
  }
  let attention: (() => Pt | null) | null = null
  let lookOverride: Pt | null = null
  let talking = false
  let talkOpen = 0
  let pointer = { x: -9999, y: -9999, t: -99 }
  const glance = { x: 0, y: 0 }
  let vel = { x: 0, y: 0 }
  const velSmooth = { x: 0, y: 0 }
  const hair = { x: 0, y: 0 }
  let lagYaw = 0
  const pointing: { side: Side | null; target: (() => Pt | null) | null } = { side: null, target: null }
  let currentGesture: Gesture = 'rest'
  let freeSide: Side = 'L'
  let destroyed = false
  let onScreen = true
  let lastFace = ''
  type Edge = 'bottom' | 'left' | 'right'
  let peekEdge: Edge | null = null
  let gripSides = new Set<Side>()
  const invBody = new THREE.Matrix4()
  const paintFace = createFacePainter(faceCanvas)
  const calls: gsap.core.Animation[] = []

  const onPointer = (e: PointerEvent) => { pointer = { x: e.clientX, y: e.clientY, t: gsap.ticker.time } }
  window.addEventListener('pointermove', onPointer, { passive: true })
  const io = new IntersectionObserver(entries => { onScreen = entries.some(e => e.isIntersecting) })
  io.observe(canvas)

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  /* ---- life ---- */
  function blink() {
    if (destroyed) return
    const tl = gsap.timeline()
    tl.to(s.eye, { blink: 1, duration: .07, ease: 'power2.in' }).to(s.eye, { blink: 0, duration: .13, ease: 'power2.out' })
    if (Math.random() < .18) tl.to(s.eye, { blink: 1, duration: .07, delay: .06 }).to(s.eye, { blink: 0, duration: .13 })
    gsap.delayedCall(2 + Math.random() * 3.6, blink)
  }
  function idleTick() {
    if (destroyed) return
    const r = Math.random()
    const busy = talking || pointing.side !== null
    if (r < .42) {
      gsap.to(glance, { x: (Math.random() - .5) * 1.6, y: (Math.random() - .5) * .9, duration: .22, ease: 'power3.out' })
      gsap.to(glance, { x: 0, y: 0, duration: .5, delay: .7 + Math.random() * 1.1, ease: 'power2.inOut' })
    } else if (r < .6) {
      const up = -3 - Math.random() * 3
      gsap.to(s.brow, { ly: up, ry: up, duration: .16, ease: 'power2.out' })
      gsap.to(s.brow, { ly: 0, ry: 0, duration: .4, delay: .6, ease: 'power2.inOut' })
    } else if (r < .72 && currentGesture !== 'think') {
      flourish()
    } else if (!busy) {
      gsap.to(s.head, { rot: (Math.random() < .5 ? -1 : 1) * (.05 + Math.random() * .05), duration: .6, ease: 'sine.inOut', yoyo: true, repeat: 1 })
    }
    gsap.delayedCall(2.4 + Math.random() * 3.6, idleTick)
  }
  function flourish() {
    const side = freeSide
    const a = s.arms[side]
    if (destroyed || reduced.matches || a.pointW > 0 || a.wave > 0 || a.y > -1.1) return
    if (currentGesture === 'wave' || currentGesture === 'bye') return
    const k = side === 'R' ? 1 : -1
    const tl = gsap.timeline({ onComplete: () => settle(side, .8) })
    tl.to(a, { x: k * .48, y: .66, z: .22, ...HAND.open, follow: 1, px: 0, py: 0, pz: 1, duration: .6, ease: 'back.out(1.3)', overwrite: 'auto' })
      .to(a, { wave: .8, duration: .25 })
      .to(a, { wave: 0, duration: .4 }, '+=1.1')
    calls.push(tl)
  }
  blink()
  gsap.delayedCall(1.6, idleTick)

  /* ---- coordinates ---- */
  const toWorld = (p: Pt, rect: DOMRect) => new THREE.Vector3(
    FLEFT + (p.x - rect.left) / rect.width * FW,
    FTOP - (p.y - rect.top) / rect.height * FH, 0)

  /* ---- per-frame ---- */
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()
  const basis = new THREE.Matrix4()
  const vx = new THREE.Vector3()
  const vy = new THREE.Vector3()
  const vz = new THREE.Vector3()

  function gripWorld(side: Side) {
    if (peekEdge === 'bottom') return new THREE.Vector3(side === 'R' ? .8 : -.8, -.86, .12)
    return new THREE.Vector3(peekEdge === 'right' ? .02 : -.02, -.14, .12)
  }

  function updateArm(side: Side, t: number, rect: DOMRect) {
    const a = s.arms[side]
    const L = limbs[side]
    const k = side === 'R' ? 1 : -1
    const S = SHOULDER[side]
    const target = new THREE.Vector3(S.x + a.x, S.y + a.y, S.z + a.z)
    let wave = 0
    if (a.pointW > 0 && pointing.side === side && pointing.target) {
      const tp = pointing.target()
      if (tp) {
        // shoulder position on screen → direction to the target on screen
        const sh = tmpA.copy(S).applyMatrix4(body.matrixWorld)
        const w = toWorld(tp, rect)
        const dir = tmpB.set(w.x - sh.x, w.y - sh.y, 0)
        const len = dir.length() || 1
        dir.multiplyScalar(1 / len)
        const reach = 1.2 + Math.sin(t * 5.4) * .035 * a.poke
        const pw = new THREE.Vector3(sh.x + dir.x * reach, sh.y + dir.y * reach, sh.z + .32).applyMatrix4(invBody)
        target.lerp(pw, a.pointW)
      }
    }
    if (a.grip > 0) target.lerp(gripWorld(side).applyMatrix4(invBody), a.grip)
    if (a.wave > 0) {
      wave = Math.sin(t * 9.5) * a.wave
      target.x += wave * .13 * k
      target.y += Math.abs(Math.cos(t * 9.5)) * -.03 * a.wave
    }
    const breath = Math.sin(t * 1.9)
    if (a.pointW === 0 && a.wave === 0 && a.y < -1.2) target.y += breath * .012
    const { elbow, wrist } = solveArm(side, target, a.fs)

    place(L.upper, S, elbow)
    place(L.fore, elbow, wrist)
    L.elbow.position.copy(elbow)
    L.wristBall.position.copy(wrist)
    const cuff = S.clone().lerp(elbow, .58)
    place(L.sleeve, S, cuff)
    L.sleeveCap.position.copy(S)

    // hand orientation: fingers along the forearm (or an override), palm facing a hint
    const fore = tmpA.copy(wrist).sub(elbow).normalize()
    const abs = tmpB.set(a.fx, a.fy, a.fz).normalize()
    const fwd = fore.clone().lerp(abs, 1 - a.follow).normalize()
    if (wave) fwd.applyAxisAngle(vz.set(0, 0, 1), -wave * .38 * k)
    const hint = vy.set(a.px, a.py, a.pz).normalize()
    const z = hint.addScaledVector(fwd, -hint.dot(fwd))
    if (z.lengthSq() < 1e-4) z.set(0, 0, 1)
    z.normalize()
    const x = vx.crossVectors(fwd, z).normalize()
    basis.makeBasis(x, fwd, z)
    L.handRoot.position.copy(wrist)
    L.handRoot.quaternion.setFromRotationMatrix(basis)

    const curlsArr = [a.c1, a.c2, a.c3, a.c4]
    const spread = a.spread
    L.hand.fingers.forEach((f, i) => {
      const c = clamp(curlsArr[i], 0, 1)
      f.base.rotation.set(c * 1.3, 0, (1.5 - i) * spread * .17)
      f.joint.rotation.x = c * 1.45
    })
    const th = L.hand.thumb
    const c0 = clamp(a.c0, 0, 1)
    th.base.rotation.set(c0 * .5 - .1, .25 * (1 - a.thumb), .25 + a.thumb * .75)
    th.joint.rotation.x = c0 * .85
  }

  function frame(t: number, dt: number) {
    if (destroyed || !onScreen || document.hidden) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width) return
    const calm = reduced.matches

    // gaze
    head.getWorldPosition(tmpA)
    const eyeClient = {
      x: rect.left + (tmpA.x - FLEFT) / FW * rect.width,
      y: rect.top + (FTOP - tmpA.y) / FH * rect.height,
    }
    let gaze: Pt | null = attention?.() ?? null
    if (!gaze && t - pointer.t < 5) gaze = pointer
    let nx = 0
    let ny = 0
    if (lookOverride) { nx = lookOverride.x; ny = lookOverride.y } else if (gaze) {
      nx = clamp((gaze.x - eyeClient.x) / (rect.width * 1.1), -1, 1)
      ny = clamp((gaze.y - eyeClient.y) / (rect.width * 1.1), -1, 1)
    }
    const gx = clamp(nx + glance.x * (gaze ? .3 : 1), -1.2, 1.2)
    const gy = clamp(ny + glance.y * (gaze ? .3 : 1), -1.2, 1.2)
    s.look.x += (gx - s.look.x) * damp(12, dt)
    s.look.y += (gy - s.look.y) * damp(12, dt)
    s.head.yaw += (nx * .5 - s.head.yaw) * damp(3.6, dt)
    s.head.pitch += (ny * .3 - s.head.pitch) * damp(3.6, dt)

    velSmooth.x += (vel.x - velSmooth.x) * damp(7, dt)
    velSmooth.y += (vel.y - velSmooth.y) * damp(7, dt)

    if (talking) {
      const syl = Math.max(0, Math.sin(t * 13 + Math.sin(t * 3.1) * 2.2))
      talkOpen = lerp(talkOpen, .12 + Math.pow(syl, .65) * .7, damp(30, dt))
    } else talkOpen = lerp(talkOpen, 0, damp(14, dt))

    const bob = calm ? 0 : Math.sin(t * 1.55) * .045 + Math.sin(t * .83) * .018
    const breath = calm ? 0 : Math.sin(t * 1.9)
    root.position.y = -1.1 + s.body.y + bob
    root.rotation.z = s.peek.rot + clamp(-velSmooth.x / 6000, -.12, .12) + (calm ? 0 : Math.sin(t * .9) * .012)
    body.rotation.y = (calm ? 0 : Math.sin(t * .6) * .035) + s.head.yaw * .12
    shirt.scale.set(1 + breath * .006, 1 + breath * .008, 1 + breath * .006)
    root.updateMatrixWorld(true)
    invBody.copy(body.matrixWorld).invert()

    // head
    const idleRoll = calm ? 0 : Math.sin(t * .7) * .018 + Math.sin(t * 1.13 + 1) * .01
    headPivot.rotation.set(s.head.pitch, s.head.yaw, s.head.rot + idleRoll - s.peek.rot * .5)
    lagYaw += (s.head.yaw - lagYaw) * damp(3.2, dt)
    const lag = lagYaw - s.head.yaw
    hair.x += (clamp(-velSmooth.x * .00012, -.06, .06) + lag * .07 - hair.x) * damp(9, dt)
    hair.y += (clamp(-velSmooth.y * .0001, -.05, .05) - hair.y) * damp(9, dt)
    curls.forEach(c => {
      const sway = calm ? 0 : Math.sin(t * 1.6 + c.seed) * .006
      c.m.position.set(c.home.x + (hair.x + sway) * c.w, c.home.y + hair.y * c.w + (calm ? 0 : Math.cos(t * 1.3 + c.seed) * .004 * c.w), c.home.z)
    })

    // face texture only when something changed
    const open = clamp(s.mouth.open + talkOpen, 0, 1)
    const key = [s.look.x, s.look.y, s.eye.blink, s.eye.squint, s.brow.ly, s.brow.ry, s.brow.lt, s.brow.rt, open, s.mouth.smile, s.blush]
      .map(v => v.toFixed(2)).join('|')
    if (key !== lastFace) {
      lastFace = key
      paintFace({ look: s.look, blink: s.eye.blink, squint: s.eye.squint, brow: s.brow, mouth: { open, smile: s.mouth.smile }, blush: s.blush })
      faceTex.needsUpdate = true
    }

    updateArm('L', t, rect)
    updateArm('R', t, rect)
    renderer.render(scene, camera)
  }

  const tick = (time: number, deltaTime: number) => frame(time, Math.min(deltaTime / 1000, .05))
  gsap.ticker.add(tick)
  frame(0, .016)

  /* ---- API ---- */
  function armTween(side: Side, vars: Partial<Arm>, dur: number, ease: string) {
    calls.push(gsap.to(s.arms[side], { ...vars, duration: dur, ease, overwrite: 'auto' }))
  }
  function poseArm(side: Side, pose: Partial<Arm>, dur: number, ease = 'power3.inOut') {
    armTween(side, { follow: 1, fs: 1, wave: 0, poke: 0, pointW: 0, grip: 0, fx: 0, fy: 1, fz: 0, px: 0, py: 0, pz: 1, ...pose }, dur, ease)
  }
  function gripPose(): Partial<Arm> {
    const d = peekEdge === 'bottom' ? [0, -1, .15] : peekEdge === 'right' ? [1, -.3, .1] : [-1, -.3, .1]
    return { follow: 0, fx: d[0], fy: d[1], fz: d[2], px: 0, py: 0, pz: -1, c0: .55, c1: .6, c2: .62, c3: .64, c4: .66, spread: .1, thumb: .3, fs: .85, grip: 1 }
  }
  function settle(side: Side, dur = .8) {
    if (peekEdge === 'bottom') gripSides.add(side)
    rest(side, dur)
  }
  function rest(side: Side, dur = .7) {
    poseArm(side, gripSides.has(side) ? { ...restArm(side), ...gripPose() } : restArm(side), dur, 'power2.inOut')
  }

  const rig: Rig = {
    gesture(g, opts = {}) {
      currentGesture = g
      pointing.side = null
      pointing.target = null
      lookOverride = null
      const d = reduced.matches ? .01 : 1
      if (g === 'rest') {
        if (peekEdge === 'bottom') gripSides = new Set<Side>(['L', 'R'])
        rest('L', .7 * d); rest('R', .7 * d)
        return
      }
      let side: Side = opts.side ?? 'R'
      if (peekEdge === 'right') side = 'L'
      if (peekEdge === 'left') side = 'R'
      const other: Side = side === 'R' ? 'L' : 'R'
      const k = side === 'R' ? 1 : -1
      freeSide = other
      if (peekEdge === 'bottom') gripSides = new Set([other])
      rest(other, .6 * d)
      if (g === 'wave' || g === 'bye') {
        poseArm(side, { x: k * .55, y: .7, z: .22, ...HAND.open, px: -k * .15, py: 0, pz: 1 }, .62 * d, 'back.out(1.25)')
        gsap.to(s.arms[side], { wave: 1, duration: .35, delay: .5 * d, ease: 'power2.out' })
        gsap.to(s.arms[side], { wave: 0, duration: .5, delay: (g === 'bye' ? 3.6 : 2.7) * d, ease: 'power2.inOut', onComplete: () => settle(side, .9) })
        if (g === 'bye') {
          gsap.to(s.eye, { squint: 1, duration: .35, delay: .4 })
          gsap.to(s.eye, { squint: 0, duration: .5, delay: 3.8 })
        }
        return
      }
      if (g === 'point') {
        pointing.side = side
        pointing.target = opts.target ?? null
        poseArm(side, { x: k * .5, y: -.25, z: .3, ...HAND.point, px: -k * .5, py: 0, pz: .9, pointW: 0 }, .35 * d, 'power2.out')
        gsap.to(s.arms[side], { pointW: 1, duration: .6 * d, delay: .12 * d, ease: 'back.out(1.3)' })
        gsap.to(s.arms[side], { poke: 1, duration: .5, delay: 1.2 })
        return
      }
      if (g === 'think') {
        poseArm(side, { x: -k * .46, y: .5, z: .66, ...HAND.think, fs: 1, follow: 0, fx: -k * .22, fy: 1, fz: -.05, px: -k * .2, py: -.1, pz: -1 }, .8 * d, 'power3.inOut')
        lookOverride = { x: .55 * k, y: -.75 }
        gsap.to(s.brow, { ly: -4, ry: 1, lt: 0, rt: 3, duration: .4 })
        return
      }
      if (g === 'thumbs') poseArm(side, { x: k * .6, y: .4, z: .5, ...HAND.thumbs, px: -k * .6, py: 0, pz: .8 }, .6 * d, 'back.out(1.4)')
    },
    mood(m: Mood, dur = .45) {
      const mo = (o: object) => { gsap.to(s.mouth, { ...o, duration: dur, overwrite: 'auto' }) }
      const br = (o: object) => { gsap.to(s.brow, { ...o, duration: dur, overwrite: 'auto' }) }
      const sq = (v: number) => { gsap.to(s.eye, { squint: v, duration: dur }) }
      const bl = (v: number) => { gsap.to(s, { blush: v, duration: dur }) }
      if (m === 'calm') { mo({ smile: .12, open: 0 }); br({ ly: 0, ry: 0, lt: 0, rt: 0 }); bl(.1); sq(0) }
      if (m === 'happy') { mo({ smile: .95, open: .05 }); br({ ly: -2, ry: -2, lt: -2, rt: -2 }); bl(.3); sq(.28) }
      if (m === 'curious') { mo({ smile: .2, open: 0 }); br({ ly: -4, ry: 1, lt: 0, rt: 4 }); bl(.1); sq(0) }
      if (m === 'surprised') { mo({ smile: .1, open: .5 }); br({ ly: -6, ry: -6, lt: 4, rt: 4 }); sq(0) }
      if (m === 'proud') { mo({ smile: .75, open: 0 }); br({ ly: 0, ry: 0, lt: -4, rt: -4 }); bl(.22); sq(.12) }
    },
    peek(edge) {
      peekEdge = edge
      gripSides = edge === 'bottom' ? new Set<Side>(['L', 'R']) : new Set<Side>([edge === 'right' ? 'R' : 'L'])
      s.peek.rot = edge === 'bottom' ? 0 : edge === 'right' ? .95 : -.95
      rest('L', .01)
      rest('R', .01)
    },
    talk(on) { talking = on },
    setAttention(fn) { attention = fn },
    setLook(v) { lookOverride = v },
    setVelocity(x, y) { vel = { x, y } },
    hop() {
      if (reduced.matches) return
      gsap.timeline().to(s.body, { y: .22, duration: .2, ease: 'power2.out' }).to(s.body, { y: 0, duration: .45, ease: 'bounce.out' })
    },
    react() {
      if (reduced.matches) return
      rig.hop()
      rig.mood('surprised', .12)
      gsap.delayedCall(.55, () => rig.mood('happy', .3))
      if (currentGesture === 'rest') {
        rig.gesture('wave', { side: freeSide === 'L' ? 'R' : 'L' })
        gsap.delayedCall(2.4, () => { if (currentGesture === 'wave') rig.gesture('rest') })
      }
    },
    destroy() {
      destroyed = true
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onPointer)
      io.disconnect()
      ro.disconnect()
      gsap.killTweensOf([s.head, s.look, s.brow, s.eye, s.mouth, s.body, s.peek, s.arms.L, s.arms.R, glance, s])
      calls.forEach(c => c.kill())
      geos.forEach(g => g.dispose())
      faceTex.dispose()
      disposeToon()
      ;[lineBody, lineFine, lineHair].forEach(m => m.dispose())
      renderer.dispose()
    },
  }
  return rig
}
