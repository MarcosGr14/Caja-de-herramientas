# Caja de Herramientas 🧰

Hub moderno de utilidades (minitools) en una sola página, rápido, intuitivo y con diseño acogedor (*cozy*). Ejecuta **100% en el navegador**, sin backend, sin base de datos y sin peticiones de red a APIs externas. Todo el procesamiento ocurre en la memoria local de tu dispositivo.

---

## 🚀 Características Principales

- **100% Local y Privado**: Cero telemetría, cero servidores externos. Tus datos, textos, archivos y contraseñas jamás abandonan tu equipo.
- **PWA Instalable**: Funciona offline una vez cargada mediante Service Worker (`vite-plugin-pwa`).
- **Rendimiento Ultraliviano**: Code-splitting con `React.lazy` y `Suspense`. Librerías pesadas (`pdf-lib`, `pdfjs-dist`, `qrcode`, `jszip`) se importan dinámicamente solo al abrir la herramienta que las utiliza.
- **Criptografía Segura**: Generación de hashes y contraseñas mediante la **Web Crypto API** nativa (`crypto.subtle`, `crypto.getRandomValues` y `crypto.randomUUID`). Sin `Math.random` para nada de seguridad.
- **Personalización y Temas**: Modo Claro, Oscuro y Sistema, con **6 colores de acento pastel** (Celeste, Lavanda, Rosa, Menta, Durazno, Verde salvia) mediante variables CSS.
- **Atajos y Búsqueda**: Paleta de comandos accesible con `Ctrl+K` (o `Cmd+K` en macOS) para saltar instantáneamente a cualquier utilidad.
- **Enrutamiento SPA**: Cada herramienta cuenta con su propia ruta (`#/herramienta-id`) para poder compartir enlaces directos y navegar con el botón Atrás/Adelante del navegador.
- **Totalmente Responsive**: Optimizado desde pantallas móviles de 320px (con barra táctil inferior de 44px) hasta monitores panorámicos.

---

## 🛠️ Herramientas Incluidas

### 📝 Categoría Texto
1. **Contador de Palabras y Caracteres**: Métricas en vivo (caracteres con/sin espacios, palabras, oraciones, párrafos, líneas), tiempo estimado de lectura y locución, densidad de las 10 palabras más frecuentes (con opción de ignorar conectores en español), y límites para redes sociales (Twitter/X, Instagram, SMS, Meta descripción).
2. **Mayúsculas y Minúsculas**: Conversión a 11 formatos (MAYÚSCULAS, minúsculas, Tipo Título, Tipo oración, aLtErNaDo, iNVERTIR, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE). Limpieza rápida de dobles espacios, saltos de línea, duplicados, orden A-Z / Z-A y eliminación de tildes (conservando la `ñ`).
3. **Codificador y Decodificador Base64**: Soporte completo para UTF-8 (tildes, emojis, caracteres especiales), opción Base64 URL-safe, conversor de archivo a Base64 con vista previa de imagen, y descarga de Base64 a archivo binario.

### 💻 Categoría Desarrollo
4. **Formateador y Validador de JSON**: Entrada y salida lado a lado, formato configurable (2 espacios, 4 espacios, tabulación), minificación, ordenación alfabética de claves, resaltado de línea/columna en errores sintácticos, y visualizador de árbol colapsable.
5. **Generador de Hashes y UUID**: Cálculo simultáneo de SHA-1, SHA-256, SHA-384 y SHA-512 a partir de texto o archivos mediante la Web Crypto API, comparador de integridad con indicador visual, y generador de lotes de UUID v4.

### 🎨 Categoría Diseño
6. **Selector de Color, Paletas y Contraste WCAG**: Conversión bidireccional HEX/RGB/HSL, cuentagotas digital (EyeDropper API), generador de 5 paletas armónicas (análoga, complementaria, triádica, tetrádica, monocromática), test de contraste WCAG 2.1 (AA/AAA) con vista previa, y guardado de temas en almacenamiento local.
7. **Generador de Códigos QR**: 7 tipos de códigos (Texto/URL, Wi-Fi, WhatsApp, Contacto vCard, Correo, Teléfono, SMS), ajuste de colores con advertencia de contraste, nivel de corrección de error y descargas en formatos PNG y SVG, además de copiado directo al portapapeles.

