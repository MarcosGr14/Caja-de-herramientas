import React from 'react';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  fullWidth = false,
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 sm:gap-4 border-b border-hairline overflow-x-auto scrollbar-none ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center justify-center gap-2 py-3 px-2 sm:px-3 text-[12px] font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap shrink-0 ${
              fullWidth ? 'flex-1' : ''
            } ${
              isActive
                ? 'text-[var(--text-main)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {tab.icon && (
              <span className={`shrink-0 ${isActive ? 'text-[var(--accent-color)]' : 'opacity-70'}`}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                    : 'bg-[#F1F1F3] dark:bg-[#1E1E23] text-[var(--text-muted)]'
                }`}
              >
                {tab.badge}
              </span>
            )}

            {/* Active underline in accent color */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-color)]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
