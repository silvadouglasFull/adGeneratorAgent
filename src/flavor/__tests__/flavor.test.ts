import { colorPalettes, getCSSVariablesFromPalette } from '../flavor'

describe('flavor - Color Palettes', () => {
    describe('colorPalettes', () => {
        it('should have all required color properties', () => {
            const requiredColors = [
                'primary',
                'secondary',
                'accent',
                'text',
                'textLight',
                'border',
                'background',
            ]

            requiredColors.forEach((color) => {
                expect(colorPalettes).toHaveProperty(color)
            })
        })

        it('should have valid hex color values', () => {
            const hexColorRegex = /^#[0-9A-F]{6}$/i

            Object.entries(colorPalettes).forEach(([, value]) => {
                expect(value).toMatch(hexColorRegex)
            })
        })

        it('should have no undefined values', () => {
            Object.entries(colorPalettes).forEach(([, value]) => {
                expect(value).toBeDefined()
                expect(value).not.toBeNull()
            })
        })
    })

    describe('getCSSVariablesFromPalette', () => {
        it('should return a valid CSS string', () => {
            const result = getCSSVariablesFromPalette()

            expect(typeof result).toBe('string')
            expect(result).toContain(':root {')
            expect(result).toContain('}')
        })

        it('should include all 7 CSS variables', () => {
            const result = getCSSVariablesFromPalette()

            expect(result).toContain('--color-primary')
            expect(result).toContain('--color-secondary')
            expect(result).toContain('--color-accent')
            expect(result).toContain('--color-text')
            expect(result).toContain('--color-text-light')
            expect(result).toContain('--color-border')
            expect(result).toContain('--color-background')
        })

        it('should include all color values from colorPalettes', () => {
            const result = getCSSVariablesFromPalette()

            Object.values(colorPalettes).forEach((color) => {
                expect(result).toContain(color)
            })
        })

        it('should have correct variable assignment syntax', () => {
            const result = getCSSVariablesFromPalette()

            // Each variable should have format: --color-name: #hexvalue;
            const variableRegex = /--color-[a-z-]+:\s#[0-9A-F]{6};/gi
            const matches = result.match(variableRegex)

            // Should have at least 7 matches (one for each color)
            expect(matches).toBeTruthy()
            expect(matches?.length).toBe(7)
        })

        it('should be a complete :root rule', () => {
            const result = getCSSVariablesFromPalette()

            expect(result).toMatch(/^:root\s*{\s*--color-.+;\s*}$/)
        })
    })
})
