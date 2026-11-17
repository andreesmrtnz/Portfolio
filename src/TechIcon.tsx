import { Bot, Boxes, Braces, Cable, Database, Droplets, Layers3, ShoppingBag, Sparkles } from 'lucide-react'
import {
  siClaude, siCss, siDocker, siDotnet, siFastapi, siGit, siGraphql, siHtml5, siJavascript, siLinux,
  siMariadb, siMysql, siNodedotjs, siOpencv, siPhp, siPython, siPytorch, siReact, siRedis,
  siShopify, siStreamlit, siStripe, siSupabase, siTailwindcss, siTypescript, siVercel,
} from 'simple-icons'

const brands: Record<string, { path: string; hex: string }> = {
  React: siReact, TypeScript: siTypescript, 'Node.js': siNodedotjs, '.NET': siDotnet,
  Docker: siDocker, Shopify: siShopify, PHP: siPhp, MySQL: siMysql, JavaScript: siJavascript,
  'Tailwind CSS': siTailwindcss, Python: siPython, PyTorch: siPytorch, FastAPI: siFastapi,
  Linux: siLinux, MariaDB: siMariadb, OpenCV: siOpencv, Streamlit: siStreamlit,
  HTML: siHtml5, CSS: siCss, GraphQL: siGraphql, Git: siGit, Supabase: siSupabase, Stripe: siStripe,
  Redis: siRedis, Vercel: siVercel, Claude: siClaude,
}
const symbols = {
  Liquid: Droplets, Redsys: ShoppingBag, 'APIs de proveedores': Cable, 'IA aplicada': Sparkles,
  ChatGPT: Bot, ResNet34: Layers3, 'Azure DevOps': Boxes, REST: Braces, 'MySQL/MariaDB': Database,
}

export function TechIcon({ name }: { name: string }) {
  const brand = brands[name]
  if (brand) {
    return <svg className="tech-icon" viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
      <path fill={`#${brand.hex}`} d={brand.path} />
    </svg>
  }
  const Symbol = symbols[name as keyof typeof symbols] ?? Braces
  return <Symbol className="tech-icon" size={15} strokeWidth={1.7} aria-hidden="true" />
}
