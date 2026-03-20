export const flavorName = 'Zapt AI AD GENERATOR'
export const contentDescription = 'Ad generation with Zapt AI'
export const basePathAssets = '/ds-web-flavor/assets'
export const siteWwebmanifest = `${basePathAssets}/site.webmanifest.json`
export const assets = {
    favicon_io: [
        { name: 'android-chrome-192x192.png', path: `${basePathAssets}/favicon_io/android-chrome-192x192.png` },
        { name: 'android-chrome-512x512.png', path: `${basePathAssets}/favicon_io/android-chrome-512x512.png` },
        { name: 'apple-touch-icon.png', path: `${basePathAssets}/favicon_io/apple-touch-icon.png` },
        { name: 'favicon-16x16.png', path: `${basePathAssets}/favicon_io/favicon-16x16.png` },
        { name: 'favicon-32x32.png', path: `${basePathAssets}/favicon_io/favicon-32x32.png` },
        { name: 'favicon.ico', path: `${basePathAssets}/favicon_io/favicon.ico` },
    ],
    logos: [
        { name: 'ds-web-logo.jpg', path: `${basePathAssets}`, },
        { name: 'logo.jpeg', path: `${basePathAssets}`, },
    ]
}

export type ThemeType = 'light' | 'dark'

interface ColorPalette {
    primary: string
    secondary: string
    accent: string
    text: string
    textLight: string
    border: string
    background: string
}

export const colorPalettes = {
    darkColors: {
        primary: '#111313',
        secondary: '#1f1f1e',
        accent: '#69d9ec',
        text: '#5e5e5b',
        textLight: '#c7c7c7',
        border: '#121212',
        background: '#111313'
    },
    lightColors: {
        primary: '#0ba5d5',
        secondary: '#1d1d1c',
        accent: '#33cbe5',
        text: '#1d1d1c',
        textLight: '#484848',
        border: '#a2a2a2',
        background: '#eef9f8',
    },
} as const

/** Returns true if darkColors palette is defined, enabling theme toggle */
export function isThemeToggleAvailable(): boolean {
    return !!colorPalettes.darkColors
}

/** Returns the color palette for the given theme */
export function getCurrentThemePalette(theme: ThemeType): ColorPalette {
    if (theme === 'dark' && colorPalettes.darkColors) {
        return colorPalettes.darkColors
    }
    return colorPalettes.lightColors
}

function toKebabCase(key: string): string {
    return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Generates CSS Variables string from the given theme palette */
export function getCSSVariablesFromTheme(theme: ThemeType): string {
    const palette = getCurrentThemePalette(theme)
    const cssVars = Object.entries(palette)
        .map(([key, value]) => `--color-${toKebabCase(key)}: ${value};`)
        .join(' ')
    return `:root { ${cssVars} }`
}

/** @deprecated Use getCSSVariablesFromTheme('light') instead */
export function getCSSVariablesFromPalette(): string {
    return getCSSVariablesFromTheme('light')
}