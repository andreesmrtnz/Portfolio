import { useEffect, useRef } from 'react'
import type { Rig } from './characterRig'

/** Canvas host for the three.js character. The 3D code is loaded on demand. */
export function ThreeCharacter({ onRig, onFail }: { onRig: (rig: Rig | null) => void; onFail: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const callbacks = useRef({ onRig, onFail })
  callbacks.current = { onRig, onFail }

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let rig: Rig | null = null
    let cancelled = false
    import('./threeRig').then(({ createThreeRig }) => {
      if (cancelled) return
      rig = createThreeRig(el)
      if (!rig) { callbacks.current.onFail(); return }
      callbacks.current.onRig(rig)
    }).catch(() => { if (!cancelled) callbacks.current.onFail() })
    return () => {
      cancelled = true
      rig?.destroy()
      callbacks.current.onRig(null)
    }
  }, [])

  return <canvas ref={canvas} className="guide-model guide-canvas" aria-hidden="true" />
}
