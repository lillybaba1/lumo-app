# Lumo Theme System Documentation

## Overview

Lumo uses a comprehensive design token system that allows complete visual customization through themes. Admins can switch between pre-defined themes without touching code, and developers can easily add new themes or use design tokens in components.

## Architecture

### Components

1. **Design Tokens** (`src/styles/themes.css`)
   - CSS custom properties (variables) for all visual elements
   - Base defaults + theme-specific overrides
   - Categories: colors, typography, spacing, borders, shadows, components

2. **Theme Configuration** (`src/lib/themes.ts`)
   - Theme metadata (id, name, description, category, preview colors)
   - Theme validation utilities
   - Available themes list

3. **Theme Provider** (`src/contexts/ThemeContext.tsx`)
   - React context for theme management
   - Client-side theme switching
   - Preview mode support
   - LocalStorage persistence

4. **Admin Interface** (`src/app/admin/appearance/`)
   - Visual theme selector with preview cards
   - Live theme preview before applying
   - Theme persistence to database

5. **Database Integration** (`src/services/settingsService.ts`)
   - Theme storage in `site_settings` Supabase table
   - Server-side theme loading

## Available Themes

| Theme | Category | Description | Accent Color |
|-------|----------|-------------|--------------|
| **Minimal Light** | Light | Clean & neutral | Indigo (#6366F1) |
| **Warm Boutique** | Light | Cozy & elegant | Purple (#8B5CF6) |
| **Dark Luxe** | Dark | Premium & bold | Gold (#D4AF37) |
| **Colorful Modern** | Light | Fresh & vibrant | Teal (#14B8A6) |
| **Monochrome** | Light | Simple & timeless | Dark Gray (#404040) |
| **Ocean Breeze** | Light | Calm & refreshing | Sky Blue (#0EA5E9) |
| **Sunset Glow** | Light | Warm & inviting | Orange (#F97316) |

## Design Tokens

### Colors

#### Background
```css
--color-bg-page              /* Page background */
--color-bg-surface           /* Card/panel background */
--color-bg-surface-secondary /* Alternative surface */
```

#### Text
```css
--color-text-primary   /* Main text color */
--color-text-secondary /* Muted/secondary text */
--color-text-tertiary  /* Even more muted */
--color-text-inverse   /* Text on dark backgrounds */
```

#### Accent
```css
--color-accent        /* Primary accent color */
--color-accent-hover  /* Accent hover state */
--color-accent-soft   /* Accent background tint */
--color-accent-foreground /* Text on accent background */
```

#### Borders
```css
--color-border-subtle /* Subtle borders (cards, inputs) */
--color-border-medium /* Medium emphasis borders */
--color-border-focus  /* Focus ring color */
```

#### Status
```css
--color-success  /* Success states */
--color-warning  /* Warning states */
--color-error    /* Error states */
--color-info     /* Information states */
```

### Typography

#### Font Families
```css
--font-heading /* Headings font family */
--font-body    /* Body text font family */
```

#### Font Sizes
```css
--font-size-xs   /* 12px */
--font-size-sm   /* 14px */
--font-size-base /* 16px */
--font-size-lg   /* 18px */
--font-size-xl   /* 20px */
--font-size-2xl  /* 24px */
--font-size-3xl  /* 30px */
--font-size-4xl  /* 36px */
--font-size-5xl  /* 48px */
--font-size-6xl  /* 60px */
```

#### Font Weights
```css
--font-weight-normal    /* 400 */
--font-weight-medium    /* 500 */
--font-weight-semibold  /* 600 */
--font-weight-bold      /* 700 */
```

#### Line Heights
```css
--line-height-tight   /* 1.2 - for headings */
--line-height-normal  /* 1.5 - for body text */
--line-height-relaxed /* 1.75 - for comfortable reading */
```

### Spacing
```css
--spacing-xs  /* 4px */
--spacing-sm  /* 8px */
--spacing-md  /* 16px */
--spacing-lg  /* 24px */
--spacing-xl  /* 32px */
--spacing-2xl /* 48px */
--spacing-3xl /* 64px */
```

### Border Radius
```css
--radius-sm   /* 6px */
--radius-md   /* 8px */
--radius-lg   /* 12px */
--radius-xl   /* 16px */
--radius-2xl  /* 24px */
--radius-3xl  /* 32px */
--radius-pill /* 9999px - fully rounded */

/* Component-specific */
--radius-card   /* Cards */
--radius-button /* Buttons */
--radius-input  /* Input fields */
--radius-hero   /* Hero section */
```

### Shadows
```css
--shadow-sm /* Subtle shadow */
--shadow-md /* Medium shadow */
--shadow-lg /* Large shadow */
--shadow-xl /* Extra large shadow */

/* Component-specific */
--shadow-card   /* Default card shadow */
--shadow-header /* Header shadow */
--card-hover-shadow /* Card hover state */
```

### Component Tokens

#### Buttons
```css
--button-primary-bg       /* Primary button background */
--button-primary-fg       /* Primary button text */
--button-primary-hover    /* Primary button hover state */
--button-secondary-bg     /* Secondary button background */
--button-secondary-fg     /* Secondary button text */
--button-secondary-border /* Secondary button border */
--button-secondary-hover-bg /* Secondary button hover background */
```

#### Inputs
```css
--input-bg           /* Input background */
--input-border       /* Input border */
--input-focus-border /* Input focus border */
--input-focus-ring   /* Input focus ring */
```

#### Cards
```css
--card-bg          /* Card background */
--card-border      /* Card border */
--card-hover-shadow /* Card hover shadow */
```

## Usage Guide

### Using Tokens in Components

Instead of hard-coding colors or sizes, use CSS variables:

```tsx
// ❌ DON'T DO THIS
<div className="bg-white text-gray-900 rounded-lg p-4">
  <h2 className="text-2xl font-bold text-indigo-600">Title</h2>
</div>

// ✅ DO THIS
<div
  style={{
    backgroundColor: 'var(--color-bg-surface)',
    color: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--spacing-md)',
  }}
>
  <h2
    style={{
      fontSize: 'var(--font-size-2xl)',
      fontWeight: 'var(--font-weight-bold)',
      color: 'var(--color-accent)',
    }}
  >
    Title
  </h2>
</div>
```

### Button Example

```tsx
<Button
  style={{
    backgroundColor: 'var(--button-primary-bg)',
    color: 'var(--button-primary-fg)',
    borderRadius: 'var(--radius-button)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
  }}
>
  Click Me
</Button>
```

### Card Example

```tsx
<Card
  style={{
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
  }}
>
  <CardHeader style={{ color: 'var(--color-text-primary)' }}>
    Card Title
  </CardHeader>
  <CardContent style={{ color: 'var(--color-text-secondary)' }}>
    Card content goes here
  </CardContent>
</Card>
```

## Adding a New Theme

### 1. Define Theme in CSS

Add a new `[data-theme="your-theme-id"]` block in `src/styles/themes.css`:

```css
[data-theme="forest-green"] {
  --color-bg-page: #F0F9F4;
  --color-bg-surface: #FFFFFF;
  --color-bg-surface-secondary: #E8F5EC;

  --color-text-primary: #1B4332;
  --color-text-secondary: #52796F;
  --color-text-tertiary: #74A98A;

  --color-accent: #2D6A4F;
  --color-accent-hover: #1B4332;
  --color-accent-soft: #D8F3DC;

  /* Override other tokens as needed */
}
```

### 2. Add Theme Metadata

Add theme to `src/lib/themes.ts`:

```typescript
export const themes: Theme[] = [
  // ... existing themes
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural & organic',
    category: 'light',
    accentColor: '#2D6A4F',
    backgroundColor: '#F0F9F4',
  },
];
```

### 3. Test the Theme

1. Restart dev server
2. Go to `/admin/appearance`
3. Your new theme should appear in the grid
4. Click to preview and apply

## Admin Theme Management

### Changing the Active Theme

1. Navigate to **Admin → Appearance**
2. Browse available themes in the grid
3. Click a theme to preview it (banner appears at top)
4. Click **"Save & Apply"** to make it the default theme
5. Click **"Cancel"** to exit preview mode

The selected theme will:
- Apply immediately to all pages
- Be stored in the database
- Persist across sessions
- Apply to all visitors

### Preview Mode

- Preview mode only affects the admin's view
- Other users still see the currently applied theme
- Preview persists while browsing the site
- Exit preview by clicking "Cancel" or applying the theme

## Client-Side Theme Hooks

For advanced use cases, you can use the theme context:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, previewTheme, isPreviewMode } = useTheme();

  // Current active theme ID
  console.log(theme); // e.g., "minimal-light"

  // Preview a theme (admin only)
  const handlePreview = () => {
    setPreviewTheme('dark-luxe');
  };

  // Exit preview
  const handleCancelPreview = () => {
    setPreviewTheme(null);
  };

  return (
    <div>
      {isPreviewMode && <div>Previewing a theme!</div>}
    </div>
  );
}
```

## Best Practices

### 1. Always Use Tokens
Never hard-code colors, spacing, or typography values. Always use design tokens.

### 2. Avoid Theme-Specific Logic
Don't check which theme is active and render differently. Use tokens instead:

```tsx
// ❌ AVOID
if (theme === 'dark-luxe') {
  return <div className="bg-black text-white">...</div>;
}

// ✅ PREFER
return (
  <div style={{
    backgroundColor: 'var(--color-bg-surface)',
    color: 'var(--color-text-primary)',
  }}>...</div>
);
```

### 3. Test All Themes
After adding a new component, test it with multiple themes:
- Light themes (Minimal Light, Warm Boutique)
- Dark themes (Dark Luxe)
- Colorful themes (Colorful Modern, Ocean Breeze)

### 4. Use Semantic Token Names
Prefer component-specific tokens when available:
- Use `--button-primary-bg` instead of `--color-accent`
- Use `--card-bg` instead of `--color-bg-surface`

### 5. Maintain Consistent Spacing
Use spacing tokens for padding, margin, and gaps:
```css
padding: var(--spacing-md);
margin-bottom: var(--spacing-lg);
gap: var(--spacing-sm);
```

## Troubleshooting

### Theme not applying?
1. Check browser console for errors
2. Verify `data-theme` attribute on `<html>` element
3. Clear browser cache
4. Restart dev server

### Tokens not working?
1. Ensure `src/styles/themes.css` is imported in `src/app/globals.css`
2. Check that you're using `var(--token-name)` syntax
3. Verify the token exists in `themes.css`

### Theme not persisting?
1. Check Supabase connection
2. Verify `site_settings` table exists
3. Check browser console for API errors
4. Ensure you clicked "Save & Apply"

## File Reference

```
src/
├── styles/
│   └── themes.css              # Design tokens & theme definitions
├── lib/
│   └── themes.ts               # Theme metadata & utilities
├── contexts/
│   └── ThemeContext.tsx        # Theme provider & hooks
├── app/
│   ├── layout.tsx              # Root layout with ThemeProvider
│   └── admin/
│       └── appearance/
│           ├── page.tsx        # Admin theme selector UI
│           ├── theme-selector.tsx
│           └── actions.ts      # Theme management API
├── services/
│   └── settingsService.ts      # Database integration
└── components/
    ├── hero.tsx                # Example: Hero with tokens
    └── product-card.tsx        # Example: Product card with tokens
```

## Summary

The Lumo theme system provides:

✅ **7 pre-defined themes** with more easily added
✅ **100+ design tokens** for complete customization
✅ **Admin theme switcher** with live preview
✅ **Zero code changes** needed to switch themes
✅ **Database persistence** across sessions
✅ **Type-safe** theme configuration
✅ **Responsive design** across all themes

For questions or issues, check the troubleshooting section or review the example components (`hero.tsx`, `product-card.tsx`).
