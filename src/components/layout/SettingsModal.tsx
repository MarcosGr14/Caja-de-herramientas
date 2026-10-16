import React, { useRef } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Palette,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { ACCENT_OPTIONS } from '../../types/theme';
import { useToast } from '../ui/Toast';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  // Export all application data from localStorage
  const handleExportAll = () => {
    try {
      const keysToExport = [
        'app-theme-mode',
        'app-theme-accent',
        'app-favorites',
        'app-recents',
        'app-saved-palettes',
        'app-grade-courses',
        'app-grade-semester',
        'app-unit-category',
      ];
      const backupData: Record<string, any> = {};
      for (const k of keysToExport) {
        const item = localStorage.getItem(k);
        if (item) {
          try {
            backupData[k] = JSON.parse(item);
          } catch {
            backupData[k] = item;
          }
        }
      }
      backupData._exportDate = new Date().toISOString();
      backupData._app = 'Caja de Herramientas';

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caja-de-herramientas-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('Copia de seguridad descargada en JSON');
    } catch {
      toastError('Error al exportar los datos');
    }
  };

  // Import application data
  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data || typeof data !== 'object') {
          throw new Error('Archivo inválido');
        }

        for (const [key, val] of Object.entries(data)) {
          if (key.startsWith('_')) continue;
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        }

        window.dispatchEvent(new Event('local-storage'));
        success('¡Datos restaurados con éxito!');
        setTimeout(() => window.location.reload(), 400);
      } catch {
        toastError('El archivo no contiene un JSON de copia de seguridad válido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear local storage
  const handleClearAllData = () => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas restablecer la aplicación y borrar todos los datos locales (favoritos, paletas, notas)? Esta acción no se puede deshacer.'
      )
    ) {
      localStorage.clear();
      success('Datos locales eliminados');
      setTimeout(() => window.location.reload(), 300);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes y Personalización"
      description="Configura la apariencia y administra tus datos locales"
      maxWidth="md"
    >
      <div className="space-y-6 text-xs">
        {/* Theme Mode Selector */}
        <div className="space-y-2">
          <label className="font-bold uppercase tracking-wider text-slate-500 block">
            Modo de Apariencia
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Claro', icon: Sun },
              { id: 'dark', label: 'Oscuro', icon: Moon },
              { id: 'system', label: 'Sistema', icon: Laptop },
            ].map((t) => {
              const IconComp = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--accent-color)] bg-[var(--accent-subtle)] text-[var(--accent-text)] font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="w-5 h-5 mb-1.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 Pastel Accent Colors */}
        <div className="space-y-2">
          <label className="font-bold uppercase tracking-wider text-slate-500 block">
            Color de Acento Pastel (6 opciones)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACCENT_OPTIONS.map((opt) => {
              const isSelected = accent === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAccent(opt.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/80 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: opt.color }}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="truncate">{opt.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="font-bold uppercase tracking-wider text-slate-500 block">
            Copia de Seguridad y Datos Locales
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportAll}
            >
              Exportar todo (JSON)
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Restaurar desde JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportAll}
            />
          </div>

          <button
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition text-xs font-semibold pt-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar todos los datos locales y restablecer</span>
          </button>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Privacidad 100% Local</p>
            <p className="text-[11px] leading-relaxed opacity-90">
              Todo se procesa en tu dispositivo, nada se sube a ningún servidor ni se comparte con terceros.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