### 🔒 Categoría Seguridad
8. **Generador de Contraseñas y Frases Seguras**: Contraseñas aleatorias con exclusión de caracteres ambiguos y sin repetición, modo *Passphrase* en español con más de 300 palabras seleccionadas, medidor de entropía en bits con estimación de tiempo de fuerza bruta, y generación en lote (1–20) con historial de sesión en memoria volátil.

### 📐 Categoría Cálculo
9. **Convertidor de Unidades Multidimensional**: Conversión bidireccional instantánea entre 11 categorías físicas y digitales (longitud, masa, temperatura, volumen, área, velocidad, tiempo, datos decimales/binarios, energía, presión, ángulos), botón de intercambio rápido y tabla con todas las equivalencias simultáneas.
10. **Calculadora de Promedio Ponderado Universitario**: Sistema de notas universitarias por materias y porcentaje de ponderación, alerta de validación del 100%, calculador "¿Cuánto necesito en el examen final?", e índice ponderado acumulado del semestre por créditos académicos.

### 📄 Categoría PDF
11. **Unir y Dividir Documentos PDF**: Unión de múltiples archivos PDF con reordenamiento interactivo, y división con visor de miniaturas de páginas, selección visual o por rangos de texto (`1-3, 5`), rotación de 90° y exportación de páginas individuales en archivo comprimido ZIP.

---

## 💻 Instalación y Ejecución Local

Requisitos previos: **Node.js 18+** y **npm**.

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd caja-de-herramientas

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:3000` (o el puerto indicado por Vite).

Para compilar para producción:
```bash
npm run build
```

---

## ☁️ Despliegue en Cloudflare Pages (Paso a Paso)

Este proyecto está 100% preparado para ser desplegado en **Cloudflare Pages** sin coste y con soporte total de rutas SPA y cabeceras de seguridad:

1. **Subir a Git**: Sube el código a tu cuenta de GitHub o GitLab.
2. **Iniciar sesión en Cloudflare**: Accede al panel de control de Cloudflare y ve a **Compute (Workers & Pages)** > **Pages**.
3. **Conectar repositorio**: Haz clic en **Create a project** > **Connect to Git** y selecciona el repositorio de GitHub de este proyecto.
4. **Configurar Build**:
   - **Framework preset**: `Vite` (o `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Desplegar**: Haz clic en **Save and Deploy**. Cloudflare compilará la aplicación y la desplegará en una URL pública `*.pages.dev`.

> **Nota sobre rutas y seguridad**: La carpeta `public/` ya contiene:
> - `public/_redirects`: Regla `/* /index.html 200` para que el enrutador funcione directamente en cualquier subruta o recarga de página.
> - `public/_headers`: Políticas de seguridad `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`.

---

## 🧩 Cómo Agregar una Herramienta Nueva

La arquitectura de la aplicación es **100% modular**. Para añadir una utilidad nueva:

### 1. Crear el componente de la herramienta
Crea un nuevo archivo en la carpeta de su categoría, por ejemplo: `src/components/tools/calc/MiNuevaHerramienta.tsx`:

```tsx
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export default function MiNuevaHerramienta() {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mi Nueva Herramienta</h2>
      <Card>
        <p>Contenido interactivo aquí...</p>
      </Card>
    </div>
  );
}
```

### 2. Registrarla en el registro central (`src/data/tools.ts`)
Añade la definición en el arreglo `TOOLS_REGISTRY`:

```typescript
{
  id: 'mi-nueva-herramienta',
  name: 'Nombre Completo de la Herramienta',
  shortName: 'Nombre Corto',
  category: 'calculo', // 'texto' | 'desarrollo' | 'diseno' | 'seguridad' | 'calculo' | 'pdf'
  icon: MiIconoDeLucide,
  description: 'Descripción breve de las funciones que realiza...',
  keywords: ['palabra1', 'palabra2', 'utilidad'],
  component: React.lazy(() => import('../components/tools/calc/MiNuevaHerramienta')),
}
```

¡Eso es todo! La nueva herramienta aparecerá automáticamente en:
- La cuadrícula de la pantalla de inicio
- La barra lateral (Desktop)
- El menú drawer y navegación móvil
- La paleta de comandos (`Ctrl+K`)
- El sistema de favoritos y recientes
- La ruta directa por URL (`#/mi-nueva-herramienta`) con aislamiento de fallos (`ErrorBoundary`) y carga diferida (`React.lazy`).

---

## 📄 Licencia

Código abierto bajo licencia MIT. Desarrollado con esmero y estándares de ingeniería frontend modernos.
