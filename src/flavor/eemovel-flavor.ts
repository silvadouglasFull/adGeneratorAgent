export const flavorName = 'Lead Plus'
export const basePathAssets = '/eemovel-flavor/assets'
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
        { name: 'logo.jpeg', path: `${basePathAssets}`, },
    ]
}

export const colorPalettes = {
    darkColors: {
        primary: '#322bcd',
        secondary: '#1a1670',
        accent: '#fff5e9',
        text: '#ffffff',
        textLight: '#d4d4d8',
        border: '#0f0b3d',
        background: '#0f0b3d'
    },
    lightColors: {
        primary: '#322bcd',
        secondary: '#5d52e0',
        accent: '#322bcd',
        text: '#1a1670',
        textLight: '#71718e',
        border: '#d4d4d8',
        background: '#fff5e9',
    },
} as const
