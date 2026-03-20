'use client'

import React from 'react'
import { useTheme } from '@/hooks/useTheme'

/**
 * Isolated button component for toggling between dark and light themes.
 *
 * Returns null if darkColors is not defined in flavor.ts — no button is rendered.
 * Can be imported and used from any component or page.
 *
 * @example
 * import { ThemeToggle } from '@/components/ThemeToggle'
 * <ThemeToggle />
 */
export function ThemeToggle(): React.JSX.Element | null {
    const { theme, toggleTheme, isAvailable } = useTheme()

    if (!isAvailable) return null

    return (
        <button
            className="btn-ghost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    )
}
