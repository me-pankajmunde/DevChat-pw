export interface ThemeColors {
  name: string
  type?: 'glassy' | 'solid'
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
  }
}

export const themes: Record<string, ThemeColors> = {
  'cyber-teal': {
    name: 'Cyber Teal',
    colors: {
      background: 'oklch(0.15 0.01 240)',
      foreground: 'oklch(0.92 0.02 200)',
      card: 'oklch(0.20 0.01 240)',
      cardForeground: 'oklch(0.92 0.02 200)',
      popover: 'oklch(0.20 0.01 240)',
      popoverForeground: 'oklch(0.92 0.02 200)',
      primary: 'oklch(0.65 0.15 195)',
      primaryForeground: 'oklch(0.15 0.01 240)',
      secondary: 'oklch(0.25 0.02 240)',
      secondaryForeground: 'oklch(0.92 0.02 200)',
      muted: 'oklch(0.22 0.01 240)',
      mutedForeground: 'oklch(0.60 0.02 200)',
      accent: 'oklch(0.70 0.20 290)',
      accentForeground: 'oklch(1 0 0)',
      destructive: 'oklch(0.60 0.22 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.30 0.02 240)',
      input: 'oklch(0.30 0.02 240)',
      ring: 'oklch(0.70 0.20 290)',
    },
  },
  'sunset-orange': {
    name: 'Sunset Orange',
    colors: {
      background: 'oklch(0.14 0.02 30)',
      foreground: 'oklch(0.95 0.01 80)',
      card: 'oklch(0.19 0.02 30)',
      cardForeground: 'oklch(0.95 0.01 80)',
      popover: 'oklch(0.19 0.02 30)',
      popoverForeground: 'oklch(0.95 0.01 80)',
      primary: 'oklch(0.68 0.20 45)',
      primaryForeground: 'oklch(0.14 0.02 30)',
      secondary: 'oklch(0.24 0.03 30)',
      secondaryForeground: 'oklch(0.95 0.01 80)',
      muted: 'oklch(0.21 0.02 30)',
      mutedForeground: 'oklch(0.62 0.02 50)',
      accent: 'oklch(0.72 0.24 60)',
      accentForeground: 'oklch(0.14 0.02 30)',
      destructive: 'oklch(0.58 0.24 28)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.29 0.03 30)',
      input: 'oklch(0.29 0.03 30)',
      ring: 'oklch(0.72 0.24 60)',
    },
  },
  'forest-green': {
    name: 'Forest Green',
    colors: {
      background: 'oklch(0.13 0.02 160)',
      foreground: 'oklch(0.93 0.01 160)',
      card: 'oklch(0.18 0.02 160)',
      cardForeground: 'oklch(0.93 0.01 160)',
      popover: 'oklch(0.18 0.02 160)',
      popoverForeground: 'oklch(0.93 0.01 160)',
      primary: 'oklch(0.62 0.18 155)',
      primaryForeground: 'oklch(0.13 0.02 160)',
      secondary: 'oklch(0.23 0.03 160)',
      secondaryForeground: 'oklch(0.93 0.01 160)',
      muted: 'oklch(0.20 0.02 160)',
      mutedForeground: 'oklch(0.59 0.02 160)',
      accent: 'oklch(0.70 0.22 135)',
      accentForeground: 'oklch(0.13 0.02 160)',
      destructive: 'oklch(0.60 0.22 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.28 0.03 160)',
      input: 'oklch(0.28 0.03 160)',
      ring: 'oklch(0.70 0.22 135)',
    },
  },
  'royal-purple': {
    name: 'Royal Purple',
    colors: {
      background: 'oklch(0.14 0.02 290)',
      foreground: 'oklch(0.94 0.01 290)',
      card: 'oklch(0.19 0.02 290)',
      cardForeground: 'oklch(0.94 0.01 290)',
      popover: 'oklch(0.19 0.02 290)',
      popoverForeground: 'oklch(0.94 0.01 290)',
      primary: 'oklch(0.65 0.22 290)',
      primaryForeground: 'oklch(0.14 0.02 290)',
      secondary: 'oklch(0.24 0.03 290)',
      secondaryForeground: 'oklch(0.94 0.01 290)',
      muted: 'oklch(0.21 0.02 290)',
      mutedForeground: 'oklch(0.61 0.02 290)',
      accent: 'oklch(0.72 0.25 320)',
      accentForeground: 'oklch(0.14 0.02 290)',
      destructive: 'oklch(0.60 0.22 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.29 0.03 290)',
      input: 'oklch(0.29 0.03 290)',
      ring: 'oklch(0.72 0.25 320)',
    },
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    colors: {
      background: 'oklch(0.13 0.02 230)',
      foreground: 'oklch(0.93 0.01 230)',
      card: 'oklch(0.18 0.02 230)',
      cardForeground: 'oklch(0.93 0.01 230)',
      popover: 'oklch(0.18 0.02 230)',
      popoverForeground: 'oklch(0.93 0.01 230)',
      primary: 'oklch(0.63 0.17 235)',
      primaryForeground: 'oklch(0.13 0.02 230)',
      secondary: 'oklch(0.23 0.03 230)',
      secondaryForeground: 'oklch(0.93 0.01 230)',
      muted: 'oklch(0.20 0.02 230)',
      mutedForeground: 'oklch(0.60 0.02 230)',
      accent: 'oklch(0.68 0.20 200)',
      accentForeground: 'oklch(0.13 0.02 230)',
      destructive: 'oklch(0.60 0.22 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.28 0.03 230)',
      input: 'oklch(0.28 0.03 230)',
      ring: 'oklch(0.68 0.20 200)',
    },
  },
  'ruby-red': {
    name: 'Ruby Red',
    colors: {
      background: 'oklch(0.14 0.02 20)',
      foreground: 'oklch(0.94 0.01 20)',
      card: 'oklch(0.19 0.02 20)',
      cardForeground: 'oklch(0.94 0.01 20)',
      popover: 'oklch(0.19 0.02 20)',
      popoverForeground: 'oklch(0.94 0.01 20)',
      primary: 'oklch(0.62 0.23 15)',
      primaryForeground: 'oklch(0.98 0.01 20)',
      secondary: 'oklch(0.24 0.03 20)',
      secondaryForeground: 'oklch(0.94 0.01 20)',
      muted: 'oklch(0.21 0.02 20)',
      mutedForeground: 'oklch(0.61 0.02 20)',
      accent: 'oklch(0.70 0.25 350)',
      accentForeground: 'oklch(0.98 0.01 20)',
      destructive: 'oklch(0.58 0.24 28)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.29 0.03 20)',
      input: 'oklch(0.29 0.03 20)',
      ring: 'oklch(0.70 0.25 350)',
    },
  },
  'golden-amber': {
    name: 'Golden Amber',
    colors: {
      background: 'oklch(0.14 0.02 70)',
      foreground: 'oklch(0.94 0.01 70)',
      card: 'oklch(0.19 0.02 70)',
      cardForeground: 'oklch(0.94 0.01 70)',
      popover: 'oklch(0.19 0.02 70)',
      popoverForeground: 'oklch(0.94 0.01 70)',
      primary: 'oklch(0.70 0.18 85)',
      primaryForeground: 'oklch(0.14 0.02 70)',
      secondary: 'oklch(0.24 0.03 70)',
      secondaryForeground: 'oklch(0.94 0.01 70)',
      muted: 'oklch(0.21 0.02 70)',
      mutedForeground: 'oklch(0.62 0.02 70)',
      accent: 'oklch(0.75 0.20 95)',
      accentForeground: 'oklch(0.14 0.02 70)',
      destructive: 'oklch(0.60 0.22 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.29 0.03 70)',
      input: 'oklch(0.29 0.03 70)',
      ring: 'oklch(0.75 0.20 95)',
    },
  },
  'slate-gray': {
    name: 'Slate Gray',
    colors: {
      background: 'oklch(0.15 0.005 240)',
      foreground: 'oklch(0.93 0.005 240)',
      card: 'oklch(0.20 0.005 240)',
      cardForeground: 'oklch(0.93 0.005 240)',
      popover: 'oklch(0.20 0.005 240)',
      popoverForeground: 'oklch(0.93 0.005 240)',
      primary: 'oklch(0.65 0.08 240)',
      primaryForeground: 'oklch(0.98 0.005 240)',
      secondary: 'oklch(0.25 0.01 240)',
      secondaryForeground: 'oklch(0.93 0.005 240)',
      muted: 'oklch(0.22 0.005 240)',
      mutedForeground: 'oklch(0.60 0.01 240)',
      accent: 'oklch(0.70 0.12 260)',
      accentForeground: 'oklch(0.98 0.005 240)',
      destructive: 'oklch(0.60 0.22 25)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.30 0.01 240)',
      input: 'oklch(0.30 0.01 240)',
      ring: 'oklch(0.70 0.12 260)',
    },
  },
  'glassy-dark': {
    name: 'Glassy Dark',
    type: 'glassy',
    colors: {
      background: 'oklch(0.1 0.02 240 / 0.8)',
      foreground: 'oklch(0.98 0 0)',
      card: 'oklch(0.15 0.02 240 / 0.4)',
      cardForeground: 'oklch(0.98 0 0)',
      popover: 'oklch(0.15 0.02 240 / 0.6)',
      popoverForeground: 'oklch(0.98 0 0)',
      primary: 'oklch(0.6 0.15 240 / 0.8)',
      primaryForeground: 'oklch(1 0 0)',
      secondary: 'oklch(0.25 0.05 240 / 0.5)',
      secondaryForeground: 'oklch(0.98 0 0)',
      muted: 'oklch(0.2 0.02 240 / 0.4)',
      mutedForeground: 'oklch(0.7 0 0)',
      accent: 'oklch(0.6 0.15 280 / 0.6)',
      accentForeground: 'oklch(1 0 0)',
      destructive: 'oklch(0.6 0.2 25 / 0.8)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.3 0.02 240 / 0.3)',
      input: 'oklch(0.2 0.02 240 / 0.4)',
      ring: 'oklch(0.6 0.15 240 / 0.8)',
    },
  },
  'glassy-light': {
    name: 'Glassy Light',
    type: 'glassy',
    colors: {
      background: 'oklch(0.95 0.01 240 / 0.85)',
      foreground: 'oklch(0.15 0.02 240)',
      card: 'oklch(0.98 0.01 240 / 0.5)',
      cardForeground: 'oklch(0.15 0.02 240)',
      popover: 'oklch(0.98 0.01 240 / 0.7)',
      popoverForeground: 'oklch(0.15 0.02 240)',
      primary: 'oklch(0.55 0.15 240 / 0.8)',
      primaryForeground: 'oklch(1 0 0)',
      secondary: 'oklch(0.9 0.02 240 / 0.5)',
      secondaryForeground: 'oklch(0.15 0.02 240)',
      muted: 'oklch(0.9 0.01 240 / 0.5)',
      mutedForeground: 'oklch(0.4 0.02 240)',
      accent: 'oklch(0.55 0.15 280 / 0.6)',
      accentForeground: 'oklch(1 0 0)',
      destructive: 'oklch(0.6 0.2 25 / 0.8)',
      destructiveForeground: 'oklch(1 0 0)',
      border: 'oklch(0.8 0.02 240 / 0.4)',
      input: 'oklch(0.9 0.02 240 / 0.5)',
      ring: 'oklch(0.55 0.15 240 / 0.8)',
    },
  },
}

