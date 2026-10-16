import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'menu' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95 ${
          variant === 'header'
            ? 'px-3 py-1.5 text-xs bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] hover:bg-[var(--accent-color)] hover:text-white'
            : 'w-full px-3 py-2 text-sm bg-[var(--accent-color)] text-white'
        }`}
        title="Instalar aplicación en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar app</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            variant === 'header'
              ? 'px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              : 'w-full px-3 py-2 text-sm bg-slate-100 text-slate-800'
          }`}
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        <Modal
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          title="Instalar en iPhone / iPad"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>Para añadir <strong>Caja de Herramientas</strong> a tu pantalla de inicio en iOS:</p>
            <ol className="list-decimal list-inside space-y-2 font-medium bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <li>
                Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra inferior de Safari.
              </li>
              <li>
                Desplázate hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong>.
              </li>
              <li>
                Toca <strong>Añadir</strong> en la esquina superior derecha.
              </li>
            </ol>
            <p className="text-slate-500">
              ¡Listo! Podrás abrirla como una aplicación nativa, a pantalla completa y sin conexión a internet.
            </p>
            <Button variant="primary" size="sm" className="w-full" onClick={() => setShowIOSGuide(false)}>
              Entendido
            </Button>
          </div>
        </Modal>
      </>
    );
  }

  return null;
};
