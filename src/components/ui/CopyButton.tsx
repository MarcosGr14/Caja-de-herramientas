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
  copiedLabel = 'Copiado',
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
    outline: 'border border-hairline hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[var(--text-main)]',
    ghost: 'hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[var(--text-muted)] hover:text-[var(--text-main)]',
    secondary: 'bg-[#F1F1F3] hover:bg-[#E7E7EA] dark:bg-[#1E1E23] dark:hover:bg-[#26262B] text-[var(--text-main)]',
    primary: 'bg-[#111113] hover:bg-[#26262B] text-white dark:bg-[#F4F4F5] dark:text-[#111113]',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center font-medium uppercase tracking-wider rounded-[6px] transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
        isSmall ? 'px-2.5 py-1 text-[11px] gap-1.5 min-h-[34px]' : 'px-3.5 py-1.5 text-[12px] gap-2 min-h-[44px]'
      } ${variantStyles[variant]} ${
        copied
          ? '!bg-[var(--accent-subtle)] !text-[var(--accent-text)] !border-[var(--accent-border)]'
          : ''
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[var(--accent-color)]`} />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-75`} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