export function applyTheme(themeId: string) {
  const theme = themes[themeId]
  if (!theme) return

  const root = document.documentElement
  
  if (theme.type === 'glassy') {
    root.classList.add('theme-glassy')
  } else {
    root.classList.remove('theme-glassy')
  }

  root.style.setProperty('--background', theme.colors.background)
  root.style.setProperty('--foreground', theme.colors.foreground)
  root.style.setProperty('--card', theme.colors.card)
  root.style.setProperty('--card-foreground', theme.colors.cardForeground)
  root.style.setProperty('--popover', theme.colors.popover)
  root.style.setProperty('--popover-foreground', theme.colors.popoverForeground)
  root.style.setProperty('--primary', theme.colors.primary)
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground)
  root.style.setProperty('--secondary', theme.colors.secondary)
  root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground)
  root.style.setProperty('--muted', theme.colors.muted)
  root.style.setProperty('--muted-foreground', theme.colors.mutedForeground)
  root.style.setProperty('--accent', theme.colors.accent)
  root.style.setProperty('--accent-foreground', theme.colors.accentForeground)
  root.style.setProperty('--destructive', theme.colors.destructive)
  root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground)
  root.style.setProperty('--border', theme.colors.border)
  root.style.setProperty('--input', theme.colors.input)
  root.style.setProperty('--ring', theme.colors.ring)
}
