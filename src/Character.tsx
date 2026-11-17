import { useEffect } from 'react'
import { FINGERS, VB, createRig } from './characterRig'
import type { Rig } from './characterRig'

export type { Gesture, Mood, Rig } from './characterRig'

const SKIN = '#f3c29c'
const LINE = '#5b3326'
const HAIR_DARK = '#24150f'

// [cx, cy, r, motion weight] — back to front. Built procedurally so the mass looks organic, not like a pile of balls.
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
function buildCurls(): [number, number, number, number][] {
  const out: [number, number, number, number][] = []
  // outer silhouette
  for (let i = 0; i <= 15; i++) {
    const a = (196 + i * 9.6) * Math.PI / 180
    const j = hash(i + 1)
    out.push([160 + Math.cos(a) * (57 + j * 4), 100 + Math.sin(a) * (64 + hash(i + 40) * 5), 9.5 + j * 4, .45 + hash(i + 9) * .2])
  }
  // inner volume
  for (let i = 0; i <= 10; i++) {
    const a = (205 + i * 13.5) * Math.PI / 180
    const j = hash(i + 70)
    out.push([160 + Math.cos(a) * (40 + j * 6), 98 + Math.sin(a) * (47 + hash(i + 90) * 5), 11 + j * 4.5, .75 + hash(i + 3) * .15])
  }
  // crown
  out.push([150, 46, 15, .9], [172, 44, 14, .9], [161, 56, 15, .95], [136, 52, 13, .9], [186, 53, 13, .9])
  // messy fringe over the forehead
  for (let i = 0; i < 10; i++) {
    const t = i / 9
    const x = 121 + t * 79 + (hash(i + 120) - .5) * 5
    const y = 71 - Math.sin(t * Math.PI) * 7 + (hash(i + 140) - .5) * 6 + (i % 2) * 3
    out.push([x, y, 8.5 + hash(i + 160) * 3.5, 1 + hash(i) * .15])
  }
  // sideburn tufts
  out.push([111, 90, 6.5, .5], [209, 90, 6.5, .5])
  return out
}
const CURLS = buildCurls()

const CLOUD: [number, number, number][] = [
  [54, 324, 27], [88, 306, 32], [128, 296, 36], [168, 291, 38], [208, 297, 36], [246, 307, 32], [278, 324, 27],
  [66, 344, 26], [108, 346, 29], [160, 348, 31], [212, 346, 29], [254, 344, 26],
]

function Eye({ side, cx }: { side: 'L' | 'R'; cx: number }) {
  const mir = side === 'L'
  const white = 'M-15 1 C-11 -9 -3 -10.5 3 -10.5 C10 -10.5 14.5 -5.5 16 1.5 C11 9.5 3 10.5 -2 10.5 C-8 10.5 -13 7 -15 1Z'
  const hx = mir ? 3 : -3
  return (
    <g data-r={`eye${side}`} transform={`translate(${cx} 112)${mir ? ' scale(-1 1)' : ''}`}>
      <g clipPath="url(#ch-eyeclip)">
        <path d={white} fill="#fffaf5" />
        <g data-r={`iris${side}`}>
          <circle r="8.6" fill="url(#ch-iris)" />
          <circle r="8.6" fill="none" stroke="#2a150c" strokeWidth="1.1" opacity=".7" />
          <circle r="3.9" fill="#1b0d08" />
          <circle cx={hx} cy="-3.5" r="2.8" fill="#fff" />
          <circle cx={-hx} cy="3.4" r="1.3" fill="#fff" opacity=".85" />
        </g>
        <path d="M-17 -12 L18 -12 L18 -4.5 Q2 -7.5 -17 -3Z" fill="#3a2118" opacity=".2" />
      </g>
      <path d="M-16.5 1.5 C-12 -10.5 -3 -12.2 3 -12.2 C11 -12.2 16 -6 18 1" fill="none" stroke="#24120b" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M15.5 -5 L21.5 -8.6" fill="none" stroke="#24120b" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M-11 8.4 C-5 11.4 4 11.4 12 6.4" fill="none" stroke="#9a6650" strokeWidth="1.1" opacity=".6" strokeLinecap="round" />
    </g>
  )
}

