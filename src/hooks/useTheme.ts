'use client'

import { useContext } from 'react'
import { ThemeContext } from '@/context/ThemeContext'

/**
 * Hook to access and control the current theme.
 *
 * @returns `theme` - current active theme ('light' | 'dark')
 * @returns `toggleTheme` - function to switch between themes
 * @returns `isAvailable` - whether theme toggle is available (darkColors defined in flavor.ts)
 *
 * @example
 * const { theme, toggleTheme, isAvailable } = useTheme()
 * if (isAvailable) toggleTheme()
 */
export function useTheme() {
    return useContext(ThemeContext)
}
