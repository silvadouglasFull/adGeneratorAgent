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

export const colorPalettes = {
    primary: '#0ba5d5',
    secondary: '#1d1d1c',
    accent: '#33cbe5',
    text: '#1d1d1c',
    textLight: '#484848',
    border: '#a2a2a2',
    background: '#eef9f8',
} as const

export function getCSSVariablesFromPalette(): string {
    const entries = Object.entries(colorPalettes)
    const cssVars = entries
        .map(([key, value]) => {
            const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
            return `--color-${kebabKey}: ${value};`
        })
        .join(' ')

    return `:root { ${cssVars} }`
}