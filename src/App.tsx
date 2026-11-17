import { useCallback, useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUp, BellRing, BriefcaseBusiness, Camera, ChevronLeft, ChevronRight, CloudSun, Code2, Cpu, Database, ExternalLink,
  FileText, GraduationCap, LayoutGrid, Mail, MapPin, MessageSquare, Monitor, Scale, Sprout,
} from 'lucide-react'
import { siGithub } from 'simple-icons'
import { CharacterGuide } from './CharacterGuide'
import { TechIcon } from './TechIcon'
import portrait96 from '../assets/images/yo-96.webp'
import portrait480 from '../assets/images/yo-480.webp'
import portrait900 from '../assets/images/yo-900.webp'
import upangoLogo from '../assets/images/logos/upango.svg'
import odinsLogo from '../assets/images/logos/odins.webp'
import cosaNostraShot from '../assets/images/projects/cosanostra.webp'
import cosaNostraPhone from '../assets/images/projects/cosanostra-movil.webp'
import giftsShot from '../assets/images/projects/regalos.webp'
import giftsPhone from '../assets/images/projects/regalos-movil.webp'
import reyShot from '../assets/images/projects/reydelmueble.webp'
import reyPhone from '../assets/images/projects/reydelmueble-movil.webp'
import swissShot from '../assets/images/projects/lostinswiss.webp'
import swissPhone from '../assets/images/projects/lostinswiss-movil.webp'
import capitalsShot from '../assets/images/projects/capitales.webp'
import capitalsPhone from '../assets/images/projects/capitales-movil.webp'
import mmaShot from '../assets/images/projects/contactmurcia.webp'
import danceShot from '../assets/images/projects/academia.webp'

const linkedin = 'https://www.linkedin.com/in/andres-martinez-lorca-b781a935b/'
const github = 'https://github.com/andreesmrtnz'
const email = 'mailto:andresml9602@gmail.com'
const linkedinPath = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"

const chapters = [
  { id: 'inicio', name: 'Inicio' },
  { id: 'experiencia', name: 'Experiencia' },
  { id: 'proyectos', name: 'Proyectos' },
  { id: 'laboratorio', name: 'Proyectos propios', shortName: 'Propios' },
  { id: 'contacto', name: 'Contacto' },
] as const

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg className={down ? 'arrow arrow-down' : 'arrow'} viewBox="0 0 24 24"
      width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  )
}

/** The CV button asks which language first, then opens the /cv page (viewer + download). Closes with Escape, a click outside or a choice. */
function CvMenu({ className, label, up = false }: { className: string; label: string; up?: boolean }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      root.current?.querySelector('button')?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  return (
    <div className="cv-menu" ref={root}>
      <button type="button" className={className} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {label} <FileText size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul className={up ? 'cv-options is-up' : 'cv-options'}>
          <li><a href="/cv/" onClick={() => setOpen(false)}>Español<span>Ver · PDF</span></a></li>
          <li><a href="/cv/?lang=en" onClick={() => setOpen(false)}>English<span>Ver · PDF</span></a></li>
        </ul>
      )}
    </div>
  )
}

function Tech({ items }: { items: string[] }) {
  return <ul className="tech-list" aria-label="Tecnologías">{items.map(item => <li key={item}><TechIcon name={item} />{item}</li>)}</ul>
}

/** A website capture inside a browser frame, with an optional phone capture overlapping its corner. */
function Shot({ src, phone, host, name }: { src: string; phone?: string; host: string; name: string }) {
  return (
    <figure className="shot">
      <div className="shot-window">
        <div className="shot-bar" aria-hidden="true"><i /><i /><i /><span>{host}</span></div>
        <img src={src} alt={`Captura de la web de ${name}`} width="1200" height="750" loading="lazy" decoding="async" />
      </div>
      {phone && <img className="shot-phone" src={phone} alt={`Versión móvil de ${name}`} width="300" height="649" loading="lazy" decoding="async" />}
    </figure>
  )
}

interface FlowStep { icon: LucideIcon; title: string; note: string }

