import { Wallpaper } from './types'

export const wallpapers: Record<Wallpaper, { name: string; pattern: string }> = {
  none: {
    name: 'None',
    pattern: '',
  },
  dots: {
    name: 'Dots',
    pattern: `
      radial-gradient(circle at center, oklch(1 0 0 / 0.03) 1px, transparent 1px)
    `,
  },
  grid: {
    name: 'Grid',
    pattern: `
      linear-gradient(oklch(1 0 0 / 0.03) 1px, transparent 1px),
      linear-gradient(90deg, oklch(1 0 0 / 0.03) 1px, transparent 1px)
    `,
  },
  waves: {
    name: 'Waves',
    pattern: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 20px,
        oklch(1 0 0 / 0.02) 20px,
        oklch(1 0 0 / 0.02) 40px
      )
    `,
  },
  geometric: {
    name: 'Geometric',
    pattern: `
      linear-gradient(45deg, oklch(1 0 0 / 0.02) 25%, transparent 25%),
      linear-gradient(-45deg, oklch(1 0 0 / 0.02) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, oklch(1 0 0 / 0.02) 75%),
      linear-gradient(-45deg, transparent 75%, oklch(1 0 0 / 0.02) 75%)
    `,
  },
  bubbles: {
    name: 'Bubbles',
    pattern: `
      radial-gradient(circle at 20% 50%, oklch(1 0 0 / 0.03) 2%, transparent 2%),
      radial-gradient(circle at 80% 80%, oklch(1 0 0 / 0.03) 1.5%, transparent 1.5%),
      radial-gradient(circle at 40% 20%, oklch(1 0 0 / 0.02) 2.5%, transparent 2.5%),
      radial-gradient(circle at 60% 70%, oklch(1 0 0 / 0.03) 1.8%, transparent 1.8%)
    `,
  },
  diagonal: {
    name: 'Diagonal Lines',
    pattern: `
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 15px,
        oklch(1 0 0 / 0.02) 15px,
        oklch(1 0 0 / 0.02) 16px
      )
    `,
  },
  hexagon: {
    name: 'Hexagon',
    pattern: `
      linear-gradient(60deg, oklch(1 0 0 / 0.02) 25%, transparent 25%),
      linear-gradient(-60deg, oklch(1 0 0 / 0.02) 25%, transparent 25%),
      linear-gradient(120deg, transparent 75%, oklch(1 0 0 / 0.02) 75%),
      linear-gradient(-120deg, transparent 75%, oklch(1 0 0 / 0.02) 75%)
    `,
  },
  custom: {
    name: 'Custom Image',
    pattern: '',
  },
}

export function getWallpaperStyle(
  wallpaper: Wallpaper = 'none', 
  customImageUrl?: string,
  opacity: number = 1,
  blur: number = 0
): React.CSSProperties {
  if (wallpaper === 'custom' && customImageUrl) {
    return {
      backgroundImage: `url(${customImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : undefined,
    }
  }

  const wallpaperData = wallpapers[wallpaper]
  
  if (wallpaper === 'none' || !wallpaperData.pattern) {
    return {}
  }

  const baseSize = wallpaper === 'dots' ? '20px 20px' :
                   wallpaper === 'grid' ? '20px 20px, 20px 20px' :
                   wallpaper === 'geometric' ? '40px 40px, 40px 40px, 40px 40px, 40px 40px' :
                   wallpaper === 'bubbles' ? '300px 300px, 250px 250px, 280px 280px, 200px 200px' :
                   wallpaper === 'hexagon' ? '50px 50px, 50px 50px, 50px 50px, 50px 50px' :
                   '40px 40px'

  const basePosition = wallpaper === 'geometric' ? '0 0, 0 0, 20px 20px, 20px 20px' :
                       wallpaper === 'bubbles' ? '0 0, 0 0, 0 0, 0 0' :
                       wallpaper === 'hexagon' ? '0 0, 0 0, 25px 25px, 25px 25px' :
                       wallpaper === 'grid' ? '0 0, 0 0' :
                       '0 0'

  return {
    backgroundImage: wallpaperData.pattern,
    backgroundSize: baseSize,
    backgroundPosition: basePosition,
    opacity,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
  }
}
