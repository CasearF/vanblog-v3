export interface ThemeConfig {
  name: string;
  description?: string;
  version?: string;
  author?: string;
}

export interface ThemeComponents {
  [key: string]: React.ComponentType<any> | undefined;
}

export interface Theme {
  config: ThemeConfig;
  components: ThemeComponents;
}

export type ThemeName = 'default' | 'nova' | string;
