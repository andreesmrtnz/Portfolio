/// <reference types="vite/client" />

declare module '*.PNG' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_GUIDE_RENDERER?: 'video' | 'three' | 'svg'
}