/** A process drawn in HTML: what goes in, what each part does, what comes out. */
function Flow({ steps, caption, logo }: { steps: FlowStep[]; caption: string; logo?: string }) {
  return (
    <figure className="flow">
      <ol>
        {steps.map(({ icon: Icon, title, note }) => (
          <li key={title}>
            <span className="flow-icon"><Icon aria-hidden="true" /></span>
            <span><strong>{title}</strong><small>{note}</small></span>
          </li>
        ))}
      </ol>
      <figcaption>
        {logo && <img src={logo} alt="" width="48" height="21" />}
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}

const odinsSteps: FlowStep[] = [
  { icon: Camera, title: 'Foto del cultivo', note: 'La entrada del sistema' },
  { icon: Cpu, title: 'Modelo de visión por computador', note: 'PyTorch · ResNet34' },
  { icon: Sprout, title: 'Posible enfermedad', note: 'Identificada por el modelo' },
  { icon: CloudSun, title: 'Sugerencia de tratamiento', note: 'Con datos meteorológicos' },
]

interface Project {
  id: string; name: string; context: string; lead: string; contribution: string; tech: string[]; href?: string; repo?: string
  visual: { kind: 'shot'; src: string; phone?: string; host: string } | { kind: 'flow' }
}

const projects: Project[] = [
  {
    id: 'la-cosa-nostra', name: 'La Cosa Nostra · El Raal', context: 'Freelance · Pedidos online',
    lead: 'Un canal de venta que sigue funcionando cuando se satura el teléfono.',
    contribution: 'Construí la web desde cero con carrito, pagos con Stripe y un panel para gestionar el catálogo y subir fotos. La web genera ventas semanales y el negocio confirmó que el canal es rentable.',
    tech: ['React', 'TypeScript', 'Node.js', 'Supabase', 'Stripe'],
    href: 'https://www.pizzeriacosanostraelraal.com/',
    visual: { kind: 'shot', src: cosaNostraShot, phone: cosaNostraPhone, host: 'pizzeriacosanostraelraal.com' },
  },
  {
    id: 'regalos', name: 'Regalos Ana Fátima', context: 'Freelance · E-commerce',
    lead: 'Del control de stock al cobro con Redsys.',
    contribution: 'Construí la tienda de regalos personalizados desde cero. Implementé el carrito, cuentas con verificación por correo, pagos con Redsys y un panel para gestionar catálogo, stock y pedidos.',
    tech: ['PHP', 'MySQL', 'JavaScript', 'Tailwind CSS', 'Redsys'],
    href: 'https://regalosanafatima.com/',
    visual: { kind: 'shot', src: giftsShot, phone: giftsPhone, host: 'regalosanafatima.com' },
  },
  {
    id: 'rey-del-mueble', name: 'El Rey del Mueble', context: 'Freelance · Shopify · República Dominicana',
    lead: 'Una tienda completa con un espacio para profesionales.',
    contribution: 'Diseñé y desarrollé la web completa. Implementé favoritos, un chat con IA y un perfil y una página para profesionales. Conecté las APIs de los proveedores para importar productos y generé imágenes para el catálogo.',
    tech: ['Shopify', 'HTML', 'CSS', 'JavaScript', 'APIs de proveedores', 'IA aplicada'],
    href: 'https://elreydelmueble.com.do/',
    visual: { kind: 'shot', src: reyShot, phone: reyPhone, host: 'elreydelmueble.com.do' },
  },
  {
    id: 'lostinswiss', name: 'Lostinswiss · SwissUp', context: 'Cliente · Programa para trabajar en Suiza',
    lead: 'La web de un programa para encontrar trabajo en Suiza.',
    contribution: 'Rediseñé SwissUp, que atraía visitas desde redes pero vendía poco. Hice más clara la oferta y facilité el acceso a los cursos, al asistente de IA y al generador de CV suizo. La creadora confirmó que subieron las ventas.',
    tech: ['HTML', 'CSS', 'JavaScript'],
    href: 'https://www.lostinswiss.com/',
    visual: { kind: 'shot', src: swissShot, phone: swissPhone, host: 'lostinswiss.com' },
  },
  {
    id: 'capitales', name: 'The World Capitals', context: 'Proyecto propio · Multijugador en tiempo real',
    lead: 'Una partida de capitales en la que juega toda la oficina a la vez.',
    contribution: 'Lo creé porque en la oficina aprendíamos una capital nueva cada día. Al terminar la jornada jugábamos salas competitivas con más de diez personas a la vez: todos reciben las mismas preguntas y gana quien suma más puntos por velocidad, aciertos y rachas. Las salas funcionan con funciones serverless y Redis, y cada puntuación se guarda por jugador para que dos envíos simultáneos no se pisen.',
    tech: ['React', 'TypeScript', 'Supabase', 'Redis', 'Vercel'],
    href: 'https://theworldcapitals.com/',
    visual: { kind: 'shot', src: capitalsShot, phone: capitalsPhone, host: 'theworldcapitals.com' },
  },
  {
    id: 'odins', name: 'OdinS', context: 'Prácticas · Visión por computador',
    lead: 'De una foto del cultivo a una sugerencia de tratamiento.',
    contribution: 'Creé un modelo de visión por computador con PyTorch y ResNet34 para detectar enfermedades en cultivos. Implementé la API con FastAPI, integré datos meteorológicos para sugerir tratamientos y desplegué el sistema con Docker en Linux.',
    tech: ['Python', 'PyTorch', 'ResNet34', 'FastAPI', 'Docker', 'Linux'],
    visual: { kind: 'flow' },
  },
]

interface Personal {
  id: string; name: string; type: string; lead: string; contribution: string; tech: string[]; href?: string
  steps: FlowStep[]; caption: string
}

const personal: Personal[] = [
  {
    id: 'inmobiliaria', name: 'Plataforma inmobiliaria privada', type: 'Backend y automatización',
    lead: 'Oportunidades dispersas en WhatsApp, reunidas y comparables.',
    contribution: 'Construí el backend con .NET y MariaDB para centralizar oportunidades dispersas en WhatsApp y comparar su rentabilidad. Programé la publicación y los avisos en Node.js con reintentos independientes.',
    tech: ['.NET', 'MariaDB', 'Node.js'],
    steps: [
      { icon: MessageSquare, title: 'Oportunidades en WhatsApp', note: 'Dispersas en conversaciones' },
      { icon: Database, title: 'Backend con .NET y MariaDB', note: 'Las centraliza' },
      { icon: Scale, title: 'Rentabilidad estimada', note: 'Para poder compararlas' },
      { icon: BellRing, title: 'Publicación y aviso', note: 'Node.js, con reintentos independientes' },
    ],
    caption: 'Demo disponible bajo petición',
  },
  {
    id: 'jarvis', name: 'Jarvis', type: 'Asistente · Prototipo',
    lead: 'Preguntarle a Azure DevOps como a una persona.',
    contribution: 'Conecté el asistente a Azure DevOps para consultar tareas y sprints con preguntas en lenguaje natural.',
    tech: ['Azure DevOps'],
    steps: [
      { icon: MessageSquare, title: 'Pregunta en lenguaje natural', note: 'Sobre tareas y sprints' },
      { icon: Cpu, title: 'Asistente Jarvis', note: 'Conectado a Azure DevOps' },
      { icon: Database, title: 'Tareas y sprints', note: 'Los datos del equipo' },
    ],
    caption: 'Prototipo',
  },
  {
    id: 'facemood', name: 'FaceMood AI', type: 'Visión por computador · Prototipo',
    lead: 'Ver en directo lo que estima un modelo de visión.',
    contribution: 'Construí una interfaz web para visualizar en directo las estimaciones de un modelo de visión por computador.',
    tech: ['Python', 'OpenCV', 'Streamlit'],
    href: `${github}/facial-emotions`,
    steps: [
      { icon: Camera, title: 'Imagen de entrada', note: 'Procesada con OpenCV' },
      { icon: Cpu, title: 'Modelo de visión por computador', note: 'Hace las estimaciones' },
      { icon: Monitor, title: 'Interfaz web en directo', note: 'Streamlit' },
    ],
    caption: 'Prototipo en Python',
  },
]

const moreWork = [
  { name: 'Contact Murcia MMA', href: 'https://contactmurcia.com/', host: 'contactmurcia.com', src: mmaShot, contribution: 'Desarrollé una web adaptable para presentar el club y sus disciplinas.' },
  { name: 'Academia Lucía Moreno', href: 'https://academialuciamoreno.com/', host: 'academialuciamoreno.com', src: danceShot, contribution: 'Desarrollé la web corporativa, el SEO local y la configuración de despliegue.' },
]

// every technology here already appears in a project, a role or the CV
const stack = [
  { name: 'Frontend', items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS'] },
  { name: 'Backend y APIs', items: ['TypeScript', 'Node.js', '.NET', 'PHP', 'Python', 'FastAPI', 'REST', 'GraphQL'] },
  { name: 'Datos', items: ['MySQL', 'MariaDB', 'Supabase', 'Redis'] },
  { name: 'E-commerce y pagos', items: ['Shopify', 'Liquid', 'Stripe', 'Redsys'] },
  { name: 'IA y visión', items: ['PyTorch', 'ResNet34', 'OpenCV', 'Streamlit'] },
  { name: 'IA en el desarrollo', items: ['Claude', 'ChatGPT'] },
  { name: 'Infraestructura', items: ['Docker', 'Linux', 'Git', 'Vercel', 'Azure DevOps'] },
]

interface Point { title: string; text: string; id?: string; href?: string }

// The structure and the wording follow the CV (ES), so the portfolio and the CV tell the same story.
const upangoPoints: Point[] = [
  { title: 'Sincronización de catálogos', text: 'Retomé y amplié una aplicación que permite poblar una tienda Shopify vacía o mantenerla sincronizada con otra. Desde un panel, el administrador elige qué productos y campos copiar y cuándo ejecutar el proceso. La tienda principal centraliza los cambios de imágenes, variantes, precios, estados y metacampos.' },
  { title: 'Envío desde el carrito', text: 'Implementé el cálculo de tarifas en el backend y su selección en el carrito. El sistema recalcula los portes si cambia la dirección o el pedido, conserva la opción si sigue disponible y valida la selección en el checkout.' },
  { title: 'Venta mayorista y minorista en Shopify Basic', text: 'Implementé catálogos, menús y páginas diferenciados en una misma tienda según el cliente. El negocio puede gestionar esas configuraciones y dar de alta clientes mayoristas.' },
  { title: 'Campañas B2B', text: 'Desarrollé una aplicación en producción para crear campañas con productos aún sin publicar. Integré Sales Layer y un editor visual para ordenar productos y marcar prendas en imágenes. Habilité la consulta de valoraciones con Shopify Sidekick.' },
  { id: 'rendimiento', title: 'Rendimiento', text: 'Reduje la búsqueda de productos en pedidos abiertos de unos 10 s a unos 100 ms utilizando datos sincronizados localmente. La carga de la primera página de facturación pasó de unos 30 s a unos 500 ms al paginar los resultados.' },
  { title: 'Dirección de proyecto', text: 'Dirigí un proyecto con un equipo de tres personas. Definí requisitos, estimé y repartí tareas, evalué mejoras y revisé código, interfaces y funcionalidades. El equipo creó un panel con datos de Microsoft Fabric y un asistente web para que cada comercial consulte los carritos abandonados de sus empresas asignadas.' },
]

const freelancePoints: Point[] = [
  { title: 'La Cosa Nostra', href: '#la-cosa-nostra', text: 'Creé desde cero un canal rentable de pedidos online que genera ventas semanales y permite comprar cuando se satura la línea telefónica. Implementé carrito, pagos con Stripe y un panel de catálogo con imágenes usando React, TypeScript, Node.js y Supabase.' },
  { title: 'El Rey del Mueble', href: '#rey-del-mueble', text: 'Construí desde cero una tienda Shopify para un negocio de muebles. Integré las APIs de sus proveedores para importar el catálogo y añadí un área para profesionales y un asistente de catálogo con IA.' },
  { title: 'Lostinswiss', href: '#lostinswiss', text: 'Rediseñé SwissUp, que atraía visitas desde redes pero vendía poco. Hice más clara la oferta y facilité el acceso a los cursos, al asistente de IA y al generador de CV suizo. La creadora confirmó que subieron las ventas.' },
  { title: 'Regalos Ana Fátima', href: '#regalos', text: 'Construí la tienda completa con PHP y MySQL. Implementé carrito, verificación de cuentas por correo, pagos con Redsys y un panel de catálogo, stock y pedidos.' },
]

function Points({ items }: { items: Point[] }) {
  return (
    <ul className="job-points">
      {items.map(point => (
        <li key={point.title} id={point.id}>
          <strong>{point.href ? <a href={point.href}>{point.title}</a> : point.title}</strong>
          <span>{point.text}</span>
        </li>
      ))}
    </ul>
  )
}

/** Experience laid out like the CV: newest first, one entry per job, joined by a vertical line. */
function Experience() {
  return (
    <section id="experiencia" className="experience section">
      <div className="shell">
        <div className="section-heading">
          <h2><BriefcaseBusiness className="heading-icon" aria-hidden="true" />Experiencia profesional</h2>
          <p>En Upango convierto peticiones de clientes en aplicaciones e integraciones. Defino requisitos, estimo el trabajo y llevo la solución a producción.</p>
        </div>

        <div className="job-list">
          <article className="job is-current" id="upango">
            <img className="job-logo" src={upangoLogo} alt="" width="190" height="29" />
            <div className="job-head">
              <div>
                <h3>Upango Consulting</h3>
                <p className="job-role">Desarrollador full-stack</p>
              </div>
              <p className="job-dates">Sep. 2025 — actualidad</p>
            </div>
            <p className="job-summary">Desarrollo tiendas online y aplicaciones personalizadas sobre Shopify para clientes. Creo temas con Liquid, HTML, CSS y JavaScript. Para las aplicaciones uso React, backends en Node.js con TypeScript y .NET, integraciones por API y despliegues en contenedores Docker. Desde mi incorporación, uso Claude y ChatGPT para agilizar el desarrollo, automatizar procesos y encontrar mejoras de rendimiento.</p>
            <Tech items={['Shopify', 'Liquid', 'React', 'TypeScript', 'Node.js', '.NET', 'Docker']} />
            <Points items={upangoPoints} />
          </article>

          <article className="job" id="odins-experiencia">
            <img className="job-logo" src={odinsLogo} alt="" width="480" height="210" />
            <div className="job-head">
              <div>
                <h3>OdinS</h3>
                <p className="job-role">Machine Learning Researcher en prácticas</p>
              </div>
              <p className="job-dates">Jun. — jul. 2025</p>
            </div>
            <p className="job-summary">Creé un modelo de visión por computador con PyTorch y ResNet34 para detectar enfermedades de cultivos. Desplegué la API en Linux con FastAPI y Docker e integré datos del clima para sugerir tratamientos. <a className="inline-link" href="#odins">Ver el caso</a></p>
          </article>

          <article className="job" id="freelance">
            <span className="job-mark"><Code2 aria-hidden="true" /></span>
            <div className="job-head">
              <div>
                <h3>Freelance</h3>
                <p className="job-role">Desarrollador full-stack</p>
              </div>
              <p className="job-dates">Ene. 2025 — actualidad</p>
            </div>
            <Points items={freelancePoints} />
          </article>
        </div>
      </div>
    </section>
  )
}

/** One slide per own project, with arrows, dots and the keyboard. Native scroll-snap does the movement. */
function PersonalSlider() {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const count = personal.length

  // distance between two slides: their width plus the gap between them
  const step = () => {
    const slides = track.current?.children
    return slides && slides.length > 1 ? (slides[1] as HTMLElement).offsetLeft - (slides[0] as HTMLElement).offsetLeft : track.current?.clientWidth || 1
  }

  const goTo = useCallback((next: number) => {
    const el = track.current
    if (!el) return
    const target = (next + count) % count
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const slides = el.children
    const distance = slides.length > 1 ? (slides[1] as HTMLElement).offsetLeft - (slides[0] as HTMLElement).offsetLeft : el.clientWidth
    el.scrollTo({ left: target * distance, behavior: calm ? 'auto' : 'smooth' })
    setIndex(target)
  }, [count])

  const onScroll = () => {
    const el = track.current
    if (el) setIndex(Math.round(el.scrollLeft / step()))
  }

  return (
    <div className="slider" role="region" aria-roledescription="carousel" aria-label="Proyectos propios">
      <div className="slider-track" ref={track} onScroll={onScroll} tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index + 1) }
          if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index - 1) }
        }}>
        {personal.map((project, i) => (
          <div className="slide" id={project.id} key={project.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} de ${count}`}>
            <div className="case-copy">
              <h3>{project.name}</h3>
              <p className="context">{project.type}</p>
              <p className="case-lead">{project.lead}</p>
              <p>{project.contribution}</p>
              <Tech items={project.tech} />
              {project.href && <div className="case-links"><a className="text-link" href={project.href} target="_blank" rel="noreferrer">Ver repositorio <Arrow /></a></div>}
            </div>
            <Flow steps={project.steps} caption={project.caption} />
          </div>
        ))}
      </div>
      <div className="slider-controls">
        <div className="slider-dots">
          {personal.map((project, i) => (
            <button type="button" key={project.id} aria-label={`Ver ${project.name}`} aria-current={i === index ? 'true' : undefined} onClick={() => goTo(i)} />
          ))}
        </div>
        <span className="slider-count" aria-live="polite">{index + 1} / {count}</span>
        <div className="slider-arrows">
          <button type="button" onClick={() => goTo(index - 1)} aria-label="Proyecto anterior"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={() => goTo(index + 1)} aria-label="Proyecto siguiente"><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
}

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/** The degree as a card that tilts toward the pointer, plus the language levels on the CEFR scale. */
function Education() {
  const card = useRef<HTMLDivElement>(null)
  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = card.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (event.clientX - r.left) / r.width - .5
    const y = (event.clientY - r.top) / r.height - .5
    el.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 11).toFixed(2)}deg`)
    el.style.setProperty('--gx', `${((x + .5) * 100).toFixed(1)}%`)
    el.style.setProperty('--gy', `${((y + .5) * 100).toFixed(1)}%`)
  }
  const rest = () => {
    const el = card.current
    if (!el) return
    ;['--rx', '--ry'].forEach(k => el.style.setProperty(k, '0deg'))
    el.style.setProperty('--gx', '50%')
    el.style.setProperty('--gy', '30%')
  }
  const years = [2022, 2023, 2024, 2025, 2026]
  return (
    <article className="education">
      <h3>Formación</h3>
      <div className="diploma" ref={card} onPointerMove={tilt} onPointerLeave={rest}>
        <GraduationCap className="diploma-mark" aria-hidden="true" />
        <p className="diploma-school">Universidad de Murcia</p>
        <p className="degree">Grado en Ingeniería Informática</p>
        <ol className="diploma-years" aria-label="Años de estudio">
          {years.map((year, i) => <li key={year} className={i === 0 || i === years.length - 1 ? 'is-edge' : undefined}>{year}</li>)}
        </ol>
      </div>
      <div className="languages">
        <h3>Idiomas</h3>
        <div className="language">
          <span className="language-name">Español</span>
          <span className="language-bar native" role="img" aria-label="Nativo"><i /></span>
          <span className="language-level">Nativo</span>
        </div>
        <div className="language">
          <span className="language-name">Inglés</span>
          <span className="language-bar" role="img" aria-label="Nivel C1 de seis">
            {CEFR.map((level, i) => <i key={level} className={i <= 4 ? 'on' : undefined} title={level}><b>{level}</b></i>)}
          </span>
          <span className="language-level">C1</span>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [chapter, setChapter] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const marker = window.innerHeight * .52
      let current = 0
      chapters.forEach((item, index) => {
        if ((document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity) <= marker) current = index
      })
      if (window.scrollY > 0 && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 3) {
        current = chapters.length - 1
      }
      setChapter(current)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const initialSection = document.getElementById(window.location.hash.slice(1))
    initialSection?.scrollIntoView({ behavior: 'instant' })
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="identity" href="#inicio" aria-label="Andrés Martínez Lorca, inicio">
            <img className="identity-photo" src={portrait96} alt="" width="34" height="34" />
            <span>Andrés Martínez</span>
          </a>
          <nav aria-label="Navegación principal">
            {chapters.slice(1).map((item, index) => (
              <a key={item.id} href={`#${item.id}`}
                aria-current={chapter === index + 1 ? 'location' : undefined}>
                {'shortName' in item ? (
                  <><span className="nav-full-label">{item.name}</span><span className="nav-short-label" aria-hidden="true">{item.shortName}</span></>
                ) : item.name}
              </a>
            ))}
          </nav>
          <CvMenu className="header-cv" label="CV" />
        </div>
      </header>

      <main id="contenido">
        <section id="inicio" className="hero">
          <div className="shell hero-layout">
            <div className="hero-copy">
              <h1>Andrés Martínez<span>Ingeniero de software full-stack</span></h1>
              <p>Desarrollo productos web e integraciones con React, TypeScript, Node.js y .NET. Trabajo con e-commerce, automatización e IA aplicada.</p>
              <p className="hero-location"><MapPin size={15} aria-hidden="true" /> Murcia, España <span>·</span> Experiencia desde 2025</p>
              <div className="hero-actions">
                <a className="button" href="#proyectos">Ver casos <Arrow down /></a>
                <CvMenu className="text-link" label="Ver CV" />
              </div>
            </div>
            <figure className="profile-photo">
              <img src={portrait900} srcSet={`${portrait480} 480w, ${portrait900} 900w`} sizes="(max-width: 760px) 100vw, 405px" alt="Andrés Martínez Lorca" width="900" height="900" fetchPriority="high" />
            </figure>
          </div>
        </section>

        <Experience />

        <section id="proyectos" className="section cases">
          <div className="shell">
            <div className="section-heading"><h2><LayoutGrid className="heading-icon" aria-hidden="true" />Proyectos destacados</h2></div>
            {projects.map((project, index) => (
              <article className={index % 2 ? 'case is-reverse' : 'case'} id={project.id} key={project.id}>
                <div className="case-copy">
                  <h3>{project.name}</h3>
                  <p className="context">{project.context}</p>
                  <p className="case-lead">{project.lead}</p>
                  <p>{project.contribution}</p>
                  {project.tech.length > 0 && <Tech items={project.tech} />}
                  <div className="case-links">
                    {project.href && <a className="text-link" href={project.href} target="_blank" rel="noreferrer">Visitar la web <Arrow /></a>}
                    {project.repo && <a className="text-link" href={project.repo} target="_blank" rel="noreferrer">Ver el código <Arrow /></a>}
                  </div>
                </div>
                {project.visual.kind === 'shot'
                  ? <Shot src={project.visual.src} phone={project.visual.phone} host={project.visual.host} name={project.name} />
                  : <Flow steps={odinsSteps} caption="Prácticas en OdinS · API con FastAPI, desplegada con Docker en Linux" logo={odinsLogo} />}
              </article>
            ))}

            <div className="more-work" id="clientes">
              <h3>Más proyectos para clientes</h3>
              <div className="more-grid">
                {moreWork.map(project => (
                  <a href={project.href} target="_blank" rel="noreferrer" key={project.name}>
                    <Shot src={project.src} host={project.host} name={project.name} />
                    <span className="more-text"><strong>{project.name}</strong><span>{project.contribution}</span></span>
                    <Arrow />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="laboratorio" className="section personal">
          <div className="shell">
            <div className="section-heading"><h2><Code2 className="heading-icon" aria-hidden="true" />Proyectos propios</h2></div>
            <PersonalSlider />
          </div>
        </section>

        <section id="formacion" className="section skills">
          <div className="shell">
            <div className="section-heading"><h2><GraduationCap className="heading-icon" aria-hidden="true" />Formación y tecnologías</h2></div>
            <div className="skills-layout">
              <Education />
              <div className="stack" id="tecnologias">
                {stack.map(group => (
                  <div className="stack-row" key={group.name}>
                    <h3>{group.name}</h3>
                    <Tech items={group.items} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contacto" className="footer">
        <div className="shell">
          <div className="footer-title"><h2>Hablemos.</h2><a className="text-link" href={email}><Mail size={19} aria-hidden="true" /> andresml9602@gmail.com</a></div>
          <div className="footer-links">
            <a href={linkedin} target="_blank" rel="noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={linkedinPath} /></svg> LinkedIn <ExternalLink size={15} aria-hidden="true" /></a>
            <a href={github} target="_blank" rel="noreferrer"> <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={siGithub.path} /></svg> GitHub</a>
            <CvMenu className="footer-cv" label="CV" up />
            <a href="#inicio">Volver al inicio <ArrowUp size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </footer>
      <CharacterGuide />
    </>
  )
}

export default App
