import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /cv and /cv/ are a static page in public/cv. A static host serves it by itself;
// this makes the dev and preview servers do the same instead of answering with the app.
const cvPage = (req: { url?: string }, _res: unknown, next: () => void) => {
  const match = /^\/cv\/?(\?.*)?$/.exec(req.url ?? '')
  if (match) req.url = `/cv/index.html${match[1] ?? ''}`
  next()
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cv-page',
      configureServer(server) { server.middlewares.use(cvPage) },
      configurePreviewServer(server) { server.middlewares.use(cvPage) },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
