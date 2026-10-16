export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor =
  | 'rosa'
  | 'lavanda'
  | 'menta'
  | 'celeste'
  | 'durazno'
  | 'salvia';

export interface AccentOption {
  id: AccentColor;
  name: string;
  color: string;
  ring: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'celeste', name: 'Celeste', color: '#0ea5e9', ring: '#38bdf8' },
  { id: 'lavanda', name: 'Lavanda', color: '#8b5cf6', ring: '#a78bfa' },
  { id: 'rosa', name: 'Rosa pastel', color: '#ec4899', ring: '#f472b6' },
  { id: 'menta', name: 'Menta', color: '#10b981', ring: '#34d399' },
  { id: 'durazno', name: 'Durazno', color: '#f97316', ring: '#fb923c' },
  { id: 'salvia', name: 'Verde salvia', color: '#65a30d', ring: '#a3e635' },
];
