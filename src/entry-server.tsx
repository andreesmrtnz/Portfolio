import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

/** Renders the page to HTML at build time (see scripts/prerender.mjs), so crawlers and link previews get the content without running any JavaScript. */
export function render() {
  return renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
