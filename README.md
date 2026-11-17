# Portfolio de Andrés Martínez Lorca

Portfolio profesional creado con React, TypeScript y Vite. Incluye experiencia profesional, proyectos con sus tecnologías, CV en español e inglés y una guía anime articulada en SVG. La ilustración, el código de animación y los iconos se incluyen en el repositorio.

El diseño se documenta en `PRODUCT.md`, `DESIGN.md` y `.impeccable/`. Las imágenes de la versión anterior se conservan en `assets/archive/previous-images/` y no se incluyen en la interfaz ni se copian al sitio generado. La fuente Bricolage Grotesque se sirve localmente; su licencia está en `public/fonts/OFL.txt`.

Vite genera un sitio estático en `dist`, listo para servir desde el alojamiento web.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

El comando de build genera HTML, CSS, JavaScript e imágenes en `dist/`. No hace falta ejecutar Node.js en el servidor para servir ese resultado.

## Publicación en Hostinger

Si el sitio está conectado a GitHub como aplicación Vite, configura la rama que publica el sitio, Node.js 22, npm, `npm run build` como comando de compilación y `dist` como directorio de salida. El push a esa rama activa el despliegue cuando está configurado el despliegue automático. La raíz del proyecto es la carpeta que contiene `package.json`.

En un alojamiento estático, compila el sitio y publica el contenido de `dist/` en `public_html/`. Clonar el código fuente por sí solo no ejecuta la compilación. El personaje se ejecuta en el navegador y no necesita variables de entorno, servidor de animación ni API externa.

## SEO y vista previa al compartir

- `index.html` lleva el título, la descripción, la URL canónica, las etiquetas Open Graph y Twitter y los datos estructurados (JSON-LD de persona, sitio y perfil). El dominio que usan es `https://andresmartinezlorca.com`: si cambia, hay que actualizarlo en `index.html`, `public/robots.txt`, `public/sitemap.xml` y `public/cv/index.html`.
- `npm run build` genera la página ya renderizada (`scripts/prerender.mjs`): el HTML que ve un buscador o una vista previa ya trae todo el contenido, sin ejecutar JavaScript. En desarrollo (`npm run dev`) sigue siendo una app normal.
- La imagen al compartir es `public/og-image.jpg` (1200 × 630). Se regenera abriendo `scripts/og-image.html` en un navegador y capturándolo a ese tamaño.
- `public/sitemap.xml` y `public/robots.txt` se publican con el resto. Al cambiar la página, actualiza `lastmod` en el sitemap.

## Página del CV

`/cv/` es una página estática (`public/cv/index.html`) con el visor de PDF del navegador, un selector Español / English (`/cv/?lang=en` enlaza directamente al inglés) y el botón de descarga. Los botones «CV» del portfolio abren primero un menú de idioma y llevan a esta página.

Para actualizar el CV, sustituye los dos PDF de `public/cv/` manteniendo sus nombres (`Andres_Martinez_Lorca_Full_Stack_ES.pdf` y `..._EN.pdf`). En un alojamiento estático la carpeta `cv/` de `dist/` ya sirve `/cv/` sin configuración extra.

## Personaje guía: elegir renderer

El guía puede dibujarse con **clips de vídeo anime** (por defecto), con **three.js** (3D toon) o con el **SVG** 2D más ligero. Se elige así (por orden de prioridad):

- URL: `http://localhost:5173/?guide=svg`, `?guide=three` o `?guide=video`
- Variable de entorno: `VITE_GUIDE_RENDERER=svg npm run dev` (o en un `.env`)
- Valor por defecto en `src/guideConfig.ts`

Si el navegador no soporta WebGL, la versión 3D cae al SVG. El código de three.js se carga bajo demanda, así que no pesa si usas otra versión.

### Clips de vídeo

Los clips están en `public/guide/`: WebM con transparencia (`idle` y `talk` en bucle, `wave`, `point` con su copia en espejo `-m`, `thumbs` y `laptop`), más imágenes WebP de cada gesto. Safari y quien tenga activado "reducir movimiento" ven las imágenes fijas en lugar del vídeo.

Para regenerarlos desde vídeos de fondo verde (por ejemplo, de Gemini/Veo), cada uno con un nombre:

```bash
python scripts/build-guide-clips.py public/guide ruta/a/ffmpeg a1=video1.mp4 a2=video2.mp4 a3=video3.mp4
```

Qué tramo de qué vídeo forma cada clip (en fotogramas) se ajusta en `CLIPS` y `STILLS` dentro del script.
