import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'secondary', size = 'md', icon, loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[44px]',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[48px]',
    };

    const variants = {
      primary:
        'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white shadow-sm shadow-[var(--accent-ring)] focus:ring-[var(--accent-ring)]',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-400/40',
      outline:
        'border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200 focus:ring-slate-400/40',
      ghost:
        'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200 focus:ring-slate-400/30',
      danger:
        'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 focus:ring-rose-400',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
