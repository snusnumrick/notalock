# Theming Guidelines

This document outlines the theming system for Notalock and provides guidelines for implementing theme-aware components.

## Theme System Overview

Notalock uses a comprehensive theming system that supports light, dark, and system preference modes. The theme system is built on:

1. CSS variables for color definitions
2. Tailwind utility classes for accessing these variables
3. React context for theme state management
4. Local storage for persisting user preferences

## Theme Variables

Theme variables are defined in `app/styles/tailwind.css` and follow a consistent naming convention:

```css
:root {
  /* Base system */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  /* ... */

  /* Notalock specific */
  --page-bg: 0 0% 98%;
  --card-bg: 0 0% 100%;
  --card-hover: 210 40% 96.1%;
  --text-primary: 222.2 84% 4.9%;
  --text-secondary: 215.4 16.3% 46.9%;
  --button-primary: 221.2 83.2% 53.3%;
  --button-primary-hover: 221.2 83.2% 47.3%;
  --button-primary-text: 0 0% 100%;
  /* ... */
}

.dark, [data-theme="dark"] {
  /* Dark mode overrides */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */

  /* Notalock dark mode specific */
  --page-bg: 222.2 84% 4.9%;
  --card-bg: 223 47% 11%;
  --card-hover: 215 28% 17%;
  --text-primary: 210 40% 98%;
  --text-secondary: 215 20.2% 65.1%;
  --button-primary: 221.2 83.2% 53.3%;
  --button-primary-hover: 221.2 83.2% 60%;
  /* ... */
}
```

## Tailwind Configuration

The theme variables are mapped to Tailwind utility classes in `tailwind.config.cjs`:

```javascript
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Base system
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ...

        // Notalock specific
        page: {
          bg: "hsl(var(--page-bg))",
        },
        product: {
          card: "hsl(var(--card-bg))",
          hover: "hsl(var(--card-hover))",
        },
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
        },
        btn: {
          primary: "hsl(var(--button-primary))",
          "primary-hover": "hsl(var(--button-primary-hover))",
          "primary-text": "hsl(var(--button-primary-text))",
        },
        // ...
      },
    },
  },
}
```

## Theme Provider

The theme provider is implemented in `app/components/theme/theme-provider.tsx` and provides React context for theme state:

```tsx
// Example usage
import { ThemeProvider } from "~/components/theme/theme-provider";

// In root component
<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>
```

## Theme Toggle

A theme toggle component is available at `app/components/theme/theme-toggle.tsx` and can be used to allow users to switch between themes:

```tsx
import { ThemeToggle } from "~/components/theme/theme-toggle";

// In header or nav
<div className="flex items-center">
  <ThemeToggle />
</div>
```

## Using Theme Variables in Components

### Basic Usage

Use Tailwind utility classes to apply theme-aware styles:

```tsx
// Theme-aware component
function ThemedCard({ title, description, children }) {
  return (
    <div className="bg-product-card text-text-primary rounded-lg border border-border p-6 shadow-sm">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="text-text-secondary">{description}</p>
      <div className="pt-4">{children}</div>
    </div>
  );
}
```

### Accessing Theme in Components

Use the `useTheme` hook to programmatically access or change the theme:

```tsx
import { useTheme } from "~/components/theme/theme-provider";

function ThemeAwareComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>
        Switch to Dark Mode
      </button>
    </div>
  );
}
```

## Theme Variable Categories

### Page Structure

- `bg-page-bg`: Main page background
- `text-text-primary`: Primary text color
- `text-text-secondary`: Secondary/muted text color
- `border-border`: Standard border color

### Card and Container Elements

- `bg-product-card`: Card/container background
- `bg-product-hover`: Hover state background
- `text-card-foreground`: Text inside cards

### Buttons and Interactive Elements

- `bg-btn-primary`: Primary button background
- `bg-btn-primary-hover`: Primary button hover state
- `text-btn-primary-text`: Button text color
- `text-btn-primary`: Text with button color (for links, etc.)

## Best Practices

1. **Never use hardcoded colors**
   - ❌ `className="text-gray-900 bg-white"`
   - ✅ `className="text-text-primary bg-product-card"`

2. **Use semantic color variables**
   - ❌ `className="bg-blue-600"` (Hardcoded color)
   - ✅ `className="bg-btn-primary"` (Semantic purpose)

3. **Consider contrast in both themes**
   - Ensure text remains readable in both light and dark modes
   - Test components in both themes

4. **Use theme-specific hover states**
   - ❌ `hover:bg-gray-100` (Only works well in light mode)
   - ✅ `hover:bg-product-hover` (Works in both themes)

5. **Handle special cases with theme conditionals**
   - Use `dark:` variant for dark-mode specific overrides
   - Example: `className="bg-product-card dark:bg-gray-800"`

6. **Group related styles with consistent variables**
   - Group button styles: `bg-btn-primary text-btn-primary-text`
   - Group card styles: `bg-product-card text-text-primary border-border`

## Common Patterns

### Card Components

```tsx
<div className="bg-product-card border border-border rounded-lg p-4 shadow-sm">
  <h3 className="text-text-primary font-medium">Card Title</h3>
  <p className="text-text-secondary mt-2">Card description text</p>
</div>
```

### Buttons

```tsx
<button className="bg-btn-primary hover:bg-btn-primary-hover text-btn-primary-text px-4 py-2 rounded-md">
  Primary Button
</button>

<button className="border border-border bg-product-card hover:bg-product-hover text-text-primary px-4 py-2 rounded-md">
  Secondary Button
</button>
```

### Text and Typography

```tsx
<h1 className="text-text-primary text-2xl font-bold">Main Heading</h1>
<p className="text-text-primary">Primary text for important content.</p>
<p className="text-text-secondary">Secondary text for supporting information.</p>
<a className="text-btn-primary hover:underline">Link text</a>
```

### Form Elements

```tsx
<div className="space-y-4">
  <label className="block text-text-primary">
    Field label
    <input 
      type="text"
      className="mt-1 block w-full bg-product-card border border-border rounded-md px-3 py-2"
    />
  </label>
  <p className="text-text-secondary text-sm">Field description or help text</p>
</div>
```

## Testing Themes

1. **Visual Testing**
   - Toggle between themes using the ThemeToggle component
   - Verify contrast and readability in both themes
   - Check hover states and interactions in both themes

2. **Programmatic Testing**
   - Use the useTheme hook to access theme state
   - Verify theme changes update component appearance
   - Test system theme detection

## Anti-patterns to Avoid

- ❌ Mixing hardcoded colors with theme variables
- ❌ Using theme-specific styles that don't adapt to both themes
- ❌ Overriding theme colors globally instead of using component-specific styles
- ❌ Adding inline styles that bypass the theme system
- ❌ Assuming a particular theme is active without checking
- ❌ Using overly specific color names instead of semantic variables

## Implementation Checklist

When implementing theme support in a new component or feature:

- [ ] Replace all hardcoded colors with theme variables
- [ ] Test in both light and dark modes
- [ ] Ensure proper contrast in both themes
- [ ] Handle hover states appropriately
- [ ] Consider edge cases (system theme changes, etc.)
- [ ] Use semantic variable names based on purpose, not appearance

## Related Documents
- [Development Guidelines](./guidelines.md)
- [Code Organization](./code-organization.md)
