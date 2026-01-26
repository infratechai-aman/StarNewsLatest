'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation, languageOptions } from '@/lib/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en')

    useEffect(() => {
        // Load saved language preference from localStorage
        const savedLang = localStorage.getItem('starNewsLanguage')
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang)
        }
    }, [])

    const changeLanguage = (newLang) => {
        if (translations[newLang]) {
            setLanguage(newLang)
            localStorage.setItem('starNewsLanguage', newLang)
        }
    }

    const t = (key) => getTranslation(language, key)

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, languageOptions }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export default LanguageContext
