import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useCopy } from '../../hooks/useCopy';
import { useToast } from './Toast';

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'outline' | 'ghost' | 'secondary' | 'primary';
  showToast?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copiar',
  copiedLabel = '¡Copiado!',
  className = '',
  size = 'sm',
  variant = 'outline',
  showToast = true,
}) => {
  const { copied, copy } = useCopy();
  const { success } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copy(text);
    if (ok && showToast) {
      success('Copiado al portapapeles');
    }
  };

  const isSmall = size === 'sm';

  const variantStyles = {
    outline: 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
    primary: 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white shadow-sm',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
        isSmall ? 'px-2.5 py-1 text-xs gap-1.5 min-h-[32px]' : 'px-3.5 py-1.5 text-sm gap-2 min-h-[40px]'
      } ${variantStyles[variant]} ${copied ? '!bg-emerald-50 !text-emerald-700 dark:!bg-emerald-950/40 dark:!text-emerald-300 !border-emerald-300 dark:!border-emerald-800' : ''} ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-emerald-600 dark:text-emerald-400`} />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
