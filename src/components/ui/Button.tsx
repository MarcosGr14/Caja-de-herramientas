import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'secondary',
      size = 'md',
      icon,
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Editorial aesthetic: rectangular, subtle 6px corners, uppercase 12px with tracking, AA contrast
    const base =
      'inline-flex items-center justify-center font-medium uppercase tracking-wider transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] cursor-pointer rounded-[6px]';

    const sizes = {
      sm: 'px-3 py-1.5 text-[11px] gap-1.5 min-h-[38px]',
      md: 'px-4 py-2 text-[12px] gap-2 min-h-[44px]',
      lg: 'px-6 py-2.5 text-[13px] gap-2.5 min-h-[48px]',
    };

    const variants = {
      // Primary: solid dark panel (or accent), high contrast, editorial
      primary:
        'bg-[#111113] hover:bg-[#26262B] text-white dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] dark:text-[#111113] focus:ring-[var(--accent-ring)] shadow-xs',
      accent:
        'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white focus:ring-[var(--accent-ring)] shadow-xs',
      secondary:
        'bg-[#F1F1F3] hover:bg-[#E7E7EA] text-[#111113] dark:bg-[#1E1E23] dark:hover:bg-[#26262B] dark:text-[#F4F4F5] focus:ring-stone-400/40 border border-hairline',
      outline:
        'border border-hairline hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[#111113] dark:text-[#F4F4F5] focus:ring-[var(--accent-ring)] bg-transparent',
      ghost:
        'hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[#6B6B72] hover:text-[#111113] dark:text-[#9A9AA2] dark:hover:text-[#F4F4F5] focus:ring-stone-400/30',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-400',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
