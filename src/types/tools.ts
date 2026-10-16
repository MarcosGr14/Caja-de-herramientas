import React from 'react';

export type ToolCategory =
  | 'texto'
  | 'desarrollo'
  | 'diseno'
  | 'seguridad'
  | 'calculo'
  | 'pdf';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  shortName: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  description: string;
  keywords: string[];
  component: React.LazyExoticComponent<React.ComponentType>;
  badge?: string;
}
