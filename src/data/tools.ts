import React from 'react';
import {
  FileText,
  Type,
  Binary,
  FileJson,
  Hash,
  Palette,
  QrCode,
  KeyRound,
  Scale,
  GraduationCap,
  Files,
  Terminal,
  Network,
  Shield,
  CalendarClock,
  Code2,
  Clock,
} from 'lucide-react';
import { ToolDefinition, CategoryInfo, ToolCategory } from '../types/tools';

export const CATEGORIES_LIST: CategoryInfo[] = [
  {
    id: 'sistemas',
    name: 'Sistemas y Redes',
    description: 'Bases numéricas, operaciones binarias, subredes IPv4, permisos chmod y tareas programadas cron',
    iconName: 'Terminal',
  },
  {
    id: 'texto',
    name: 'Texto y Redacción',
    description: 'Contador de palabras, formato de mayúsculas y codificación Base64',
    iconName: 'FileText',
  },
  {
    id: 'desarrollo',
    name: 'Desarrollo y Código',
    description: 'Formateo de JSON, generación de hashes criptográficos, UUID v4, RegEx y fechas Unix',
    iconName: 'FileJson',
  },
  {
    id: 'diseno',
    name: 'Diseño y Creatividad',
    description: 'Selector y generador de paletas armónicas, contraste WCAG y códigos QR',
    iconName: 'Palette',
  },
  {
    id: 'seguridad',
    name: 'Seguridad y Cifrado',
    description: 'Contraseñas aleatorias fuertes, frases de paso en español y entropía',
    iconName: 'KeyRound',
  },
  {
    id: 'calculo',
    name: 'Cálculo y Universidad',
    description: 'Conversor multidimensional de unidades y calculadora de notas universitarias',
    iconName: 'Scale',
  },
  {
    id: 'pdf',
    name: 'Documentos PDF',
    description: 'Unión y división de PDFs 100% en memoria local sin subidas a la nube',
    iconName: 'Files',
  },
];

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // ==========================================
  // CATEGORÍA SISTEMAS Y REDES (NUEVA)
  // ==========================================
  {
    id: 'bases-bits',
    name: 'Calculadora de Bases y Bits',
    shortName: 'Bases y Bits',
    category: 'sistemas',
    icon: Binary,
    badge: 'Nuevo',
    description:
      'Conversor entre binario, octal, hex, decimal y bases 2-36 con BigInt, operaciones bit a bit, complementos A1/A2, aritmética binaria paso a paso, IEEE 754 y tabla ASCII.',
    keywords: [
      'bases',
      'binario',
      'hexadecimal',
      'octal',
      'bits',
      'bitwise',
      'complemento',
      'ieee754',
      'ascii',
      'bigint',
      'sistemas',
    ],
    component: React.lazy(() => import('../components/tools/systems/BaseBitCalculator')),
  },
  {
    id: 'calculadora-subredes',
    name: 'Calculadora de Subredes IPv4 y VLSM',
    shortName: 'Subredes IPv4',
    category: 'sistemas',
    icon: Network,
    badge: 'Nuevo',
    description:
      'Cálculo de máscaras de red, CIDR, broadcast, rango utilizable, división en subredes iguales y dimensionamiento VLSM con exportación a CSV.',
    keywords: [
      'subredes',
      'ipv4',
      'cidr',
      'vlsm',
      'mascara',
      'broadcast',
      'hosts',
      'redes',
      'ip',
      'networking',
    ],
    component: React.lazy(() => import('../components/tools/systems/SubnetCalculator')),
  },
  {
    id: 'permisos-chmod',
    name: 'Calculadora de Permisos Chmod y Umask',
    shortName: 'Permisos Chmod',
    category: 'sistemas',
    icon: Shield,
    badge: 'Nuevo',
    description:
      'Generador visual de permisos Unix (rwx, octal 755, 644), flags especiales (SUID, SGID, Sticky bit), cálculo inverso de umask y generador de comandos.',
    keywords: [
      'chmod',
      'permisos',
      'linux',
      'unix',
      'octal',
      'umask',
      'rwx',
      'suid',
      'sgid',
      'sticky',
      'terminal',
    ],
    component: React.lazy(() => import('../components/tools/systems/ChmodCalculator')),
  },
  {
    id: 'expresiones-cron',
    name: 'Parser y Planificador de Expresiones Cron',
    shortName: 'Expresiones Cron',
    category: 'sistemas',
    icon: CalendarClock,
    badge: 'Nuevo',
    description:
      'Traductor de expresiones cron a español natural, constructor visual asistido, simulación de próximas ejecuciones con cuenta atrás y soporte de husos horarios.',
    keywords: [
      'cron',
      'crontab',
      'programador',
      'tareas',
      'expresiones',
      'tiempo',
      'schedule',
      'planificador',
      'servidor',
    ],
    component: React.lazy(() => import('../components/tools/systems/CronExpressionTool')),
  },

  // ==========================================
  // CATEGORÍA TEXTO
  // ==========================================
  {
    id: 'contador-palabras',
    name: 'Contador de Palabras y Caracteres',
    shortName: 'Contador',
    category: 'texto',
    icon: FileText,
    description:
      'Métricas en vivo de caracteres, palabras, párrafos, tiempo de locución y densidad léxica con límites para redes sociales.',
    keywords: ['palabras', 'caracteres', 'texto', 'conteo', 'densidad', 'twitter', 'lectura', 'habla', 'tiempo'],
    component: React.lazy(() => import('../components/tools/text/WordCounter')),
  },
  {
    id: 'mayusculas-minusculas',
    name: 'Conversor de Mayúsculas y Minúsculas',
    shortName: 'Mayúsculas',
    category: 'texto',
    icon: Type,
    description:
      'Convierte a MAYÚSCULAS, minúsculas, Tipo Título, camelCase, snake_case, limpia espacios, ordena líneas y quita tildes.',
    keywords: ['mayusculas', 'minusculas', 'titulo', 'camelcase', 'snake_case', 'kebab', 'tildes', 'ordenar', 'case'],
    component: React.lazy(() => import('../components/tools/text/CaseConverter')),
  },
  {
    id: 'base64',
    name: 'Codificador y Decodificador Base64',
    shortName: 'Base64',
    category: 'texto',
    icon: Binary,
    description:
      'Codifica y decodifica texto con soporte UTF-8 completo, modo URL-safe, y convierte archivos e imágenes a Data URI.',
    keywords: ['base64', 'encode', 'decode', 'utf8', 'archivo', 'imagen', 'datauri', 'binario'],
    component: React.lazy(() => import('../components/tools/text/Base64Tool')),
  },

  // ==========================================
  // CATEGORÍA DESARROLLO (EXISTENTES + NUEVAS)
  // ==========================================
  {
    id: 'formateador-json',
    name: 'Formateador y Validador de JSON',
    shortName: 'JSON',
    category: 'desarrollo',
    icon: FileJson,
    description:
      'Formatea, minifica, valida con detección de línea de error, ordena claves alfabéticamente y explora con vista de árbol interactiva.',
    keywords: ['json', 'formatear', 'minificar', 'validar', 'arbol', 'pretty', 'indentacion'],
    component: React.lazy(() => import('../components/tools/dev/JsonFormatter')),
  },
  {
    id: 'hashes-uuid',
    name: 'Generador de Hashes y UUID',
    shortName: 'Hashes y UUID',
    category: 'desarrollo',
    icon: Hash,
    description:
      'Calcula SHA-1, SHA-256, SHA-384, SHA-512 en texto o archivos con Web Crypto API, compara checksums y genera UUID v4.',
    keywords: ['hash', 'sha256', 'sha512', 'sha1', 'uuid', 'v4', 'checksum', 'crypto', 'seguro'],
    component: React.lazy(() => import('../components/tools/dev/HashUuidGenerator')),
  },
  {
    id: 'tester-regex',
    name: 'Tester y Evaluador de Expresiones Regulares',
    shortName: 'Tester RegEx',
    category: 'desarrollo',
    icon: Code2,
    badge: 'Nuevo',
    description:
      'Evaluación de patrones RegEx con Web Worker sin bloquear la interfaz, resaltado visual en vivo, explorador de grupos nombrados y modo reemplazo.',
    keywords: [
      'regex',
      'expresiones regulares',
      'tester',
      'reemplazo',
      'grupos',
      'patron',
      'regexp',
      'match',
      'desarrollo',
    ],
    component: React.lazy(() => import('../components/tools/dev/RegexTesterTool')),
  },
  {
    id: 'timestamp-fecha-hora',
    name: 'Conversor de Fecha, Hora y Timestamp Unix',
    shortName: 'Timestamp y Fechas',
    category: 'desarrollo',
    icon: Clock,
    badge: 'Nuevo',
    description:
      'Conversión bidireccional entre Epoch Unix (s, ms), ISO 8601, RFC 2822, comparador de zonas horarias mundiales y cálculo de diferencia de fechas.',
    keywords: [
      'timestamp',
      'unix',
      'epoch',
      'fecha',
      'hora',
      'iso8601',
      'zonas horarias',
      'timezone',
      'diferencia',
      'fechas',
    ],
    component: React.lazy(() => import('../components/tools/dev/DateTimeConverterTool')),
  },

  // ==========================================
  // CATEGORÍA DISEÑO
  // ==========================================
  {
    id: 'colores-paletas',
    name: 'Selector de Color, Paletas y Contraste WCAG',
    shortName: 'Colores',
    category: 'diseno',
    icon: Palette,
    description:
      'Conversor HEX/RGB/HSL, cuentagotas con EyeDropper, 5 paletas armónicas derivadas, test de accesibilidad WCAG y guardado en local.',
    keywords: ['color', 'paleta', 'hex', 'rgb', 'hsl', 'wcag', 'contraste', 'eyedropper', 'cuentagotas', 'accesibilidad'],
    component: React.lazy(() => import('../components/tools/design/ColorPaletteTool')),
  },
  {
    id: 'generador-qr',
    name: 'Generador de Códigos QR',
    shortName: 'Códigos QR',
    category: 'diseno',
    icon: QrCode,
    description:
      'Genera códigos QR para enlaces, Wi-Fi, WhatsApp, vCard, Email y SMS. Personaliza colores, margen y descarga en PNG o SVG.',
    keywords: ['qr', 'codigo qr', 'wifi', 'whatsapp', 'vcard', 'svg', 'png', 'contacto'],
    component: React.lazy(() => import('../components/tools/design/QrGeneratorTool')),
  },

  // ==========================================
  // CATEGORÍA SEGURIDAD
  // ==========================================
  {
    id: 'generador-contrasenas',
    name: 'Generador de Contraseñas y Frases Seguras',
    shortName: 'Contraseñas',
    category: 'seguridad',
    icon: KeyRound,
    description:
      'Generación criptográfica con crypto.getRandomValues, modo contraseña o passphrase en español, medidor de entropía y tiempo de crackeo.',
    keywords: ['contraseñas', 'password', 'passphrase', 'seguridad', 'entropia', 'aleatorio', 'clave'],
    component: React.lazy(() => import('../components/tools/security/PasswordGenerator')),
  },

  // ==========================================
  // CATEGORÍA CÁLCULO
  // ==========================================
  {
    id: 'convertidor-unidades',
    name: 'Convertidor de Unidades Multidimensional',
    shortName: 'Unidades',
    category: 'calculo',
    icon: Scale,
    description:
      'Conversión bidireccional entre 11 categorías: longitud, masa, temperatura, volumen, área, velocidad, tiempo, datos digitales y más.',
    keywords: ['unidades', 'convertir', 'longitud', 'temperatura', 'peso', 'datos', 'velocidad', 'medidas'],
    component: React.lazy(() => import('../components/tools/calc/UnitConverter')),
  },
  {
    id: 'promedio-ponderado',
    name: 'Calculadora de Notas y Promedio Ponderado',
    shortName: 'Notas Universitarias',
    category: 'calculo',
    icon: GraduationCap,
    description:
      'Gestión de materias con porcentajes de evaluación, simulador de examen final ("¿cuánto necesito?") e índice general de carrera.',
    keywords: ['notas', 'promedio', 'universidad', 'ponderado', 'gpa', 'materias', 'creditos', 'examen final'],
    component: React.lazy(() => import('../components/tools/calc/GradeCalculator')),
  },

  // ==========================================
  // CATEGORÍA PDF
  // ==========================================
  {
    id: 'unir-dividir-pdf',
    name: 'Unir y Dividir Documentos PDF',
    shortName: 'PDF Herramientas',
    category: 'pdf',
    icon: Files,
    description:
      'Combina múltiples PDFs o extrae páginas y divide por rangos con visor de miniaturas y descarga en ZIP. Sin servidores externos.',
    keywords: ['pdf', 'unir', 'dividir', 'merge', 'split', 'extraer', 'miniaturas', 'documentos', 'zip'],
    component: React.lazy(() => import('../components/tools/pdf/PdfMergeSplit')),
  },
];
