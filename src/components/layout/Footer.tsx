import React from 'react';
import { ShieldCheck, Github, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-hairline bg-[var(--bg-panel)] mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        {/* Left: Branding & Privacy Note */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
            Todo se procesa en tu dispositivo // 100% Client-Side
          </span>
        </div>

        {/* Center / Right: Version & Repo link */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-faint)]">
          <span>v2.0.0 (2026)</span>
          <span>•</span>
          <a
            href="https://github.com/MarcosGr14/Caja-de-herramientas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition text-[11px] uppercase tracking-wider"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
      </div>
    </footer>
  );
};
