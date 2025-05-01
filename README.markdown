# Portafolio de Andrés Martínez

Este es un portafolio web visualmente impactante para Andrés Martínez, ingeniero informático especializado en desarrollo full-stack, aplicaciones Java y protocolos de red. El diseño presenta una estética inspirada en el espacio con un fondo de estrellas animado, efectos de brillo y transiciones suaves, manteniendo una presentación profesional y clara de los proyectos y habilidades de Andrés.

## Características
- **Diseño Inspirado en el Espacio**: Fondo dinámico de estrellas, botones con efecto de brillo y tipografía futurista (Orbitron).
- **Animaciones Avanzadas**:
  - Animaciones fluidas con GSAP para transiciones de secciones y entrada de elementos.
  - Efectos activados por desplazamiento para proyectos, habilidades e iconos de contacto.
  - Typed.js para texto dinámico en la sección hero.
  - Efectos de hover mejorados con brillos radiales en botones y tarjetas de proyectos.
- **Interactividad**:
  - Navegación responsiva con desplazamiento suave.
  - Tarjetas de proyectos con elevación y efectos de luz al pasar el ratón.
  - Etiquetas de habilidades con animaciones de escala al interactuar.
  - Iconos de contacto con efectos de brillo al pasar el ratón.
- **Tecnologías**:
  - HTML, CSS (Tailwind CSS), JavaScript.
  - GSAP para animaciones.
  - Typed.js para texto dinámico.
  - Canvas para fondo de estrellas.
  - Google Fonts (Orbitron).

## Estructura del Proyecto
- `index.html`: Archivo principal con HTML, estilos y scripts.
- Secciones incluidas:
  - **Hero**: Introducción animada con texto dinámico y un botón con efecto de brillo.
  - **Sobre mí**: Descripción personal con imagen y texto animados.
  - **Habilidades**: Etiquetas interactivas que muestran las competencias técnicas de Andrés.
  - **Proyectos**: Galería de seis tarjetas de proyectos con descripciones detalladas.
  - **Contacto**: Iconos grandes animados para correo, LinkedIn y GitHub.
  - **Pie de Página**: Pie minimalista con un toque personal.

## Cómo Personalizar
1. **Sección Hero**:
   - Actualiza las frases en el script de Typed.js (`strings: [...]`) para reflejar tus títulos preferidos.
   - Ajusta el gradiente de fondo en `#home` (ej., `bg-gradient-to-br from-purple-800 to-blue-900`).

2. **Sección Sobre mí**:
   - Edita el texto en `<section id="sobre-mi">` para personalizar tu biografía.
   - Reemplaza la imagen de placeholder (`https://via.placeholder.com/500`) con tu foto.

3. **Sección Habilidades**:
   - Modifica los elementos `<span class="skill-tag">` en `<section id="habilidades">` para añadir o eliminar habilidades.
   - Ajusta el estilo en la etiqueta `<style>` para cambiar colores o efectos.

4. **Sección Proyectos**:
   - Actualiza las tarjetas de proyectos en `<section id="proyectos">` con los detalles de tus proyectos.
   - Reemplaza las imágenes de placeholder (`https://via.placeholder.com/500x300`) con capturas de tus proyectos.
   - Actualiza los atributos `href` para enlazar a repositorios o demos en vivo.

5. **Sección Contacto**:
   - Actualiza los enlaces en `<section id="contacto">` con tu correo (`mailto:tu.correo@ejemplo.com`), LinkedIn y GitHub.

6. **Estilos y Animaciones**:
   - Personaliza colores y efectos en la etiqueta `<style>` (ej., cambia `rgba(59, 130, 246, 0.5)` para efectos de brillo).
   - Ajusta las animaciones de GSAP en el `<script>` (duración, suavizado, etc.) para efectos diferentes.
   - Modifica la densidad del fondo de estrellas en el script del canvas (ej., cambia `i < 300` para ajustar la cantidad de estrellas).

## Cómo Alojar la Página
1. **GitHub Pages**:
   - Sube `index.html` a un repositorio en GitHub.
   - Habilita GitHub Pages en la configuración del repositorio (rama: `main`, carpeta: `/`).
   - Accede a tu sitio en `https://tu-usuario.github.io/nombre-repositorio`.

2. **Netlify/Vercel**:
   - Usa drag-and-drop en Netlify/Vercel o conecta tu repositorio de GitHub.
   - Configura un dominio personalizado si lo deseas.

3. **Pruebas Locales**:
   - Abre `index.html` en un navegador o usa un servidor local (ej., Live Server de VS Code).

## Dependencias
- **Tailwind CSS**: Incluido vía CDN.
- **GSAP**: Incluido vía CDN para animaciones.
- **Typed.js**: Incluido vía CDN para texto dinámico.
- **Google Fonts**: Fuente Orbitron.

## Notas
- **Imágenes**: Reemplaza los placeholders con capturas de alta calidad de tus proyectos y optimízalas (ej., WebP) para mejorar el rendimiento.
- **Rendimiento**: Para dispositivos móviles, considera reducir la cantidad de estrellas (ej., `i < 150`) si la animación afecta el rendimiento.
- **SEO**: Mejora la visibilidad en buscadores añadiendo metaetiquetas (ej., `<meta name="keywords" content="Andrés Martínez, ingeniero informático, portafolio">`).
- **Funcionalidades Adicionales**: Añade un formulario de contacto con servicios como Formspree o integra un backend para contenido dinámico.

Este portafolio destaca a Andrés Martínez como un desarrollador altamente capacitado y versátil. ¡Personalízalo para mantener tus proyectos y habilidades actualizados!