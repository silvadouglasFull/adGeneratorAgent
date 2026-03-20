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
        { name: 'site.webmanifest', path: `${basePathAssets}/favicon_io/site.webmanifest` }
    ],
    logos: [
        { name: 'ds-web-logo.jpg', path: `${basePathAssets}`, },
        { name: 'logo.jpeg', path: `${basePathAssets}`, },
    ]
}

/**
 * Color palette for the ds-web flavor
 *
 * Semantic color values used throughout the application.
 * These colors are injected as CSS Variables (--color-*) in the document root.
 *
 * To customize colors for a different flavor:
 * 1. Update the values in `colorPalettes`
 * 2. No other changes needed - CSS Variables load automatically via RootLayout
 */
export const colorPalettes = {
    /** Primary brand color - main interactive elements, headers, CTAs */
    primary: '#0ba5d5',
    /** Secondary color - supporting elements, secondary buttons */
    secondary: '#1d1d1c',
    /** Accent color - highlights, emphasis, status indicators */
    accent: '#33cbe5',
    /** Primary text color - body copy, main content */
    text: '#1d1d1c',
    /** Light text color - secondary text, muted labels, helper text */
    textLight: '#484848',
    /** Border color - dividers, borders, outlines */
    border: '#a2a2a2',
    /** Background color - main background, light surfaces */
    background: '#eef9f8',
} as const

/**
 * Converts the color palette to CSS Variables string
 *
 * @returns CSS string with :root selector containing all --color-* variables
 * @example
 * const cssString = getCSSVariablesFromPalette()
 * // Returns: ":root { --color-primary: #0ba5d5; --color-secondary: #1d1d1c; ... }"
 */
export function getCSSVariablesFromPalette(): string {
    const entries = Object.entries(colorPalettes)
    const cssVars = entries
        .map(([key, value]) => {
            // Convert camelCase to kebab-case (e.g., textLight -> text-light)
            const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
            return `--color-${kebabKey}: ${value};`
        })
        .join(' ')

    return `:root { ${cssVars} }`
}