import { Theme, ThemeName } from './types';

const themes: Record<ThemeName, () => Promise<Theme>> = {
  default: () => import('./default/theme').then(m => m.default),
  nova: () => import('./nova/theme').then(m => m.default),
  'nova-nebula': () => import('./nova-nebula/theme').then(m => m.default),
};

export async function loadTheme(name: ThemeName): Promise<Theme> {
  const loader = themes[name];
  if (!loader) {
    console.warn(`Theme "${name}" not found, falling back to default`);
    return loadTheme('default');
  }
  return loader();
}

export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themes);
}

export { themes };
