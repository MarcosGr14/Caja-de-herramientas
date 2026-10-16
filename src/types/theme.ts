export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor =
  | 'rojo'
  | 'monocromo'
  | 'cobalto'
  | 'naranja'
  | 'lima'
  | 'violeta'
  // Compatibilidad hacia atrás con presets anteriores
  | 'celeste'
  | 'lavanda'
  | 'rosa'
  | 'menta'
  | 'durazno'
  | 'salvia';

export interface AccentOption {
  id: AccentColor;
  name: string;
  color: string;
  ring: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'rojo', name: 'Rojo Skate (Referencia)', color: '#E11D2E', ring: 'rgba(225, 29, 46, 0.35)' },
  { id: 'monocromo', name: 'Negro / Monocromo', color: '#111113', ring: 'rgba(17, 17, 19, 0.3)' },
  { id: 'cobalto', name: 'Azul Cobalto', color: '#2563EB', ring: 'rgba(37, 99, 235, 0.35)' },
  { id: 'naranja', name: 'Naranja Cítrico', color: '#F97316', ring: 'rgba(249, 115, 22, 0.35)' },
  { id: 'lima', name: 'Verde Lima', color: '#84CC16', ring: 'rgba(132, 204, 22, 0.35)' },
  { id: 'violeta', name: 'Violeta Eléctrico', color: '#8B5CF6', ring: 'rgba(139, 92, 246, 0.35)' },
];
