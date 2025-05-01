# Portafolio Espacial de Andrés Martínez

Este es un portafolio web con temática espacial diseñado para Andrés Martínez, ingeniero informático. Combina un diseño futurista, animaciones de luces, un fondo estelar dinámico y efectos interactivos para destacar tus proyectos de manera épica.

## Características
- **Tema Espacial**: Fondo con estrellas animadas, gradientes cósmicos y efectos de luz.
- **Animaciones Avanzadas**:
  - Fondo de canvas con estrellas en movimiento.
  - Efectos de entrada en la sección hero con GSAP (texto y botones).
  - Animaciones de scroll para secciones, con elementos que "flotan" al aparecer.
  - Texto dinámico con Typed.js en la sección hero, con un estilo sci-fi.
  - Tarjetas de proyectos con efectos de luz y hover galácticos.
  - Iconos de contacto con destellos al interactuar.
- **Interactividad**:
  - Botones con efecto de brillo radial al pasar el ratón.
  - Navegación suave con desplazamiento fluido.
  - Tarjetas de proyectos con animaciones de elevación y sombras luminosas.
- **Tecnologías**:
  - HTML, CSS (Tailwind CSS), JavaScript.
  - GSAP para animaciones avanzadas.
  - Typed.js para texto dinámico.
  - Canvas para fondo estelar.
  - Fuente Orbitron para un look futurista.

## Estructura del Proyecto
- `index.html`: Archivo principal con HTML, estilos, scripts y animaciones.
- Secciones incluidas:
  - **Hero**: Presentación con texto animado y un botón con efecto de brillo.
  - **Sobre mí**: Sección con imagen y texto que emergen desde los lados, con un estilo cósmico.
  - **Proyectos**: Galería de tarjetas con efectos de luz y animaciones de entrada.
  - **Contacto**: Iconos grandes con animaciones de destello.
  - **Footer**: Pie de página con un mensaje temático.

## Cómo Personalizar
1. **Sección Hero**:
   - Edita las frases en el script de Typed.js (`strings: [...]`) para reflejar tus roles o habilidades.
   - Cambia el gradiente de fondo en `#home` si prefieres otros colores (ej. `bg-gradient-to-br from-purple-800 to-blue-900`).

2. **Sobre mí**:
   - Actualiza el texto en `<section id="about">` con tu experiencia, habilidades y hobbies.
   - Reemplaza la imagen de placeholder (`https://via.placeholder.com/500`) con una foto tuya.

3. **Proyectos**:
   - En `<section id="projects">`, agrega o elimina tarjetas según tus proyectos.
   - Cambia las imágenes de placeholder (`https://via.placeholder.com/500x300`) por capturas de tus proyectos.
   - Actualiza títulos, descripciones y enlaces (`href`) para指向 repositorios o demos.

4. **Contacto**:
   - Modifica los enlaces en `<section id="contact">` con tu correo (`mailto:tu.email@ejemplo.com`), LinkedIn y GitHub.

5. **Estilos y Animaciones**:
   - Ajusta colores y efectos en la etiqueta `<style>` (ej. cambiar `rgba(59, 130, 246, 0.5)` por otros tonos).
   - Modifica las animaciones de GSAP en el `<script>` (duración, desplazamiento, etc.) para personalizar los efectos.
   - Cambia la densidad de estrellas en el canvas editando el bucle `for (let i = 0; i < 200; i++)`.

## Cómo Alojar la Página
1. **GitHub Pages**:
   - Sube `index.html` a un repositorio en GitHub.
   - Habilita GitHub Pages en la configuración (rama `main`, carpeta `/`).
   - Accede a tu sitio en `https://tu-usuario.github.io/nombre-repositorio`.

2. **Netlify/Vercel**:
   - Usa drag-and-drop en Netlify/Vercel o conecta tu repositorio de GitHub.
   - Configura un dominio personalizado si lo deseas.

3. **Pruebas Locales**:
   - Abre `index.html` en un navegador o usa Live Server en VS Code.

## Dependencias
- **Tailwind CSS**: Via CDN.
- **GSAP**: Via CDN para animaciones.
- **Typed.js**: Via CDN para texto dinámico.
- **Google Fonts**: Fuente Orbitron.

## Notas
- **Imágenes**: Usa imágenes de alta calidad para reemplazar los placeholders y optimízalas (ej. WebP) para mejor rendimiento.
- **Rendimiento**: Si el fondo de estrellas afecta el rendimiento en dispositivos móviles, reduce el número de estrellas (ajusta `i < 200` a un valor menor).
- **SEO**: Agrega metaetiquetas en el `<head>` (ej. `<meta name="description" content="Portafolio de Andrés Martínez, ingeniero informático">`) para buscadores.
- **Funcionalidades Extra**: Para un formulario de contacto, considera servicios como Formspree o un backend ligero.

¡Este portafolio está listo para llevar tus proyectos a las estrellas! Personalízalo y déjame saber si necesitas ajustes o más funcionalidades.