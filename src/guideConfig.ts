/**
 * Which renderer draws the guide character.
 *
 *  - 'video': anime clips of Andrés (transparent WebM in public/guide). Default.
 *  - 'three': 3D toon character built in code (three.js).
 *  - 'svg'  : the lighter 2D SVG puppet.
 *
 * Pick one, in order of priority:
 *   1. URL:      http://localhost:5173/?guide=svg   (or ?guide=three, ?guide=video)
 *   2. Env var:  VITE_GUIDE_RENDERER=svg npm run dev   (or in a .env file)
 *   3. Default below.
 * The 3D version falls back to 'svg' without WebGL.
 */
export type GuideRenderer = 'video' | 'three' | 'svg'

const DEFAULT: GuideRenderer = 'video'

function pick(value: unknown): GuideRenderer | null {
  return value === 'svg' || value === 'three' || value === 'video' ? value : null
}

const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search)

export const GUIDE_RENDERER: GuideRenderer =
  pick(params.get('guide'))
  ?? pick(import.meta.env.VITE_GUIDE_RENDERER)
  ?? DEFAULT
