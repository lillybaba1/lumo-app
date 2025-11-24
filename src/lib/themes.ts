/**
 * LUMO THEME SYSTEM
 *
 * This file defines the available themes and their metadata.
 * Theme styles are defined in src/styles/themes.css
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: 'light' | 'dark';
  accentColor: string; // For preview thumbnail
  backgroundColor: string; // For preview thumbnail
}

export const themes: Theme[] = [
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Clean & neutral',
    category: 'light',
    accentColor: '#6366F1',
    backgroundColor: '#F7F7FB',
  },
  {
    id: 'warm-boutique',
    name: 'Warm Boutique',
    description: 'Cozy & elegant',
    category: 'light',
    accentColor: '#8B5CF6',
    backgroundColor: '#FBF8F3',
  },
  {
    id: 'dark-luxe',
    name: 'Dark Luxe',
    description: 'Premium & bold',
    category: 'dark',
    accentColor: '#D4AF37',
    backgroundColor: '#0F0F0F',
  },
  {
    id: 'colorful-modern',
    name: 'Colorful Modern',
    description: 'Fresh & vibrant',
    category: 'light',
    accentColor: '#14B8A6',
    backgroundColor: '#FAFAFA',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Simple & timeless',
    category: 'light',
    accentColor: '#404040',
    backgroundColor: '#FCFCFC',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Calm & refreshing',
    category: 'light',
    accentColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm & inviting',
    category: 'light',
    accentColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
];

export const defaultTheme: Theme = themes[0]; // Minimal Light

export function getThemeById(id: string): Theme | undefined {
  return themes.find((theme) => theme.id === id);
}

export function isValidTheme(id: string): boolean {
  return themes.some((theme) => theme.id === id);
}
