---
name: Andrés Martínez — Portfolio
description: Un banco de trabajo para mostrar software, experiencia y curiosidad.
colors:
  paper: "#f5f5f0"
  ink: "#252823"
  red: "#b83d28"
  muted: "#62655e"
  line: "#d2d4ca"
  workbench: "#e6e8db"
  projects: "#e8ebe0"
  forest: "#30382e"
  forest-text: "#eef0e6"
  forest-muted: "#c5cebc"
typography:
  display:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "clamp(52px,5.8vw,84px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "clamp(38px,4vw,58px)"
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    letterSpacing: "-0.03em"
  introduction:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
  code:
    fontFamily: "monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  tag: "3px"
  control: "4px"
spacing:
  tag-gap: "6px"
  link-gap: "12px"
  text-gap: "20px"
  column-gap: "60px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "17px 20px"
  button-primary-hover:
    backgroundColor: "{colors.red}"
  filter:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  filter-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  technology-tag:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "6px 9px"
  inline-link:
    textColor: "{colors.ink}"
    padding: "8px 0"
---

# Design System: Andrés Martínez — Portfolio

## Overview

**Creative North Star: "El banco de trabajo"**

Una superficie de papel gris verdoso, tinta carbón y rojo óxido presenta a una persona que construye software. La tipografía tiene presencia y cercanía; las filas abiertas, los separadores discretos y el espacio generoso permiten leer responsabilidades y proyectos sin convertir cada fragmento en una tarjeta.

El carácter humano procede de una escena construida con HTML y CSS y de interacciones pequeñas. La representación personal hecha en código es una decisión de Andrés; las capturas de interfaces existentes aportan evidencia del trabajo. La animación acompaña la lectura y conserva una versión estática completa cuando se solicita menos movimiento.

**Key Characteristics:**
- Papel gris verdoso, tinta carbón y acentos de óxido.
- Una familia variable expresiva para títulos y lectura.
- Filas abiertas con separadores finos y cambios de superficie.
- Personaje y banco de trabajo hechos con código.
- Interacciones legibles con teclado y movimiento reducido.

## Colors

El color combina materiales claros y vegetales con un acento cálido para acciones y énfasis.

### Primary
- **Óxido** (`red`): línea de énfasis del titular, enlaces destacados, estado hover de la acción principal y foco de teclado.

### Secondary
- **Salvia de taller** (`workbench`): fondo de la escena del personaje.
- **Salvia de proyectos** (`projects`): superficie continua de la selección de trabajos.
- **Bosque** (`forest`): sección personal invertida; se acompaña de `forest-text` y `forest-muted`.

### Neutral
- **Papel** (`paper`): fondo principal y texto de los controles oscuros.
- **Carbón** (`ink`): texto principal y controles seleccionados.
- **Piedra** (`muted`): descripciones, fechas y metadatos sobre papel.
- **Separador** (`line`): límites de navegación, experiencia y pie.

**The Action Ink Rule.** Los controles principales y seleccionados se rellenan de carbón; el óxido señala énfasis, interacción y foco.

Los colores de piel, monitor y pósteres de proyectos son ilustración local, no una paleta nueva para controles o texto general.

## Typography

**Display Font:** Bricolage (sans-serif como alternativa).
**Body Font:** Bricolage (sans-serif como alternativa).
**Label/Mono Font:** monospace únicamente dentro del monitor ilustrado.

La fuente variable local Bricolage Grotesque se declara como `Bricolage`, carga desde `/fonts/bricolage.woff2`, admite pesos de 200 a 800 y usa `font-display: swap`. `index.html` precarga el mismo archivo. Los titulares usan curvas expresivas y espaciado cerrado; los párrafos permanecen tranquilos y abiertos.

### Hierarchy
- **Display:** titular principal en tres líneas, con la última en óxido; usa el token `display` en escritorio.
- **Headline:** títulos de sección con el token `headline` y ajuste equilibrado de líneas.
- **Title:** títulos de proyectos con el token `title`; las empresas usan 28px y espaciado de -0.025em, los puestos 18px y peso 600.
- **Introduction:** presentación del hero con el token `introduction`, anchura máxima de 470px; la descripción posterior usa 15px y un máximo de 460px.
- **Body:** experiencia en 14px y altura 1.75; descripciones de proyecto en 14px y altura heredada 1.65; texto de introducción de sección en 15px. No existe un tamaño único para todos los párrafos.
- **Label:** etiquetas técnicas en 11px y altura 1.3; navegación en 14px, fechas y metadatos en 12px. Se conserva la caja natural del contenido.

**The One Family Rule.** Bricolage sostiene la interfaz completa; el monoespaciado pertenece al código representado en el monitor.

## Layout

El contenedor central tiene un máximo de 1280px y una anchura de `calc(100% - 96px)`. La cabecera mide al menos 106px. El hero combina columnas de 1.05fr y 1fr, separación horizontal de 38px y entrada superior de 78px. Las introducciones de sección, el bloque personal y el pie usan pares de 1.1fr y 1fr, normalmente separados por 60px.

Las secciones amplias tienen 110px arriba y 104px abajo. La experiencia se organiza en filas de 1fr y 2.2fr, con 35px verticales por fila. Cada proyecto es una fila de 1fr y 1.08fr con 80px entre columnas y 42px arriba / 50px abajo. Las habilidades usan tres columnas de 1fr, 1.3fr y 1.5fr. Los pasos de espaciado descritos en el frontmatter son valores reutilizados, no una escala rígida aplicada a toda la página.