function ArmDef({ side }: { side: 'L' | 'R' }) {
  return (
    <g id={`ch-arm${side}`}>
      <path className="arm-p" data-a={`${side}-upper`} />
      <path className="arm-p" data-a={`${side}-fore`} />
      <circle className="arm-p" data-a={`${side}-elbow`} r="11.4" />
      <g data-hand={side}>
        {FINGERS.map((d, i) => (
          <g key={i} data-f={i} className="hand-p">
            <rect className="s1 hand-p" x={-d.w / 2} y={-d.w / 2} width={d.l1 + d.w} height={d.w} rx={d.w / 2} />
            <g className="j"><rect className="s2 hand-p" x={-d.w / 2} y={-d.w / 2} width={d.l2 + d.w} height={d.w} rx={d.w / 2} /></g>
          </g>
        ))}
        <path className="hand-p" d="M0 -7 Q0 -10.5 6 -10.5 L19 -10 Q25.5 -9 25.5 -3.5 L25.5 5 Q24.5 10.5 18 10.5 L6 10.5 Q0 10.5 0 7Z" />
      </g>
    </g>
  )
}

function Arm({ side }: { side: 'L' | 'R' }) {
  return (
    <g>
      <g className="out-pass"><use href={`#ch-arm${side}`} /></g>
      <g className="fill-pass" fill={SKIN}><use href={`#ch-arm${side}`} /></g>
      <path data-a={`${side}-sleeve`} fill="url(#ch-shirt)" />
      <path data-a={`${side}-sleeveLine`} fill="none" stroke="#9aa5c2" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}

export function Character({ onRig }: { onRig: (rig: Rig | null) => void }) {
  useEffect(() => {
    const svg = document.querySelector<SVGSVGElement>('#ch-root')
    if (!svg) return
    const rig = createRig(svg)
    onRig(rig)
    return () => { rig.destroy(); onRig(null) }
  }, [onRig])

  return (
    <svg id="ch-root" className="guide-model" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ch-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9d6b8" /><stop offset=".7" stopColor="#f0bb94" /><stop offset="1" stopColor="#e3a47c" />
        </linearGradient>
        <linearGradient id="ch-shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".62" stopColor="#eceff7" /><stop offset="1" stopColor="#bcc5dc" />
        </linearGradient>
        <linearGradient id="ch-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3b2a" /><stop offset=".5" stopColor="#3a2418" /><stop offset="1" stopColor="#24150f" />
        </linearGradient>
        <radialGradient id="ch-iris" cx=".5" cy=".38" r=".7">
          <stop offset="0" stopColor="#c0814a" /><stop offset=".55" stopColor="#7a4426" /><stop offset="1" stopColor="#3e2013" />
        </radialGradient>
        <linearGradient id="ch-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbe3" /><stop offset=".45" stopColor="#ffe48a" /><stop offset="1" stopColor="#ffb93a" />
        </linearGradient>
        <clipPath id="ch-eyeclip"><path d="M-15 1 C-11 -9 -3 -10.5 3 -10.5 C10 -10.5 14.5 -5.5 16 1.5 C11 9.5 3 10.5 -2 10.5 C-8 10.5 -13 7 -15 1Z" /></clipPath>
        <clipPath id="ch-mouthclip"><path data-r="mouthClip" /></clipPath>
        <ArmDef side="L" />
        <ArmDef side="R" />
      </defs>

      {/* ground shadow cast onto nothing: soft glow under the cloud */}
      <ellipse cx="160" cy="372" rx="110" ry="9" fill="#2a3a2c" opacity=".1" />

      <g data-r="body">
        {/* hair mass behind the head */}
        <g data-r="hairBack">
          <path d="M108 112 C98 50 126 26 160 26 C194 26 222 50 212 112 L204 122 L116 122Z" fill={HAIR_DARK} />
        </g>

        {/* neck */}
        <path d="M141 140 L141 198 Q160 214 179 198 L179 140Z" fill={SKIN} stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
        <ellipse cx="160" cy="184" rx="27" ry="12" fill="#c98960" opacity=".42" />

        {/* torso */}
        <g data-r="shirt">
          <path d="M136 190 C116 194 94 200 82 222 C72 244 70 290 70 350 L250 350 C250 290 248 244 238 222 C226 200 204 194 184 190Z"
            fill="url(#ch-shirt)" stroke="#8e99b8" strokeWidth="2" strokeLinejoin="round" />
          <path d="M122 246 Q136 292 128 350 L152 350 Q150 296 140 246Z" fill="#8f9bbb" opacity=".2" />
          <path d="M204 252 Q192 296 198 350 L176 350 Q178 300 186 252Z" fill="#8f9bbb" opacity=".16" />
          <path d="M84 232 Q80 280 82 330" fill="none" stroke="#8f9bbb" strokeWidth="9" opacity=".16" strokeLinecap="round" />
          <path d="M138 189 Q160 218 182 189 Q160 202 138 189Z" fill="#dde2ee" />
          <path d="M137 190 Q160 216 183 190" fill="none" stroke="#8e99b8" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M139 192 Q160 214 181 192 Q160 207 139 192Z" fill={SKIN} />
        </g>

        {/* head */}
        <g data-r="head">
          {/* ears */}
          <path d="M113 100 Q100 98 101 114 Q102 128 114 128Z" fill="#eeb48c" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M207 100 Q220 98 219 114 Q218 128 206 128Z" fill="#eeb48c" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M108 108 Q105 114 109 121 M212 108 Q215 114 211 121" fill="none" stroke="#c98a66" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="213" cy="126" r="2.5" fill="#f2f2f5" stroke="#9aa0ad" strokeWidth=".9" />

          {/* face */}
          <path d="M112 106 C112 70 134 51 160 51 C186 51 208 70 208 106 C208 138 192 167 160 177 C128 167 112 138 112 106Z"
            fill="url(#ch-skin)" stroke={LINE} strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M200 110 C200 140 186 162 160 172 C186 168 205 148 208 110Z" fill="#d89a76" opacity=".28" />
          <path d="M118 74 Q160 94 202 74 L202 62 L118 62Z" fill="#8a5538" opacity=".2" />

          <g data-r="face">
            <ellipse data-r="blushL" cx="122" cy="137" rx="10" ry="5.6" fill="#ff7f77" opacity=".25" />
            <ellipse data-r="blushR" cx="198" cy="137" rx="10" ry="5.6" fill="#ff7f77" opacity=".25" />
            <Eye side="L" cx={136} />
            <Eye side="R" cx={184} />
            <path data-r="browL" d="M-13 1.5 Q-1 -4.5 15 -1.5" fill="none" stroke="#2c180f" strokeWidth="4.4" strokeLinecap="round" />
            <path data-r="browR" d="M-13 1.5 Q-1 -4.5 15 -1.5" fill="none" stroke="#2c180f" strokeWidth="4.4" strokeLinecap="round" />
            <path d="M158.5 127 Q160 132.5 165.5 131.5" fill="none" stroke="#c6845c" strokeWidth="1.8" strokeLinecap="round" />
            <path data-r="mouthFill" fill="#7a2d3a" />
            <g clipPath="url(#ch-mouthclip)"><ellipse data-r="tongue" cx="160" cy="154" rx="8" ry="5" fill="#e87c88" /></g>
            <path data-r="mouthTop" fill="none" stroke="#7a3a35" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* faded sides */}
          <path d="M112 110 C110 92 113 78 122 67 L129 72 C122 84 121 98 122 114Z" fill={HAIR_DARK} opacity=".78" />
          <path d="M208 110 C210 92 207 78 198 67 L191 72 C198 84 199 98 198 114Z" fill={HAIR_DARK} opacity=".78" />

          {/* curls */}
          <g strokeLinejoin="round">
            {CURLS.map(([cx, cy, r, w], i) => (
              <g key={i} data-curl data-w={w}>
                <circle cx={cx} cy={cy} r={r} fill="url(#ch-hair)" stroke="#1a0f0a" strokeWidth="1.4" />
                <path d={`M${cx - r * .5} ${cy + r * .05} A${r * .5} ${r * .5} 0 1 1 ${cx + r * .15} ${cy - r * .25}`}
                  fill="none" stroke="#a07a5c" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
              </g>
            ))}
          </g>
        </g>

        {/* arms sit above the head so a hand can rest at the chin */}
        <Arm side="L" />
        <Arm side="R" />
      </g>

      {/* the cloud */}
      <g data-r="cloud">
        <g stroke="#c9801a" strokeWidth="5.2" fill="#c9801a" strokeLinejoin="round">
          {CLOUD.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} data-puff data-r0={r} />)}
        </g>
        <g fill="url(#ch-cloud)">
          {CLOUD.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} data-puff data-r0={r} />)}
        </g>
        <g fill="none" stroke="#fffdf0" strokeWidth="3.4" strokeLinecap="round" opacity=".85">
          <path d="M76 300 Q84 292 96 292" /><path d="M146 282 Q158 274 172 276" /><path d="M222 288 Q232 284 242 290" />
        </g>
        <g fill="none" stroke="#d68c1c" strokeWidth="2.6" strokeLinecap="round" opacity=".8">
          <path d="M268 330 q14 -3 11 -13 q-3 -8 -11 -4" /><path d="M54 332 q-12 -2 -10 -11 q3 -7 10 -3" />
          <path d="M100 356 q16 6 34 0" /><path d="M196 356 q16 6 34 -2" />
        </g>
      </g>
    </svg>
  )
}
