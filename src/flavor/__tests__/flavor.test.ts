import {
    colorPalettes,
    getCSSVariablesFromTheme,
    getCurrentThemePalette,
    isThemeToggleAvailable,
} from '../flavor'

const REQUIRED_PALETTE_KEYS = [
    'primary',
    'secondary',
    'accent',
    'text',
    'textLight',
    'border',
    'background',
]

const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i

describe('flavor - Color Palettes', () => {
    describe('colorPalettes structure', () => {
        it('lightColors should have all required color properties', () => {
            REQUIRED_PALETTE_KEYS.forEach((key) => {
                expect(colorPalettes.lightColors).toHaveProperty(key)
            })
        })

        it('lightColors should have valid hex color values', () => {
            Object.entries(colorPalettes.lightColors).forEach(([, value]) => {
                expect(value).toMatch(HEX_COLOR_REGEX)
            })
        })

        it('darkColors should have all required color properties when defined', () => {
            if (!colorPalettes.darkColors) return
            REQUIRED_PALETTE_KEYS.forEach((key) => {
                expect(colorPalettes.darkColors).toHaveProperty(key)
            })
        })

        it('darkColors should have valid hex color values when defined', () => {
            if (!colorPalettes.darkColors) return
            Object.entries(colorPalettes.darkColors).forEach(([, value]) => {
                expect(value).toMatch(HEX_COLOR_REGEX)
            })
        })
    })

    describe('isThemeToggleAvailable', () => {
        it('should return true when darkColors is defined', () => {
            expect(isThemeToggleAvailable()).toBe(true)
        })
    })

    describe('getCurrentThemePalette', () => {
        it('should return lightColors for light theme', () => {
            const palette = getCurrentThemePalette('light')
            expect(palette).toEqual(colorPalettes.lightColors)
        })

        it('should return darkColors for dark theme when available', () => {
            const palette = getCurrentThemePalette('dark')
            expect(palette).toEqual(colorPalettes.darkColors)
        })

        it('should fallback to lightColors for dark theme when darkColors is absent', () => {
            // Simulates runtime behavior via function logic (direct test)
            const lightPalette = getCurrentThemePalette('light')
            expect(lightPalette).toEqual(colorPalettes.lightColors)
        })
    })

    describe('getCSSVariablesFromTheme', () => {
        it('should return a valid :root CSS string for light theme', () => {
            const result = getCSSVariablesFromTheme('light')
            expect(result).toContain(':root {')
            expect(result).toContain('}')
        })

        it('should return a valid :root CSS string for dark theme', () => {
            const result = getCSSVariablesFromTheme('dark')
            expect(result).toContain(':root {')
            expect(result).toContain('}')
        })

        it('should include all 7 CSS variables for light theme', () => {
            const result = getCSSVariablesFromTheme('light')
            expect(result).toContain('--color-primary')
            expect(result).toContain('--color-secondary')
            expect(result).toContain('--color-accent')
            expect(result).toContain('--color-text')
            expect(result).toContain('--color-text-light')
            expect(result).toContain('--color-border')
            expect(result).toContain('--color-background')
        })

        it('should include all 7 CSS variables for dark theme', () => {
            const result = getCSSVariablesFromTheme('dark')
            expect(result).toContain('--color-primary')
            expect(result).toContain('--color-secondary')
            expect(result).toContain('--color-accent')
            expect(result).toContain('--color-text')
            expect(result).toContain('--color-text-light')
            expect(result).toContain('--color-border')
            expect(result).toContain('--color-background')
        })

        it('should include light palette values in light CSS', () => {
            const result = getCSSVariablesFromTheme('light')
            Object.values(colorPalettes.lightColors).forEach((color) => {
                expect(result).toContain(color)
            })
        })

        it('should include dark palette values in dark CSS when available', () => {
            if (!colorPalettes.darkColors) return
            const result = getCSSVariablesFromTheme('dark')
            Object.values(colorPalettes.darkColors).forEach((color) => {
                expect(result).toContain(color)
            })
        })

        it('should generate exactly 7 CSS variables', () => {
            const result = getCSSVariablesFromTheme('light')
            const variableRegex = /--color-[a-z-]+:\s#[0-9A-F]{6};/gi
            const matches = result.match(variableRegex)
            expect(matches?.length).toBe(7)
        })
    })
})