- **Hasta 1050px:** el contenedor deja 32px por lado; el hero conserva dos columnas, su título pasa a 60px y las separaciones se comprimen. Los títulos de puesto y fechas se apilan.
- **Hasta 760px:** el contenedor deja 20px por lado. Hero, experiencia, proyectos, sección personal y pie se apilan; la imagen del proyecto precede a su texto. Las secciones usan 72px verticales, los títulos de sección 43px y el hero `clamp(51px,9vw,72px)`. La escena conserva un mínimo de 420px de alto y un máximo de 510px de ancho. Las habilidades conservan dos columnas.
- **Hasta 390px:** el título principal pasa a 49px, los títulos de sección a 38px y las habilidades se convierten en una columna. Los controles de escena reducen tamaño y padding; la escena conserva su mínimo de 420px de alto.
- **Desde 1600px:** la escena mide 440px, el título principal 90px y el hero deja 90px arriba.

La escena establece `height: 420px; min-height: 420px`; el mínimo prevalece sobre las alturas menores declaradas en las media queries. El título interior tiene altura de línea 1 para dejar espacio sobre el cabello. El cuerpo admite una anchura mínima de 320px. Los enlaces internos respetan un margen de desplazamiento de 28px. La navegación móvil mantiene Experiencia y Proyectos; Contacto continúa disponible en el pie.

## Elevation & Depth

La interfaz es plana: filas separadas por líneas y bloques tonales, sin sombras de tarjetas. La profundidad aparece únicamente dentro de la representación del banco y en la captura de tienda, donde ayuda a distinguir objetos y planos.

### Shadow Vocabulary
- **Monitor:** `6px 10px 20px #25282316`; sombra local del objeto ilustrado.
- **Captura de tienda:** `0 5px 20px #463c321a`; separación de la captura respecto al fondo de su vista previa.

**The Open Surface Rule.** La información vive en filas abiertas y superficies continuas; las sombras locales de la ilustración no definen contenedores de interfaz.

## Shapes

Controles y vistas previas usan esquinas ligeramente suaves (`control`), y etiquetas y controles pequeños usan `tag`. Las líneas de separación tienen normalmente 1px; la primera fila profesional inicia con 2px de carbón. Las siluetas curvas del personaje y el arco de la escena (160px 160px 5px 5px) pertenecen a la ilustración. Los indicadores de identidad y estado son cuadrados o círculos pequeños, hechos con CSS.

## Components

### Buttons

Acciones compactas, claras y sin elevación. La acción principal usa fondo carbón, texto papel, padding del token `button-primary`, tipografía de 14px y un SVG de flecha separado por 24px. En hover cambia a óxido durante 0.2s. A 1050px el padding se reduce a 15px y la separación a 14px.

Los enlaces secundarios tienen subrayado con desplazamiento de 6px, separación de 12px hasta la flecha y texto de 14px; en hover, texto y subrayado pasan a óxido. Botones, enlaces y resúmenes muestran foco de 3px en óxido con desplazamiento de 5px.

### Chips

Las etiquetas de tecnología son informativas, con borde fino, fondo transparente y padding del token `technology-tag`. Los filtros son botones: borde `#b9bfad`, fondo transparente y texto de 13px; el seleccionado usa carbón y papel con `aria-pressed`. Hover libre `#d4d9c7`; hover seleccionado `#424a39`. En móvil el filtro usa 12px y padding de 10px 13px.

### Cards / Containers

Las piezas de experiencia y proyecto son filas, no tarjetas elevadas. Las vistas previas de proyectos tienen esquinas de 4px, altura de 350px en escritorio y 330px en las variantes compactas, con recorte de su contenido. Capturas, pósteres tipográficos y dibujos de código mantienen su propia paleta dentro de ese marco. La captura de tienda se desplaza 6px hacia arriba al pasar el cursor durante 0.5s.

### Navigation

Cabecera horizontal con identidad a la izquierda, enlaces a la derecha y separador inferior. Los enlaces se separan 34px y cambian a óxido en hover; no existe indicador persistente de sección activa. La identidad combina monograma tipográfico y nombre con rol secundario. En móvil se reducen las dimensiones y se oculta solo el enlace Contacto de cabecera.

### Banco de trabajo

Escena decorativa oculta al árbol de accesibilidad; sus controles siguen siendo botones accesibles. Tres modos cambian el texto y código del monitor, acompañados de un mensaje `aria-live`. El botón Saluda activa el brazo durante 1.25s. Hay parpadeo cada 6s y vapor cada 3s. Al cambiar modo, GSAP revela código durante 0.7s y mueve la cabeza durante 0.6s con `power3.out`; la entrada inicial usa `expo.out` durante 1s para texto y 1.2s para escena.

`prefers-reduced-motion: reduce` desactiva animaciones y transiciones CSS, evita las animaciones GSAP y el desplazamiento suave, y restablece transformaciones y recorte del código. La escena y su información siguen presentes.

### Disclosure

Los detalles de experiencia previa y aportación usan `details` y `summary` nativos, tipografía de 13px, separadores discretos y hover en óxido. Conservan interacción de teclado y estado desplegado del navegador; no se simulan con contenedores genéricos.

## Do's and Don'ts

### Do:
- **Do** mantener Bricolage local como voz común de títulos y texto.
- **Do** construir jerarquía mediante escala, espacio, líneas y cambios de superficie.
- **Do** conservar estados de foco visibles, botones con estado semántico y una experiencia estática completa con movimiento reducido.
- **Do** mantener el personaje hecho en código y utilizar capturas existentes para mostrar interfaces reales.

### Don't:
- **Don't** convertir los colores particulares de un póster o del personaje en colores generales de la interfaz.
- **Don't** extender las sombras de objetos ilustrados a filas de experiencia y proyectos.
- **Don't** sustituir los controles semánticos por elementos decorativos sin interacción equivalente.
- **Don't** hacer depender la lectura del contenido de una animación.
