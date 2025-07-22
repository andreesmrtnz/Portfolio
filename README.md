# Portfolio de Andrés Martínez

Portfolio profesional de Andrés Martínez, estudiante de Ingeniería Informática en la Universidad de Murcia, especializado en desarrollo full-stack e inteligencia artificial.

## 🚀 Características

- **Diseño Responsivo**: Optimizado para todos los dispositivos
- **Animaciones Fluidas**: Usando GSAP y efectos personalizados
- **Fondo Interactivo**: Canvas animado con estrellas
- **Modales de Proyectos**: Información detallada de cada proyecto
- **Optimizado para Producción**: CSS compilado y minificado

## 🛠️ Tecnologías Utilizadas

- HTML5 semántico
- Tailwind CSS (compilado localmente)
- JavaScript (ES6+)
- GSAP (animaciones)
- Typed.js (efectos de escritura)
- Node.js y npm (para el build)

## 📦 Instalación y Desarrollo

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm

### Instalación
```bash
# Clona el repositorio
git clone https://github.com/andreesmrtnz/Portfolio.git

# Navega al directorio
cd Portfolio

# Instala las dependencias
npm install
```

### Comandos de Build

```bash
# Compilar CSS para desarrollo (con watch mode)
npm run build-css

# Compilar CSS para producción (minificado)
npm run build-production
```

### Desarrollo Local

1. Ejecuta el comando de desarrollo:
   ```bash
   npm run build-css
   ```

2. Abre `index.html` en tu navegador o usa un servidor local como Live Server

## 📁 Estructura del Proyecto

```
Portfolio/
├── assets/
│   ├── css/
│   │   └── styles.css           # CSS compilado (generado)
│   ├── images/                  # Imágenes del portfolio
│   └── files/                   # Archivos descargables (CV)
├── src/
│   └── input.css               # CSS fuente de Tailwind
├── index.html                  # Página principal
├── package.json               # Dependencias y scripts
├── tailwind.config.js         # Configuración de Tailwind CSS
└── README.md                  # Documentación
```

## 🚀 Despliegue en Producción

### Antes de subir a producción:

1. Compila el CSS optimizado:
   ```bash
   npm run build-production
   ```

2. Verifica que el archivo `assets/css/styles.css` esté actualizado

3. Sube los archivos, asegurándote de incluir:
   - `index.html`
   - `assets/` (completo)
   - `sitemap.xml`

### NO subir a producción:
- `node_modules/`
- `src/`
- `package.json`
- `tailwind.config.js`
- `.gitignore`

## ✨ Características del Portfolio

### Secciones Principales
- **Hero**: Presentación con animación de texto dinámico
- **Sobre Mí**: Información personal y profesional
- **Experiencia**: Historial académico y profesional
- **Habilidades**: Tecnologías y competencias
- **Proyectos**: Galería de proyectos con modales detallados
- **Contacto**: Enlaces a redes sociales y email

### Proyectos Destacados
- **AppChat**: Aplicación de mensajería en tiempo real (Java)
- **LinguaLearn**: Plataforma educativa tipo Duolingo (Java)
- **Regalos Ana Fátima**: E-commerce full-stack (PHP/MySQL)
- **NanoFiles**: Sistema P2P de compartición de archivos (Java)
- **Y más proyectos de redes, compiladores y servicios web**

## 📧 Contacto

- **Email**: andresml9602@gmail.com
- **LinkedIn**: [Andrés Martínez](https://www.linkedin.com/in/andr%C3%A9s-martinez-b781a935b/)
- **GitHub**: [andreesmrtnz](https://github.com/andreesmrtnz)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**© 2025 Andrés Martínez Lorca. Creado con pasión.** 