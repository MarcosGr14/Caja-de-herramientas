import React from 'react';

export const ToolSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Main 2-column or stacked layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-44 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        <div className="h-80 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-44 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
          <div className="flex justify-between items-center">
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
