import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className = '', hover = false, children, ...props }) => {
  return (
    <div
      className={`bg-[var(--bg-panel)] rounded-[14px] border border-hairline p-4 sm:p-6 transition-all duration-200 ${
        hover
          ? 'hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/50 hover:border-slate-300 dark:hover:border-zinc-700'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
