'use client'

import React, { createContext,  useEffect, useState } from 'react'
import { getCSSVariablesFromTheme, isThemeToggleAvailable, ThemeType } from '@/flavor/flavor'

const THEME_STORAGE_KEY = 'theme'
const THEME_STYLE_ID = 'theme-vars'

interface ThemeContextValue {
    theme: ThemeType
    toggleTheme: () => void
    isAvailable: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'light',
    toggleTheme: () => {},
    isAvailable: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeType>(() => {
        if (typeof window === 'undefined') return 'light'
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        return stored === 'dark' ? 'dark' : 'light'
    })
    const isAvailable = isThemeToggleAvailable()

    useEffect(() => {
        const styleEl = document.getElementById(THEME_STYLE_ID)
        if (styleEl) {
            styleEl.textContent = getCSSVariablesFromTheme(theme)
        }
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    }, [theme])

    function toggleTheme() {
        if (!isAvailable) return
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isAvailable }}>
            {children}
        </ThemeContext.Provider>
    )
}

export { ThemeContext }
